from flask import Flask, request, render_template, jsonify
import requests

app = Flask(__name__)

# Route to render the frontend HTML
@app.route('/')
def index():
    return render_template('frontend.html')

# Route to handle image upload and prediction
@app.route('/predict', methods=['POST'])
def predict():
    if 'image' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    image = request.files['image']

    # Send the image to Roboflow API for prediction
    api_url = "https://detect.roboflow.com/american-sign-language-letters/6?api_key=4REFjPGpRLUMt5gylhr6"
    response = requests.post(api_url, files={"file": image})

    if response.status_code == 200:
        return jsonify(response.json())
    else:
        return jsonify({"error": "Prediction failed"}), 500

if __name__ == '__main__':
    app.run(debug=True)
