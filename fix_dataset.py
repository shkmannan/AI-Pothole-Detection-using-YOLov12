import os
import shutil
import random
from pathlib import Path

print("Fixing dataset structure...")

dataset_dir = Path('pothole-detection-1')
train_dir = dataset_dir / 'train'
valid_dir = dataset_dir / 'valid'

# Check current structure
print("\nCurrent structure:")
print(f"  train: {'EXISTS' if train_dir.exists() else 'MISSING'}")
print(f"  valid: {'EXISTS' if valid_dir.exists() else 'MISSING'}")

# If valid doesn't exist, create it by splitting train
if not valid_dir.exists():
    print("\nCreating validation set from training data (80/20 split)...")
    
    # Create directories
    (valid_dir / 'images').mkdir(parents=True, exist_ok=True)
    (valid_dir / 'labels').mkdir(parents=True, exist_ok=True)
    
    # Get all images from train
    train_images = list((train_dir / 'images').glob('*.*'))
    
    # Shuffle and split (80% train, 20% valid)
    random.shuffle(train_images)
    split_idx = int(len(train_images) * 0.8)
    
    valid_images = train_images[split_idx:]
    
    print(f"  Total images: {len(train_images)}")
    print(f"  Moving {len(valid_images)} images to validation set...")
    
    # Move images and labels to valid
    for img_path in valid_images:
        # Move image
        shutil.move(str(img_path), str(valid_dir / 'images' / img_path.name))
        
        # Move corresponding label
        label_name = img_path.stem + '.txt'
        label_path = train_dir / 'labels' / label_name
        if label_path.exists():
            shutil.move(str(label_path), str(valid_dir / 'labels' / label_name))
    
    print("Validation set created!")
else:
    print("Validation folder already exists!")

# Count final images
train_count = len(list((train_dir / 'images').glob('*.*')))
valid_count = len(list((valid_dir / 'images').glob('*.*'))) if valid_dir.exists() else 0

print(f"\nFinal dataset:")
print(f"  Training images: {train_count}")
print(f"  Validation images: {valid_count}")

# Read original data.yaml to get class names
import yaml
original_yaml = dataset_dir / 'data.yaml'
with open(original_yaml, 'r') as f:
    original_data = yaml.safe_load(f)

# Create corrected data.yaml
yaml_content = f"""path: {str(dataset_dir.absolute())}
train: train/images
val: valid/images

nc: {original_data.get('nc', 1)}
names: {original_data.get('names', ['pothole'])}
"""

with open('data_corrected.yaml', 'w') as f:
    f.write(yaml_content)

print("\nCreated: data_corrected.yaml")
print("\nReady to train! Run: python train.py")