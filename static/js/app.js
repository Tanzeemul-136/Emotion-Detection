document.addEventListener("DOMContentLoaded", () => {
    const video = document.getElementById('webcam');
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    const resultDiv = document.getElementById('emotion-result');
    const emojiDiv = document.getElementById('emotion-emoji'); // Added emoji tracking element

    // Emoji mapping configuration dictionary
    const emojiMap = {
        'Happy': '😊', 'Sad': '😢', 'Angry': '😡', 'Fear': '😨',
        'Disgust': '🤢', 'Surprise': '😲', 'Neutral': '😐',
        'No Face Detected': '🔍', 'Processing Error': '⚠️'
    };

    // 1. Request access to the user's webcam camera stream
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } })
            .then(stream => {
                video.srcObject = stream;
                video.play();
            })
            .catch(err => {
                console.error("Error accessing webcam: ", err);
                resultDiv.innerText = "Webcam Error";
                resultDiv.style.color = "#ef4444";
            });
    } else {
        resultDiv.innerText = "Webcam not supported";
    }

    // 2. Function to capture a frame and send it to Flask for emotion detection
    function captureAndPredict() {
        if (video.videoWidth === 0 || video.videoHeight === 0) return;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);

        fetch('/predict', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: dataUrl })
        })
        .then(response => response.json())
        .then(data => {
            if (data.emotion && resultDiv.innerText !== data.emotion) {
                
                // 🔥 JAVASCRIPT ANIMATION TRIGGER: Fires spring pop class only on changes
                if (emojiDiv) {
                    emojiDiv.classList.remove('emoji-bounce');
                    void emojiDiv.offsetWidth; // DOM trick: forces browser animation cycle reset
                    emojiDiv.classList.add('emoji-bounce');
                    emojiDiv.innerText = emojiMap[data.emotion] || '🤔';
                }

                resultDiv.innerText = data.emotion;
                updateUITheme(data.emotion);
            }
        })
        .catch(error => {
            console.error("API Prediction Error:", error);
        });
    }

    // 3. Dynamic styling layout adjustment based on detected emotion
    function updateUITheme(emotion) {
        // Neon color states matching live telemetry shifts
        if (emotion === 'Happy') {
            resultDiv.style.color = '#00da66'; // Vibrant Green
            resultDiv.style.textShadow = '0 0 15px rgba(0, 218, 102, 0.4)';
        } else if (emotion === 'Angry' || emotion === 'Fear') {
            resultDiv.style.color = '#ff3b30'; // Crimson Red
            resultDiv.style.textShadow = '0 0 15px rgba(255, 59, 48, 0.4)';
        } else if (emotion === 'Sad') {
            resultDiv.style.color = '#007aff'; // Royal Blue
            resultDiv.style.textShadow = '0 0 15px rgba(0, 122, 255, 0.4)';
        } else if (emotion === 'Surprise') {
            resultDiv.style.color = '#ff9500'; // Amber Orange
            resultDiv.style.textShadow = '0 0 15px rgba(255, 149, 0, 0.4)';
        } else {
            resultDiv.style.color = '#1e293b'; // Charcoal Dark Slate
            resultDiv.style.textShadow = 'none';
        }
    }

    // 4. Stream frame cycle hook
    video.addEventListener('loadedmetadata', () => {
        setInterval(captureAndPredict, 600);
    });
});