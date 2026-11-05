# promptstore_aws

A clean, responsive single-page web application designed to catalog AI art and image generation prompts. Built as a capstone project for my AWS cloud internship to demonstrate a practical decoupled architecture running within the AWS Free Tier.

---

## What Does This Project Do?

This application allows users to:
1. Browse pre-loaded AI art cards showing the image, title, and generation prompt.
2. Copy prompts to their clipboard with a single click.
3. Test custom additions in real time by pasting an Amazon S3 image URL, title, and prompt through an on-page modal without reloading the page.

---

## Cloud Architecture

In standard web hosting, storing large high-resolution images on the application server eats up disk space and exhausts server bandwidth. This project decouples compute from media storage:

* **Compute Tier (AWS EC2):** An Ubuntu 24.04 LTS instance running Nginx serves the single `index.html` file (structure, styling, and client logic).
* **Storage Tier (Amazon S3):** A public-read S3 bucket holds all image assets. The browser fetches images directly from S3 using unique object URLs, keeping EC2 disk usage at nearly zero.
* **Cost Profile:** $0.00 (Operates entirely within 750 free monthly EC2 compute hours and 5 GB of S3 storage).
