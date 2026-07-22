import optuna
import mlflow
import torch
from src.models.core.train import train_model
from src.models.core.st_graph_attention_transformer import MAADGTransformer, total_loss


def evaluate_val_loss(model, val_loader, edge_index_fn, quantiles) -> float:
    """Compute mean validation loss on the given loader after training."""
    model.eval()
    total = 0.0
    with torch.no_grad():
        for batch in val_loader:
            x, target, weather, urban_context, aux_target = batch
            graph = edge_index_fn(weather, urban_context)
            pred, aux_pred = model(
                x, graph.edge_index, graph.edge_weight, graph.relation_type, n_stations=x.shape[0]
            )
            total += total_loss(pred, target, quantiles, aux_pred=aux_pred, aux_target=aux_target,
                                edge_index=graph.edge_index, edge_weight=graph.edge_weight).item()
    return total / max(len(val_loader), 1)


def objective(trial: optuna.Trial, train_loader, val_loader, edge_index_fn, n_features, cfg) -> float:
    d_model = trial.suggest_categorical("d_model", [32, 48, 64, 96])
    n_heads = trial.suggest_categorical("n_heads", [2, 4, 8])
    n_gat_layers = trial.suggest_int("n_gat_layers", 1, 3)
    dropout = trial.suggest_float("dropout", 0.05, 0.3)
    lr = trial.suggest_float("lr", 1e-4, 5e-3, log=True)
    weight_decay = trial.suggest_float("weight_decay", 1e-6, 1e-3, log=True)

    if d_model % n_heads != 0:
        raise optuna.TrialPruned()  # invalid combination — skip cheaply, don't waste a full run

    model = MAADGTransformer(
        n_features=n_features, d_model=d_model, n_heads=n_heads, n_gat_layers=n_gat_layers,
        gat_heads=n_heads, quantiles=tuple(cfg.model.quantiles), dropout=dropout,
    )
    cfg.train.lr, cfg.train.weight_decay, cfg.train.epochs = lr, weight_decay, 30  # short budget for search
    trained = train_model(model, train_loader, val_loader, edge_index_fn, cfg)

    val_loss = evaluate_val_loss(trained, val_loader, edge_index_fn, tuple(cfg.model.quantiles))
    return val_loss


def run_hpo(train_loader, val_loader, edge_index_fn, n_features, cfg, n_trials=40):
    study = optuna.create_study(
        direction="minimize",
        sampler=optuna.samplers.TPESampler(seed=cfg.train.seed),
        pruner=optuna.pruners.MedianPruner(n_warmup_steps=5),
    )
    study.optimize(
        lambda t: objective(t, train_loader, val_loader, edge_index_fn, n_features, cfg),
        n_trials=n_trials,
    )
    with mlflow.start_run(run_name="hpo_best"):
        mlflow.log_params(study.best_params)
        mlflow.log_metric("best_val_loss", study.best_value)
    return study.best_params
