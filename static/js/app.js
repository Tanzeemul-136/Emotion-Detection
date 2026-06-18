document.addEventListener("DOMContentLoaded", () => {
    const video = document.getElementById('webcam');
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    const resultDiv = document.getElementById('emotion-result');
    const emojiDiv = document.getElementById('emotion-emoji');
    const switchBtn = document.getElementById('switch-camera-btn'); // Hook the button

    let currentStream = null;
    let currentFacingMode = "user"; // Default to selfie front camera

    // Emoji mapping configuration dictionary
    const emojiMap = {
        'Happy': '😊', 'Sad': '😢', 'Angry': '😡', 'Fear': '😨',
        'Disgust': '🤢', 'Surprise': '😲', 'Neutral': '😐',
        'No Face Detected': '🔍', 'Processing Error': '⚠️'
    };

    // 1. Dynamic function to handle camera allocation and switching
    function startCamera(facingMode) {
        // Stop active hardware streams to prevent camera resource freezing errors
        if (currentStream) {
            currentStream.getTracks().forEach(track => track.stop());
        }

        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            navigator.mediaDevices.getUserMedia({ 
                video: { 
                    facingMode: facingMode,
                    width: { ideal: 640 }, 
                    height: { ideal: 480 } 
                } 
            })
            .then(stream => {
                currentStream = stream;
                video.srcObject = stream;
                video.play();

                // Mirror selfie view only (front camera) for natural interaction
                if (facingMode === "user") {
                    video.style.transform = "scaleX(-1)";
                } else {
                    video.style.transform = "scaleX(1)"; // Keep environmental back lens normal
                }
            })
            .catch(err => {
                console.error("Error accessing webcam: ", err);
                resultDiv.innerText = "Webcam Error";
                resultDiv.style.color = "#ef4444";
            });
        } else {
            resultDiv.innerText = "Webcam not supported";
        }
    }

    // Initialize the default camera channel
    startCamera(currentFacingMode);

    // 🔄 Switch Button Trigger Event
    if (switchBtn) {
        switchBtn.addEventListener('click', () => {
            currentFacingMode = (currentFacingMode === "user") ? "environment" : "user";
            startCamera(currentFacingMode);
        });
    }

    // 2. Function to capture a frame and send it to Flask for emotion detection
    function captureAndPredict() {
        if (video.videoWidth === 0 || video.videoHeight === 0) return;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.6); // ⚡ Keeping optimization at 0.6 for smooth mobile payloads

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
        } else if (emotion === 'Neutral') {
            resultDiv.style.color = '#a8b2c1'; // Fixed Slate visibility baseline
            resultDiv.style.textShadow = '0 0 15px rgba(168, 178, 193, 0.2)';
        } else {
            resultDiv.style.color = '#ffffff';
            resultDiv.style.textShadow = 'none';
        }
    }

    // 4. Stream frame cycle hook
    video.addEventListener('loadedmetadata', () => {
        // Run clean polling intervals to avoid cloud threading bottlenecks
        setInterval(captureAndPredict, 600);
    });
});
