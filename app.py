import os
import boto3
from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename

app = Flask(__name__)
CORS(app)

BUCKET_NAME = "promptstore-aws"
AWS_REGION = "Asia Pacific (Sydney) ap-southeast-2"

s3_client = boto3.client('s3', region_name=AWS_REGION)

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'image' not in request.files:
        return jsonify({'error': 'No image file uploaded'}), 400

    file = request.files['image']
    title = request.form.get('title', 'Untitled')
    prompt = request.form.get('prompt', '')

    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400

    try:
        filename = secure_filename(file.filename)
        
        s3_client.upload_fileobj(
            file,
            BUCKET_NAME,
            filename,
            ExtraArgs={'ContentType': file.content_type}
        )

        image_url = f"https://{BUCKET_NAME}.s3.{AWS_REGION}.amazonaws.com/{filename}"

        return jsonify({
            'message': 'Success',
            'title': title,
            'prompt': prompt,
            'imageUrl': image_url
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5000) 
