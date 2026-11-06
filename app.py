import os
import json
import uuid
import boto3
from flask import Flask, request, jsonify
from werkzeug.utils import secure_filename

app = Flask(__name__)

ADMIN_PIN = "6706"                   
BUCKET_NAME = "promptstore-aws"  
AWS_REGION = "ap-southeast-2"        
DATA_FILE = "/home/ubuntu/prompts.json"

s3_client = boto3.client("s3", region_name=AWS_REGION)

def load_prompts():
    if not os.path.exists(DATA_FILE):
        return []
    try:
        with open(DATA_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return []

def save_prompts(prompts):
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(prompts, f, ensure_ascii=False, indent=2)

@app.route("/prompts", methods=["GET"])
def get_prompts():
    return jsonify(load_prompts()), 200

@app.route("/upload", methods=["POST"])
def upload():
    user_pin = request.form.get("pin", "").strip()
    if user_pin != ADMIN_PIN:
        return jsonify({"error": "Invalid PIN. Upload unauthorized."}), 403

    title = request.form.get("title", "").strip()
    prompt_text = request.form.get("prompt", "").strip()
    image_file = request.files.get("image")

    if not image_file or image_file.filename == "":
        return jsonify({"error": "An image file is required."}), 400
    if not prompt_text:
        return jsonify({"error": "Prompt text is required."}), 400

    ext = os.path.splitext(secure_filename(image_file.filename))[1] or ".png"
    unique_filename = f"{uuid.uuid4().hex}{ext}"

    try:
        s3_client.upload_fileobj(
            image_file,
            BUCKET_NAME,
            unique_filename,
            ExtraArgs={"ContentType": image_file.content_type or "image/jpeg"}
        )
        image_url = f"https://{BUCKET_NAME}.s3.{AWS_REGION}.amazonaws.com/{unique_filename}"
    except Exception as e:
        return jsonify({"error": f"S3 upload failed: {str(e)}"}), 500

    new_entry = {
        "id": uuid.uuid4().hex,
        "title": title or "Untitled",
        "prompt": prompt_text,
        "imageUrl": image_url
    }

    prompts = load_prompts()
    prompts.insert(0, new_entry)
    save_prompts(prompts)

    return jsonify({
        "message": "Upload successful",
        "title": new_entry["title"],
        "imageUrl": new_entry["imageUrl"],
        "prompt": new_entry["prompt"]
    }), 200

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
