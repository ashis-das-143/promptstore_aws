import os
import json
from flask import Flask, request, jsonify
from flask_cors import CORS
import boto3
from werkzeug.utils import secure_filename

app = Flask(__name__)
CORS(app)

BUCKET_NAME = "promptstore-aws"
AWS_REGION = "ap-southeast-2"

s3_client = boto3.client('s3', region_name=AWS_REGION)

DATA_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'prompts.json')

@app.route('/prompts', methods=['GET'])
def get_prompts():
    if os.path.exists(DATA_FILE):
        try:
            with open(DATA_FILE, 'r') as f:
                return jsonify(json.load(f))
        except Exception:
            return jsonify([])
    return jsonify([])

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'image' not in request.files:
        return jsonify({'error': 'No image file provided'}), 400
    
    file = request.files['image']
    title = request.form.get('title', '')
    prompt = request.form.get('prompt', '')

    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    filename = secure_filename(file.filename)
    try:
        s3_client.upload_fileobj(
            file,
            BUCKET_NAME,
            filename,
            ExtraArgs={'ContentType': file.content_type}
        )
        image_url = f"https://{BUCKET_NAME}.s3.{AWS_REGION}.amazonaws.com/{filename}"

        items = []
        if os.path.exists(DATA_FILE):
            try:
                with open(DATA_FILE, 'r') as f:
                    items = json.load(f)
            except Exception:
                items = []

        new_item = {
            "title": title,
            "imageUrl": image_url,
            "prompt": prompt
        }
        items.insert(0, new_item)

        with open(DATA_FILE, 'w') as f:
            json.dump(items, f, indent=2)

        return jsonify(new_item), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
