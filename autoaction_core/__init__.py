"""
autoaction_core
===============
Clean inference package wrapping AutoAction's calibrated multimodal ensemble
(ResNet18 + 3-View CLIP LR + OCR Text Classifier + CLIP+OCR Multimodal LR)
with field extraction and safety gating.
"""

from autoaction_core.predictor import AutoActionPredictor, predict

__all__ = ["AutoActionPredictor", "predict"]
