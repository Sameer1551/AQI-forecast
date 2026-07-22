import torch
from src.models.core.st_graph_attention_transformer import total_loss


def finetune_output_head(pretrained_model, city_train_loader, edge_index_fn, cfg,
                          freeze_backbone: bool = True, n_epochs: int = 10):
    """Fine-tunes only the output head (and optionally the fusion MLP) on a new
    city's data, freezing the temporal/spatial encoders — cheap, fast, and a
    principled way to adapt to a held-out city without full retraining.

    Args:
        pretrained_model: A trained MAADGTransformer with loaded weights.
        city_train_loader: DataLoader for the new city's (small) labelled dataset.
        edge_index_fn: Callable(weather, urban) -> MAADGOutput
        cfg: Hydra DictConfig with train.* and model.* fields.
        freeze_backbone: If True, freezes temporal + spatial encoders.
        n_epochs: Number of fine-tuning epochs (typically 5–20).
    """
    if freeze_backbone:
        for p in pretrained_model.temporal.parameters():
            p.requires_grad = False
        for p in pretrained_model.spatial.parameters():
            p.requires_grad = False

    optimizer = torch.optim.AdamW(
        filter(lambda p: p.requires_grad, pretrained_model.parameters()),
        lr=cfg.train.lr * 0.1,  # lower LR for fine-tuning — avoids overwriting pretrained representations
        weight_decay=cfg.train.weight_decay,
    )

    pretrained_model.train()
    for epoch in range(n_epochs):
        epoch_loss = 0.0
        for batch in city_train_loader:
            x, target, weather, urban_context, aux_target = batch
            graph = edge_index_fn(weather, urban_context)

            optimizer.zero_grad()
            pred, aux_pred = pretrained_model(
                x, graph.edge_index, graph.edge_weight, graph.relation_type,
                n_stations=x.shape[0],
            )
            loss = total_loss(
                pred, target, tuple(cfg.model.quantiles),
                aux_pred=aux_pred, aux_target=aux_target,
                edge_index=graph.edge_index, edge_weight=graph.edge_weight,
            )
            loss.backward()
            torch.nn.utils.clip_grad_norm_(pretrained_model.parameters(), max_norm=cfg.train.grad_clip_norm)
            optimizer.step()
            epoch_loss += loss.item()

        print(f"Finetune epoch {epoch + 1}/{n_epochs}: loss={epoch_loss / max(len(city_train_loader), 1):.4f}")

    # Un-freeze the backbone weights (important if the model object is reused downstream)
    if freeze_backbone:
        for p in pretrained_model.parameters():
            p.requires_grad = True

    return pretrained_model
