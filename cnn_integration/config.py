"""
AutoAction — Central Configuration
===================================
All hyperparameters, paths, and settings are defined here.
Importing this module in any other module gives access to every setting.
Change values here; never hard-code them elsewhere.
"""

from pathlib import Path

# ── Reproducibility ────────────────────────────────────────────────────────
RANDOM_SEED: int = 42

# ── Paths ──────────────────────────────────────────────────────────────────
# Project root = autoaction/ directory (parent of the cnn/ package)
PROJECT_ROOT: Path = Path(__file__).resolve().parent.parent

DATA_DIR: Path = PROJECT_ROOT / "data"
TRAIN_DIR: Path = DATA_DIR / "train"
VAL_DIR: Path = DATA_DIR / "validation"
TEST_DIR: Path = DATA_DIR / "test"

MODEL_DIR: Path = PROJECT_ROOT / "models"
MODELS_DIR: Path = MODEL_DIR  # Alias for compatibility
OUTPUT_DIR: Path = PROJECT_ROOT / "outputs"
METRICS_DIR: Path = OUTPUT_DIR / "metrics"
PLOTS_DIR: Path = OUTPUT_DIR / "plots"
LOGS_DIR: Path = OUTPUT_DIR / "logs"
REPORTS_DIR: Path = OUTPUT_DIR / "reports"
SAMPLE_IMAGES_DIR: Path = PROJECT_ROOT / "sample_images"

# Key saved-file names
BEST_MODEL_PATH: Path = MODEL_DIR / "best_model.pth"
CLASS_NAMES_PATH: Path = MODEL_DIR / "class_names.json"
TRAINING_HISTORY_PATH: Path = MODEL_DIR / "training_history.json"
TRAINING_CONFIG_PATH: Path = MODEL_DIR / "training_config.json"
OCR_ENGINE_CONFIG_PATH: Path = MODEL_DIR / "ocr_engine.json"
DECISION_LOG_PATH: Path = LOGS_DIR / "decisions.jsonl"

# ── Dataset ────────────────────────────────────────────────────────────────
# 7 Active document classes for AutoAction
CLASSES: list[str] = [
    "academic_material",
    "assignment",
    "event",
    "examination",
    "notice",
    "other",
    "payment",
]

# Dataset split ratios (must sum to 1.0)
TRAIN_SPLIT: float = 0.70
VAL_SPLIT: float = 0.15
TEST_SPLIT: float = 0.15

# Minimum images per class to warn (not block) training
MIN_IMAGES_PER_CLASS: int = 20

# ── Image Preprocessing ────────────────────────────────────────────────────
IMAGE_SIZE: int = 224           # MobileNetV3 native size (also works for EfficientNet-B0)
# ImageNet normalization stats (used by all pretrained torchvision models)
IMAGENET_MEAN: list[float] = [0.485, 0.456, 0.406]
IMAGENET_STD: list[float] = [0.229, 0.224, 0.225]

# ── Training ───────────────────────────────────────────────────────────────
BATCH_SIZE: int = 32            # Larger dataset → bigger batch for stable gradients
NUM_WORKERS: int = 0            # Windows-safe (>0 can cause issues on Windows)
PIN_MEMORY: bool = False        # Set True only if using CUDA

# Stage 1 — frozen backbone, train head only
LEARNING_RATE: float = 1e-3
NUM_EPOCHS: int = 25            # Optimal epochs for head convergence
PATIENCE: int = 6               # Early stopping patience
LR_PATIENCE: int = 3            # ReduceLROnPlateau patience
LR_FACTOR: float = 0.5          # LR reduction factor

# Stage 2 — optional fine-tuning (run with --finetune flag)
FINETUNE_LR: float = 5e-5       # Low LR for fine-tuning backbone
FINETUNE_EPOCHS: int = 20
FINETUNE_PATIENCE: int = 5
UNFREEZE_LAST_N_BLOCKS: int = 4  # Unfreeze last 4 blocks for deep fine-tuning

# ── Model ──────────────────────────────────────────────────────────────────
# Supported values: "mobilenet_v3_small", "mobilenet_v3_large", "efficientnet_b0"
MODEL_NAME: str = "mobilenet_v3_small"
DROPOUT_RATE: float = 0.3
HIDDEN_DIM: int = 256           # Head hidden layer size

# ── Inference / Decision Engine (Single Source of Truth) ───────────────────
CONFIDENCE_THRESHOLD: float = 0.60              # Tuned on expanded data/val (n=358, Step 5)
TEXT_OVERRIDE_CONFIDENCE_THRESHOLD: float = 0.80  # Text overrides CNN disagreement when > 0.80
CNN_DOMINANT_THRESHOLD: float = 0.80            # CNN overrides weak text when CNN >= 0.80 & text < 0.50
TEXT_WEAK_THRESHOLD: float = 0.50               # Weak text threshold for CNN dominant rule
FUSION_REJECTION_THRESHOLD: float = 0.45        # Tuned on expanded data/val (n=358, Step 5)
FUSION_MARGIN_THRESHOLD: float = 0.05           # Tuned on expanded data/val (n=358, Step 5)
FUSION_FIELD_BOOST: float = 0.35                # Field evidence additive fusion boost (tuned on data/val)
MIN_FIELDS_FOR_ACTIONABLE: int = 1              # At least 1 field must be extracted

# ── Synthetic Dataset Generator ────────────────────────────────────────────
# Images per category per split (train/val/test)
SYNTHETIC_IMAGES_PER_CLASS: dict[str, int] = {
    "train": 60,
    "validation": 15,
    "test": 15,
}

# ── Evaluation ─────────────────────────────────────────────────────────────
# Average method for precision/recall/F1 in sklearn
AVERAGE_METHOD: str = "macro"
