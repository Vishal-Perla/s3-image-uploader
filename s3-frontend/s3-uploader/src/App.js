import React, { useState } from 'react';

function App() {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploadedUrl, setUploadedUrl] = useState(null);

  const handleFileInput = (e) => {
    const file = e.target.files[0];
    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  const uploadFile = async () => {
    if (!image) return;

    const formData = new FormData();
    formData.append("file", image);

    try {
      const response = await fetch("http://localhost:5000/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const data = await response.json();
      alert("Upload successful!");
      setUploadedUrl(data.url);
    } catch (err) {
      console.error("Error uploading file:", err);
      alert("Upload failed.");
    }
  };

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h2>🖼️ S3 Image Uploader</h2>
      <input type="file" onChange={handleFileInput} />
      {preview && <img src={preview} alt="preview" width="300" />}
      <br />
      <button onClick={uploadFile}>Upload to S3</button>
      {uploadedUrl && (
        <p>
          File URL: <a href={uploadedUrl} target="_blank" rel="noreferrer">{uploadedUrl}</a>
        </p>
      )}
    </div>
  );
}

export default App;
