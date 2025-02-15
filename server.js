const express = require('express');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const app = express();

// Configure Cloudinary - Replace with your credentials
cloudinary.config({
  cloud_name: 'YOUR_CLOUD_NAME',
  api_key: 'YOUR_API_KEY',
  api_secret: 'YOUR_API_SECRET'
});

// Configure Multer for file upload
const upload = multer({ storage: multer.memoryStorage() });

// Rest of your existing setup code...
let artworks = [];
let analytics = { totalViews: 0, viewsByArtwork: {} };
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'password123';
let isLoggedIn = false;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Your existing homepage route...
app.get('/', (req, res) => {
  // ... existing homepage code ...
});

// Update admin panel to include file upload
app.get('/admin', (req, res) => {
  if (!isLoggedIn) {
    // ... existing login form code ...
    return;
  }

  res.send(`
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600&display=swap');
      body { 
        font-family: 'Poppins', sans-serif;
        max-width: 800px; 
        margin: 0 auto; 
        padding: 20px;
      }
      .admin-panel {
        background: white;
        padding: 20px;
        border-radius: 10px;
        box-shadow: 0 2px 5px rgba(0,0,0,0.1);
      }
      form {
        display: grid;
        gap: 10px;
        margin-top: 20px;
      }
      input, textarea {
        padding: 8px;
        border: 1px solid #ddd;
        border-radius: 5px;
      }
      button {
        background: #333;
        color: white;
        border: none;
        padding: 10px;
        border-radius: 5px;
        cursor: pointer;
      }
      .artwork-list {
        margin-top: 20px;
      }
      .artwork-item {
        background: #f5f5f5;
        padding: 10px;
        margin: 10px 0;
        border-radius: 5px;
      }
      .upload-preview {
        max-width: 200px;
        margin: 10px 0;
        display: none;
      }
      .loading {
        display: none;
        color: #666;
        font-style: italic;
      }
    </style>

    <div class="admin-panel">
      <h1>Admin Panel</h1>
      
      <form action="/upload" method="POST" enctype="multipart/form-data">
        <input type="text" name="title" placeholder="Artwork Title" required>
        <textarea name="description" placeholder="Description" required></textarea>
        <input type="file" name="image" accept="image/*" required onchange="previewImage(this)">
        <img id="preview" class="upload-preview">
        <div id="loading" class="loading">Uploading image...</div>
        <button type="submit" onclick="showLoading()">Add Artwork</button>
      </form>

      <div class="artwork-list">
        <h2>Current Artworks</h2>
        ${artworks.map(art => `
          <div class="artwork-item">
            <h3>${art.title}</h3>
            <img src="${art.imageUrl}" style="max-width: 200px">
            <p>${art.description}</p>
            <form action="/delete-artwork" method="POST" style="display: inline;">
              <input type="hidden" name="id" value="${art.id}">
              <button type="submit">Delete</button>
            </form>
          </div>
        `).join('')}
      </div>

      <form action="/logout" method="POST" style="margin-top: 20px;">
        <button type="submit">Logout</button>
      </form>
    </div>

    <script>
      function previewImage(input) {
        const preview = document.getElementById('preview');
        if (input.files && input.files[0]) {
          const reader = new FileReader();
          reader.onload = function(e) {
            preview.src = e.target.result;
            preview.style.display = 'block';
          }
          reader.readAsDataURL(input.files[0]);
        }
      }

      function showLoading() {
        document.getElementById('loading').style.display = 'block';
      }
    </script>
  `);
});

// Handle file upload
app.post('/upload', upload.single('image'), async (req, res) => {
  if (!isLoggedIn) {
    res.redirect('/admin');
    return;
  }

  try {
    // Upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: "art-gallery" },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );

      // Convert buffer to stream
      const buffer = req.file.buffer;
      require('stream').Readable.from(buffer).pipe(uploadStream);
    });

    // Add new artwork
    const newArtwork = {
      id: Date.now().toString(),
      title: req.body.title,
      description: req.body.description,
      imageUrl: result.secure_url
    };

    artworks.push(newArtwork);
    res.redirect('/admin');
  } catch (error) {
    res.send(`Error uploading: ${error.message}`);
  }
});

// Your existing routes (login, logout, delete)...
app.post('/login', (req, res) => {
  // ... existing login code ...
});

app.post('/logout', (req, res) => {
  // ... existing logout code ...
});

app.post('/delete-artwork', (req, res) => {
  // ... existing delete code ...
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
