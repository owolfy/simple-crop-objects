from flask import Flask, request, jsonify
from flask_cors import CORS
import base64
from ultralytics import FastSAM
import time
# import tempfile # this doesnt work good with fastsam model save_crop
import os
import numpy as np
from utils.image_processing import process_base64_image, perform_cleanup  # Import the new utility function
import logging

# install lapx # this is required by ultralytics

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "http://localhost:5173"}})
model = None
current_dir = None
temp_dir = None
is_warmup_model = True

def warm_up_model(model):
    if not is_warmup_model:
        return
    """
    Perform a warm-up inference to initialize model weights and compile any optimizations.
    """
    logging.info("Warming up model...")
    start_time = time.time()
    # Create a small dummy image (100x100 RGB)
    dummy_image = np.zeros((50, 50, 3), dtype=np.uint8)
    # Perform a dummy inference
    model(dummy_image, labels=[1], conf=0.5)
    logging.info(f"Model warm-up completed in {time.time() - start_time:.2f} seconds")

def initialize_app():
    global model, current_dir, temp_dir
    model = FastSAM("models/FastSAM-s.pt")
    warm_up_model(model)
    current_dir = os.path.dirname(os.path.abspath(__file__))
    temp_dir = os.path.join(current_dir, 'temp')
    os.makedirs(temp_dir, exist_ok=True)

@app.route('/api/crop', methods=["POST"])
def crop_image():
    data = request.json
    x = data.get('x')
    y = data.get('y')
    image_data = data.get('image')

    if not all([x, y, image_data]):
        return jsonify({'error': 'Missing required data'}), 400

    try:
        # Process the image
        original_image, image_np, temp_image_path = process_base64_image(image_data, temp_dir, x, y)

        # Process with model
        results = model(source=image_np, points=[[x, y]], labels=[1], conf=0.5, save_crop=True)
        crop_data = []

        for i, result in enumerate(results):
            if hasattr(result, 'boxes') and len(result.boxes) > 0:
                for j, box in enumerate(result.boxes):
                    # Get the bounding box coordinates
                    xyxy = box.xyxy[0].tolist()

                    # Crop the image
                    cropped_image = original_image.crop(xyxy)

                    crop_path = os.path.join(temp_dir, f'crop_{i}_{j}.jpg')
                    cropped_image.save(crop_path, quality=95)

                    try:
                        with open(crop_path, 'rb') as crop_file:
                            crop_bytes = crop_file.read()
                            file_size = len(crop_bytes)
                            if file_size > 0:
                                crop_base64 = base64.b64encode(crop_bytes).decode('utf-8')
                                crop_data.append({
                                    'image': f'data:image/jpeg;base64,{crop_base64}'
                                })
                            else:
                                logging.warning(f"File is empty for crop {i}_{j}")
                    except IOError as e:
                        logging.error(f"Error reading file for crop {i}_{j}: {e}")
            else:
                logging.warning(f"No bounding boxes found for result {i}")

        logging.info(f"Number of crops processed: {len(crop_data)}")

        # Perform all cleanup operations
        perform_cleanup(temp_dir, current_dir)

        if not crop_data:
            return jsonify({'error': 'No crops were generated'}), 404

        return jsonify(crop_data), 200

    except Exception as e:
        logging.error(f"Error occurred: {str(e)}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    initialize_app()
    app.run(debug=True)