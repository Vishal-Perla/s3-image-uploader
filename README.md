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

- git clone https://github.com/Vishal-Perla/s3-image-uploader.git
- cd s3-image-uploader

### 2. Create an S3 Bucket (if you haven’t already)

- Go to your AWS S3 Console
- Create a new bucket (e.g., my-s3-bucket-name)
- Keep the default settings (ACLs off, private bucket)

Note the bucket name and region

### 3. Frontend Setup

- cd s3-frontend
- npm install
- npm start
The React app should open at http://localhost:3000.

### 4. Backend Setup

- cd ../s3-backend
- npm install

Create a .env file in s3-backend/ with the following:
- AWS_ACCESS_KEY_ID=your_access_key
- AWS_SECRET_ACCESS_KEY=your_secret_key
- AWS_REGION=your_region
- S3_BUCKET_NAME=your_bucket_name

Then run:
- node index.js
Your backend will run on http://localhost:5000.


## ✅ Security Notes

The frontend never sees your AWS keys.

All upload requests go through your backend API.

Secrets are stored in a .env file and excluded from Git via .gitignore.


## 📸 Demo

A user selects an image, previews it, and uploads it to S3. After uploading, a public URL is shown that links directly to the file stored in your AWS S3 bucket.


## 🧩 Practical Use Cases

### 1. User Profile Uploads
Used in web apps to let users upload profile pictures (e.g., social networks, e-commerce dashboards).

### 2. Content Management Systems (CMS)
Allows editors/admins to upload media (images, banners, thumbnails) for articles or pages.

### 3. E-commerce Product Images
Lets store owners upload product photos to an S3 bucket and store the image URLs in a database.

### 4. Portfolio/Blog Platforms
Creators can upload and host images for their blog posts or portfolio galleries securely.

### 5. Mobile or Web App Backend
Common pattern for any React frontend + Node backend + AWS S3 file hosting setup.



## ✍️ Author
- Vishal Perla
- Computer Science Student
- GitHub: Vishal-Perla
