from PIL import Image
import base64
import io
import numpy as np
import os
import shutil
from typing import Optional


def process_base64_image(image_data: str, temp_dir: str, x: int, y: int) -> tuple[Image.Image, np.ndarray, str]:
    """
    Process a base64 encoded image and save it to a temporary file.

    Args:
        image_data (str): Base64 encoded image data
        temp_dir (str): Directory to save temporary files
        x (int): X coordinate for logging
        y (int): Y coordinate for logging

    Returns:
        tuple: (
            PIL.Image.Image: Original image object,
            np.ndarray: Image as numpy array,
            str: Path to saved temporary image
        )
    """
    # Strip base64 prefix if present
    if image_data.startswith('data:image/jpeg;base64,'):
        image_data = image_data.split(',')[1]

    # Decode base64 to bytes
    image_bytes = base64.b64decode(image_data)

    # Create PIL Image
    original_image = Image.open(io.BytesIO(image_bytes))

    # Convert to numpy array
    image_np = np.array(original_image)

    # Save temporary file
    temp_image_path = os.path.join(temp_dir, 'temp_image.jpg')
    original_image.save(temp_image_path, quality=95)
    print(f"Original image saved at: {temp_image_path} {x} {y}")

    return original_image, image_np, temp_image_path


def cleanup_temp_directory(temp_dir: str) -> None:
    """
    Clean up all files in the temporary directory.

    Args:
        temp_dir (str): Path to temporary directory
    """
    for filename in os.listdir(temp_dir):
        file_path = os.path.join(temp_dir, filename)
        try:
            if os.path.isfile(file_path):
                os.unlink(file_path)
                print(f"Removed file: {file_path}")
        except Exception as e:
            print(f"Error removing file {file_path}: {e}")


def cleanup_segment_runs(base_dir: str) -> None:
    """
    Remove the runs/segment folder created by the model.

    Args:
        base_dir (str): Base directory where runs/segment is located
    """
    runs_segment_path = os.path.join(base_dir, 'runs', 'segment')
    if os.path.exists(runs_segment_path):
        try:
            shutil.rmtree(runs_segment_path)
            print(f"Removed directory: {runs_segment_path}")
        except OSError as e:
            print(f"Error removing directory {runs_segment_path}: {e}")
    else:
        print(f"Directory not found: {runs_segment_path}")


def perform_cleanup(temp_dir: str, base_dir: Optional[str] = None) -> None:
    """
    Perform all cleanup operations.

    Args:
        temp_dir (str): Path to temporary directory
        base_dir (Optional[str]): Base directory for runs/segment cleanup.
                                If None, temp_dir's parent is used.
    """
    cleanup_temp_directory(temp_dir)
    cleanup_segment_runs(base_dir if base_dir else os.path.dirname(temp_dir))