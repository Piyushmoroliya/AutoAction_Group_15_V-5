"""
autoaction_core/features.py
===========================
Shared feature-extraction helpers used identically across training,
validation calibration, Step 6 evaluation, and production `predict()`.
"""

from __future__ import annotations

from pathlib import Path

import numpy as np
import torch
from PIL import Image

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
CLIP_WEIGHTS_PATH = PROJECT_ROOT / "app" / "models_trained" / "clip_vit_b32_openai.safetensors"


def resize_long_side_256(im: Image.Image, max_side: int = 256) -> Image.Image:
    """Resizes RGB image keeping aspect ratio so longest side <= max_side."""
    rgb = im.convert("RGB")
    w, h = rgb.size
    m = max(w, h)
    if m > max_side:
        scale = max_side / float(m)
        rgb = rgb.resize((max(1, int(round(w * scale))), max(1, int(round(h * scale)))), Image.Resampling.LANCZOS)
    return rgb


def pil_to_3_views(im: Image.Image) -> tuple[Image.Image, Image.Image, Image.Image]:
    """Returns (full, top_half, bottom_half) views from a <=256px RGB image."""
    rgb = resize_long_side_256(im, max_side=256)
    w, h = rgb.size
    mid = max(1, h // 2)
    top_half = rgb.crop((0, 0, w, mid))
    bottom_half = rgb.crop((0, h // 2 if h > 1 else 0, w, h))
    return rgb, top_half, bottom_half


def encode_clip_3view_paths(
    image_paths: list[Path],
    clip_model,
    preprocess,
    batch_size: int = 32,
    progress_cb=None,
) -> np.ndarray:
    """
    Encodes a list of images into L2-normalized 1536-d CLIP ViT-B/32 vectors:
    concat(L2(full), L2(top_half), L2(bottom_half)) -> overall L2 norm.
    """
    feats = []
    n = len(image_paths)
    for start in range(0, n, batch_size):
        chunk = image_paths[start : start + batch_size]
        tensors = []
        for p in chunk:
            with Image.open(p) as im:
                v_full, v_top, v_bot = pil_to_3_views(im)
            tensors.append(preprocess(v_full))
            tensors.append(preprocess(v_top))
            tensors.append(preprocess(v_bot))
        x = torch.stack(tensors, dim=0)
        with torch.no_grad():
            emb = clip_model.encode_image(x)
            emb = emb / emb.norm(dim=-1, keepdim=True).clamp(min=1e-12)
            emb = emb.view(len(chunk), 3, -1).reshape(len(chunk), -1)
            emb = emb / emb.norm(dim=-1, keepdim=True).clamp(min=1e-12)
            feats.append(emb.cpu().numpy().astype(np.float32))
        if progress_cb and ((start // batch_size + 1) % 20 == 0 or start + len(chunk) == n):
            progress_cb(start + len(chunk), n)
    return np.vstack(feats) if feats else np.zeros((0, 1536), dtype=np.float32)
