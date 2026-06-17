import os
import sys

# CRITICAL WINDOWS FIX: Disable heavy hardware optimizations and logs before importing TF
os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'

import base64
import numpy as np

print("=============================================")
print("System initialization: Testing core libraries...")
print("=============================================")

try:
    import cv2
    print("-> OpenCV loaded successfully.")
    import flask
    from flask import Flask, render_template, request, jsonify
    print("-> Flask loaded successfully.")
    
    print("Loading TensorFlow (This might take 10-15 seconds, please wait)...")
    import tensorflow as tf
    from tensorflow.keras.models import load_model
    print("-> TensorFlow/Keras loaded successfully.")
except Exception as e:
    print(f"\n[CRASH DETECTED DURING IMPORT]: {e}")
    sys.exit(1)

print("=============================================\n")

app = Flask(__name__)

# 1. Load your trained model and OpenCV's Face Detector
try:
    model = load_model('emotion_model.h5')
    print("Successfully loaded 'emotion_model.h5'")
except Exception as e:
    print(f"CRITICAL ERROR: Could not load model file: {e}")
    print("Make sure your downloaded 'emotion_model.h5' is in this exact folder.")

face_haar_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

# FER-2013 target emotion categories
EMOTIONS = ['Angry', 'Disgust', 'Fear', 'Happy', 'Sad', 'Surprise', 'Neutral']

@app.route('/')
def index():
    """Renders the main dashboard interface"""
    return render_template('index.html')

@app.route('/predict', methods=['POST'])
def predict():
    """Receives webcam frame, runs face detection, predicts emotion"""
    try:
        data = request.json['image']
        
        # Decode the Base64 frame string received from the frontend javascript
        encoded_data = data.split(',')[1]
        nparr = np.frombuffer(base64.b64decode(encoded_data), np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        # Convert to grayscale to match model training parameters
        gray_img = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        faces_detected = face_haar_cascade.detectMultiScale(gray_img, 1.1, 4)
        
        for (x, y, w, h) in faces_detected:
            # Crop out the face region
            roi_gray = gray_img[y:y+w, x:x+h]
            roi_gray = cv2.resize(roi_gray, (48, 48))
            
            # Normalize pixel signals down to 0-1
            img_pixels = np.array(roi_gray) / 255.0
            img_pixels = np.expand_dims(img_pixels, axis=0)
            img_pixels = np.expand_dims(img_pixels, axis=-1)
            
            # Forward pass calculations through the CNN
            predictions = model.predict(img_pixels, verbose=0)
            max_index = int(np.argmax(predictions[0]))
            
            return jsonify({"emotion": EMOTIONS[max_index]})
            
        return jsonify({"emotion": "No Face Detected"})
        
    except Exception as e:
        return jsonify({"emotion": "Processing Error", "details": str(e)})

# Force engine boot execution directly
import os

if __name__ == '__main__':
    # Render assigns a dynamic port variable to your app. If it's not found, default to 5000.
    port = int(os.environ.get("PORT", 5000))
    
    # 🚨 CRITICAL CHANGE: Bind host to 0.0.0.0 instead of 127.0.0.1
    app.run(host='0.0.0.0', port=port, debug=False)
