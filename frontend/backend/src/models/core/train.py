import torch
import mlflow
import hydra
from omegaconf import DictConfig
from codecarbon import EmissionsTracker
from src.models.core.st_graph_attention_transformer import MAADGTransformer, total_loss


def train_model(model, train_loader, val_loader, edge_index_fn, cfg: DictConfig):
    """Core training loop with early stopping, grad clipping, MLflow logging,
    and carbon tracking (Ch.20.3). Returns the best-checkpoint model."""
    optimizer = torch.optim.AdamW(model.parameters(), lr=cfg.train.lr, weight_decay=cfg.train.weight_decay)
    scheduler = torch.optim.lr_scheduler.ReduceLROnPlateau(optimizer, patience=5, factor=0.5)
    best_val_loss, patience_ctr = float("inf"), 0

    tracker = EmissionsTracker(project_name="aqi-forecast", log_level="error")  # for Ch.20
    tracker.start()

    with mlflow.start_run():
        mlflow.log_params({
            "lr": cfg.train.lr, "epochs": cfg.train.epochs, "d_model": cfg.model.d_model,
            "graph_type": cfg.graph.type, "seed": cfg.train.seed, "model": "MAADGTransformer",
        })

        for epoch in range(cfg.train.epochs):
            model.train()
            train_loss = 0.0
            for batch in train_loader:
                x, target, weather, urban_context, aux_target = batch
                graph = edge_index_fn(weather, urban_context)

                optimizer.zero_grad()
                pred, aux_pred = model(
                    x, graph.edge_index, graph.edge_weight, graph.relation_type, n_stations=x.shape[0]
                )
                loss = total_loss(
                    pred, target, tuple(cfg.model.quantiles),
                    aux_pred=aux_pred, aux_target=aux_target,
                    edge_index=graph.edge_index, edge_weight=graph.edge_weight,
                )
                loss.backward()
                torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=cfg.train.grad_clip_norm)
                optimizer.step()
                train_loss += loss.item()

            model.eval()
            val_loss = 0.0
            with torch.no_grad():
                for batch in val_loader:
                    x, target, weather, urban_context, aux_target = batch
                    graph = edge_index_fn(weather, urban_context)
                    pred, aux_pred = model(
                        x, graph.edge_index, graph.edge_weight, graph.relation_type, n_stations=x.shape[0]
                    )
                    val_loss += total_loss(
                        pred, target, tuple(cfg.model.quantiles),
                        aux_pred=aux_pred, aux_target=aux_target,
                        edge_index=graph.edge_index, edge_weight=graph.edge_weight,
                    ).item()

            val_loss /= len(val_loader)
            scheduler.step(val_loss)
            mlflow.log_metrics({
                "train_loss": train_loss / len(train_loader), "val_loss": val_loss,
                "lr": optimizer.param_groups[0]["lr"],
            }, step=epoch)

            if val_loss < best_val_loss:
                best_val_loss, patience_ctr = val_loss, 0
                torch.save(model.state_dict(), "models/best_model.pt")
                mlflow.log_artifact("models/best_model.pt")
            else:
                patience_ctr += 1
                if patience_ctr >= cfg.train.patience:
                    print(f"Early stopping at epoch {epoch}")
                    break

        emissions_kg = tracker.stop()
        if emissions_kg is not None:
            mlflow.log_metric("training_co2_kg", emissions_kg)

    return model


@hydra.main(version_base=None, config_path="../../../configs", config_name="model")
def main(cfg: DictConfig):
    """Hydra entry point: `python -m src.models.core.train`."""
    import random
    import numpy as np

    # Reproducibility
    seed = cfg.train.seed
    torch.manual_seed(seed)
    random.seed(seed)
    np.random.seed(seed)

    model = MAADGTransformer(
        n_features=cfg.model.get("n_features", 50),
        n_pollutants=cfg.model.get("n_pollutants", 6),
        horizons=tuple(cfg.model.horizons),
        quantiles=tuple(cfg.model.quantiles),
        d_model=cfg.model.d_model,
        n_heads=cfg.model.n_heads,
        n_temporal_layers=cfg.model.n_temporal_layers,
        n_gat_layers=cfg.model.n_gat_layers,
        gat_heads=cfg.model.gat_heads,
        seq_len=cfg.model.seq_len,
        dropout=cfg.model.dropout,
    )
    print(f"Model parameters: {sum(p.numel() for p in model.parameters()):,}")
    print("Training pipeline ready. Provide train/val loaders via the data module.")
    print("See src/features/build_dataset.py and src/feature_store/offline_store.py to build dataloaders.")


if __name__ == "__main__":
    main()
