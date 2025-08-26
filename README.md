# 🖼️ S3 Image Uploader + Supabase Pricing Service

A full-stack project that demonstrates **secure file uploads** to AWS S3 with a **React frontend** and **Node.js/Express backend**, extended with a **Supabase + FastAPI service** to manage dynamic pricing, products, and subscriptions.

---

## 🚀 Features

### 🌐 Frontend (React)
- Select and preview images before upload.
- Upload images securely via backend (no AWS keys in frontend).
- Displays uploaded file’s S3 URL.
- Integrates with Supabase Auth (anon key) for user login.
- Shows a **dynamic pricing table** pulled from Supabase.

### ⚙️ Backend (Node.js + Express)
- Handles file uploads via `multer`.
- Generates pre-signed URLs with AWS SDK.
- Sends uploaded files directly to S3.
- Returns file URL in JSON response.
- Keeps AWS keys secure in `.env` (never exposed to frontend).

### 🗄️ Supabase Pricing Service (FastAPI + Python SDK)
- PostgreSQL schema for:
  - **Products** → e.g., S3 Image Uploader
  - **Plans** → Free, Pro, Team
  - **Subscriptions** → links users to chosen plans
  - **Customer Overrides** (future extension)
- REST API endpoints for:
  - Fetching pricing (`/public/pricing/{product_slug}`)
  - Creating subscriptions (`/public/subscribe`)
  - Querying user subscription (`/public/subscription/{product_slug}`)
- Built with **object-oriented design** (Entities, Repository, Service).
- Secrets stored in `.env` (ignored in Git).

---

## 🧩 Practical Use Cases

1. **User Profile Uploads**  
   - Let users upload and store profile pictures in S3 without exposing AWS keys.  

2. **E-commerce Product Images**  
   - Store owners can upload product photos directly to S3.  
   - Pricing tiers (Free, Pro, Team) can control storage limits and support levels.  

3. **Dynamic Pricing Updates**  
   - Plans can be updated in Supabase (e.g., add new tiers, change pricing).  
   - Changes instantly appear in the React frontend without redeploying code.  

4. **Subscriptions & Feature Gating**  
   - Keep track of which plan a user is subscribed to.  
   - Future extension: lock premium features (like larger storage) to Pro/Team users.  

5. **Scalable Media Hosting**  
   - By leveraging S3, uploads scale easily for blogs, portfolios, or SaaS platforms without bloating your server storage.
