# Copilot Instructions for AI Pothole Detection using YOLOv12

## Project Overview
This is a computer vision project for automated pothole detection using YOLOv12 object detection model. The project focuses on training, evaluating, and deploying an AI model to identify potholes in road infrastructure.

## Key Architectural Components

### Model Training & Development
- **YOLOv12 Model**: State-of-the-art real-time object detection architecture
- **Dataset Management**: Pothole images with bounding box annotations
- **Training Pipeline**: Data preprocessing, model training, validation, and testing
- **Model Artifacts**: Saved weights, configurations, and inference checkpoints

### Data Flow
1. **Data Collection** → Prepare pothole images with annotations
2. **Preprocessing** → Resize, normalize, and augment images
3. **Training** → Fine-tune YOLOv12 on pothole dataset
4. **Evaluation** → Metrics (mAP, precision, recall, F1-score)
5. **Inference** → Deploy model for real-time pothole detection
6. **Visualization** → Display detection results with bounding boxes

## Project Structure (To Be Implemented)
```
├── data/                 # Dataset (images, annotations)
│   ├── raw/             # Original images
│   ├── processed/       # Preprocessed data
│   └── splits/          # Train/val/test splits
├── models/              # Model checkpoints and weights
├── notebooks/           # Jupyter notebooks for exploration
├── src/                 # Source code
│   ├── train.py        # Training script
│   ├── inference.py    # Inference pipeline
│   ├── evaluate.py     # Evaluation metrics
│   └── utils/          # Helper functions
├── configs/             # Configuration files (model, training params)
├── results/             # Training logs, metrics, visualizations
└── requirements.txt     # Python dependencies
```

## Essential Dependencies
- **PyTorch**: Deep learning framework
- **YOLOv12**: Ultralytics YOLO implementation
- **OpenCV**: Image processing
- **NumPy/Pandas**: Data manipulation
- **Matplotlib/Seaborn**: Visualization
- **Scikit-learn**: Metrics and evaluation

## Common Developer Workflows

### Training a Model
```bash
python src/train.py --config configs/train_config.yaml --epochs 100 --batch-size 16
```

### Running Inference
```bash
python src/inference.py --model models/best.pt --source data/test_images/ --conf 0.5
```

### Evaluating Performance
```bash
python src/evaluate.py --model models/best.pt --test-data data/splits/test.txt
```

## Project-Specific Patterns & Conventions

### Model Configuration
- Use YAML files for hyperparameters (learning rate, batch size, augmentation)
- Store model metadata with timestamps for reproducibility
- Version model checkpoints with validation metrics

### Data Handling
- Follow standard YOLO dataset format (class indices, normalized bbox coordinates)
- Images stored separately from annotations for flexibility
- Maintain train/val/test splits to prevent data leakage

### Code Organization
- Keep preprocessing logic in separate utility modules
- Use configuration files instead of hardcoding parameters
- Log training metrics for experiment tracking (metrics.csv, logs/)
- Store inference results with timestamp and model version

## Integration Points

### External Dependencies
- **Ultralytics YOLO**: Model definitions and training utilities
- **PyTorch Hub**: Pretrained model downloading
- **OpenCV**: Real-time video/image processing

### Cross-Component Communication
- Training pipeline outputs model weights → Used by inference
- Evaluation metrics inform model selection and hyperparameter tuning
- Dataset splits ensure consistent train/val/test evaluation

## Tips for Productivity

1. **Start with configuration**: Define model and training params in YAML before coding
2. **Use experiment tracking**: Log all training runs with config, metrics, and timestamps
3. **Modularize preprocessing**: Create reusable data augmentation and normalization functions
4. **Validate datasets first**: Check annotations, image dimensions, and class distribution
5. **Monitor training**: Use callbacks for early stopping and learning rate scheduling
6. **Test inference early**: Validate model output format before full deployment
