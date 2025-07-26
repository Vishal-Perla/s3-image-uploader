# 🖼️ S3 Image Uploader (Full-Stack)

This project is a full-stack image uploader built with React (frontend) and Node.js/Express (backend) that securely uploads images to an AWS S3 bucket.

## 🚀 Features

- Select and preview images before upload  
- Secure image upload via backend (no AWS keys in frontend)  
- Stores files in your own AWS S3 bucket  
- Displays uploaded image URL after success  

## 🖥️ Tech Stack

- Frontend: React, Fetch API  
- Backend: Node.js, Express, AWS SDK  
- Cloud Storage: Amazon S3  

## 📦 Setup Instructions

### 1. Clone the repository

-git clone https://github.com/Vishal-Perla/s3-image-uploader.git
-cd s3-image-uploader

### 2. Frontend Setup

-cd s3-frontend
-npm install
-npm start
The React app should open at http://localhost:3000.

### 3. Backend Setup

-cd ../s3-backend
-npm install

Create a .env file in s3-backend/ with the following:
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=your_region
S3_BUCKET_NAME=your_bucket_name

Then run:
node index.js
Your backend will run on http://localhost:5000.


## ✅ Security Notes

The frontend never sees your AWS keys.

All upload requests go through your backend API.

Secrets are stored in a .env file and excluded from Git via .gitignore.


## 📸 Demo

A user selects an image, previews it, and uploads it to S3. After uploading, a public URL is shown that links directly to the file stored in your AWS S3 bucket.


## ✍️ Author
Vishal Perla
Computer Science Student
GitHub: Vishal-Perla
