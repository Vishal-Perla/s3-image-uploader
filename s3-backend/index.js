require('dotenv').config();
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const AWS = require('aws-sdk');

const app = express();
const port = 5000;

app.use(cors());

// Setup Multer to store uploads in memory
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Configure AWS
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const s3 = new AWS.S3();

app.post('/upload', upload.single('file'), (req, res) => {
  const file = req.file;
  const params = {
    Bucket: process.env.S3_BUCKET_NAME,
    Key: file.originalname,
    Body: file.buffer,
    ContentType: file.mimetype,
  };

  s3.upload(params, (err, data) => {
    if (err) {
      console.error('Upload Error', err);
      return res.status(500).send('Upload error');
    }
    console.log('File uploaded:', data.Location);
    res.json({ url: data.Location });
  });
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
