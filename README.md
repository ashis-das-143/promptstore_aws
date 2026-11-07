# PromptStore

A single-page AI prompt and artwork showcase built as an AWS internship capstone project.

## 🌟 Features
* **Modern UI:** Clean, responsive gallery interface with prompt viewer and modal dialogs.
* **Instant Clipboard Copy:** 1-click prompt copying for generative AI workflows.
* **Secured Uploads:** 4-digit security PIN verification for admin artwork and prompt publishing.
* **Decoupled Architecture:** Zero media files stored on local EC2 storage; all uploads stream directly to Amazon S3.

---

## 🏗️ Cloud Setup & Architecture
* **Compute:** AWS EC2 (Ubuntu 24.04 LTS) running Nginx as a reverse proxy & static file server alongside a Python Flask backend.
* **Storage:** Amazon S3 bucket for storing user-uploaded artwork and assets.
* **IAM Security:** EC2 IAM Role with S3 permissions attached to the instance (eliminates hardcoded AWS credentials).
* **Metadata Persistence:** Prompts and S3 image URLs managed via persistent JSON storage on EC2.

---

## 📁 Project Structure

```text
promptstore/
├── index.html       # Clean single-page application markup
├── style.css        # Responsive styling & themes
├── script.js        # Client-side API interactions & UI logic
├── app.py           # Flask backend API (S3 upload & prompt endpoints)
├── LICENSE          # License details
└── README.md        # Project documentation & deployment guide
```

---

## 🚀 Deployment Steps

### 1. Amazon S3 Bucket
1. Create an S3 bucket (e.g., `promptstore-aws`) in your desired AWS region (e.g., `ap-southeast-2`).
2. Disable **Block all public access** (for public artwork viewing).
3. Add a bucket policy granting `s3:GetObject` permission to public traffic:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Sid": "PublicReadGetObject",
         "Effect": "Allow",
         "Principal": "*",
         "Action": "s3:GetObject",
         "Resource": "arn:aws:s3:::promptstore-aws/*"
       }
     ]
   }
   ```

### 2. AWS IAM Role for EC2
1. Create an IAM Role for EC2 with `AmazonS3FullAccess` (or scoped permissions for your bucket).
2. Attach this IAM Role to your running EC2 instance (`Actions -> Security -> Modify IAM role`).

### 3. EC2 Instance Setup
Connect to your EC2 instance via SSH:

```bash
# Update packages and install dependencies
sudo apt update && sudo apt install nginx python3-pip python3-flask python3-boto3 -y
sudo pip3 install flask-cors --break-system-packages
```

### 4. Deploy Frontend Files
Copy the static assets to the Nginx web root directory:

```bash
sudo cp index.html style.css script.js /var/www/html/
sudo chmod 644 /var/www/html/*
```

### 5. Configure Nginx Reverse Proxy
Edit the default Nginx configuration (`sudo nano /etc/nginx/sites-available/default`):

```nginx
server {
    listen 80 default_server;
    listen [::]:80 default_server;

    root /var/www/html;
    index index.html;

    server_name _;

    client_max_body_size 20M;

    location / {
        try_files $uri $uri/ =404;
    }

    location /prompts {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /upload {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

Test and reload Nginx:
```bash
sudo nginx -t
sudo systemctl restart nginx
```

### 6. Run the Flask Backend
Configure `BUCKET_NAME` and `AWS_REGION` in `app.py` if needed:

```bash
# Run Flask app directly
python3 app.py

# Or run continuously in the background (using nohup / systemd)
nohup python3 app.py > app.log 2>&1 &
```

---

## 🔒 Security Note
* **Admin PIN:** Configured in `app.py` via `ADMIN_PIN`. Change it to your own secure PIN before deploying.
* **IAM Role:** Authentication to S3 uses boto3 automatic credential discovery from EC2 metadata — never hardcode AWS Access Keys in source files.
