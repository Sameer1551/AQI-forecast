import torch
import torch.distributed as dist
from torch.nn.parallel import DistributedDataParallel as DDP

def setup_ddp(rank: int, world_size: int):
    dist.init_process_group("nccl", rank=rank, world_size=world_size)
    torch.cuda.set_device(rank)

def wrap_model_ddp(model, rank):
    model = model.to(rank)
    return DDP(model, device_ids=[rank])
