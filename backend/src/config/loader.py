import hydra
from omegaconf import DictConfig, OmegaConf

@hydra.main(version_base=None, config_path="../../configs", config_name="model")
def main(cfg: DictConfig) -> None:
    print(OmegaConf.to_yaml(cfg))
    # cfg.model.d_model, cfg.train.lr, etc. — fully typed access
    return cfg

if __name__ == "__main__":
    main()
