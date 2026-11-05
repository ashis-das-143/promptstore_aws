# PromptStore

A single-page AI prompt and artwork showcase built as an AWS internship capstone project.

## Cloud Setup
* **Compute:** AWS EC2 (Ubuntu 24.04 LTS / Nginx) serving the single-page application and Python Flask backend.
* **Storage:** Amazon S3 bucket storing all user-uploaded images and initial assets.
* **Architecture:** Decoupled. The application server retains zero media files on local disk; all files are streamed and stored directly via Amazon S3.

## Deployment Steps

1. **Amazon S3:** Create a public-read S3 bucket and attach a public read bucket policy.
2. **AWS IAM:** Create an EC2 IAM role with `AmazonS3FullAccess` policy and attach it to the EC2 instance.
3. **EC2 Server Setup:**
   ```bash
   sudo apt update && sudo apt install nginx python3-pip python3-flask python3-boto3 -y
   sudo pip3 install flask-cors --break-system-packages
