# Emotion Detection Application

This is a machine learning-powered web application designed to detect human emotions from facial expressions using images or live webcam feeds.

## Technical Architecture
* **Frontend:** Streamlit / HTML5 / CSS3
* **Backend:** Python 3.11 / FastAPI
* **Machine Learning Framework:** OpenCV, TensorFlow / Keras, or PyTorch
* **Database:** SQLite (for storing user logs and historical metrics)

## Core Features
1. **Real-time Detection:** Process live video streams to identify emotions (Happy, Sad, Angry, Surprise, Neutral).
2. **Image Upload:** Users can upload static images (`.jpg`, `.png`) for facial expression processing.
3. **Analytics Dashboard:** Visual logs displaying past detection percentages over time.

## System Dependencies
* Requires access to system webcams (`/dev/video0` or native OS camera drivers).
* External API connectivity for supplementary model weight downloads.

## Local Configuration
To run this application locally, ensure you have the required environment variables:
`PORT=8501`
`MODEL_PATH=./models/emotion_weights.h5`

## Execution Command
The application is started by running:
```bash
python -m streamlit run app.py
