const express = require('express');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const dotenv = require('dotenv');
const app = express();

// Load environment variables
dotenv.config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure Multer
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Store data
let artworks = [];
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'Jozilla13';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Jozilla911!';
let isLoggedIn = false;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Homepage
app.get('/', (req, res) => {
  res.send(`
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600&display=swap');
      body { 
        font-family: 'Poppins', sans-serif;
        max-width: 1200px; 
        margin: 0 auto; 
        padding: 20px;
        background: #f5f5f5;
      }
      .gallery {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 20px;
        padding: 20px;
      }
      .art-piece {
        background: white;
        border-radius: 10px;
        padding: 15px;
        box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        transition: transform 0.3s;
      }
      .art-piece:hover {
        transform: translateY(-5px);
      }
      .art-piece img {
        width: 100%;
        height: 300px;
        object-fit: cover;
        border-radius: 8px;
      }
      .admin-link {
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: #333;
        color: white;
        padding: 10px 20px;
        border-radius: 20px;
        text-decoration: none;
      }
    </style>

    <h1>Art Gallery</h1>
    
    <div class="gallery">
      ${artworks.map(art => `
        <div class="art-piece">
          <img src="${art.imageUrl}" alt="${art.title}">
          <h3>${art.title}</h3>
          <p>${art.description}</p>
        </div>
      `).join('')}
    </div>

    <a href="/admin" class="admin-link">Admin Panel</a>
  `);
});

// Admin panel
app.get('/admin', (req, res) => {
  if (!isLoggedIn) {
    res.send(`
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600&display=swap');
        body { 
          font-family: 'Poppins', sans-serif;
          max-width: 400px; 
          margin: 0 auto; 
          padding: 20px;
        }
        .login-form {
          background: white;
          padding: 20px;
          border-radius: 10px;
          box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }
        input, button {
          width: 100%;
          padding: 10px;
          margin: 10px 0;
          border: 1px solid #ddd;
          border-radius: 5px;
        }
        button {
          background: #333;
          color: white;
          border: none;
          cursor: pointer;
        }
      </style>
      <div class="login-form">
        <h1>Admin Login</h1>
        <form action="/login" method="POST">
          <input name="username" placeholder="Username" required>
          <input type="password" name="password" placeholder="Password" required>
          <button type="submit">Login</button>
        </form>
      </div>
    `);
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
      #preview {
        max-width: 200px;
        display: none;
        margin: 10px 0;
      }
    </style>

    <div class="admin-panel">
      <h1>Admin Panel</h1>
      
      <form action="/upload" method="POST" enctype="multipart/form-data">
        <input type="text" name="title" placeholder="Artwork Title" required>
        <textarea name="description" placeholder="Description" required></textarea>
        <input type="file" name="image" accept="image/*" required onchange="previewImage(this)">
        <img id="preview">
        <button type="submit">Upload Artwork</button>
      </form>

      <div class="artwork-list">
        <h2>Current Artworks</h2>
        ${artworks.map(art => `
          <div class="artwork-item">
            <h3>${art.title}</h3>
            <img src="${art.imageUrl}" style="max-width: 200px">
            <p>${art.description}</p>
            <form action="/delete" method="POST" style="display: inline;">
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
    </script>
  `);
});

// Login
app.post('/login', (req, res) => {
  if (req.body.username === ADMIN_USERNAME && req.body.password === ADMIN_PASSWORD) {
    isLoggedIn = true;
    res.redirect('/admin');
  } else {
    res.send('Invalid credentials. <a href="/admin">Try again</a>');
  }
});

// Logout
app.post('/logout', (req, res) => {
  isLoggedIn = false;
  res.redirect('/admin');
});

// Upload
app.post('/upload', upload.single('image'), async (req, res) => {
  if (!isLoggedIn) {
    res.redirect('/admin');
    return;
  }

  try {
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: "art-gallery" },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      
      stream.end(req.file.buffer);
    });

    artworks.push({
      id: Date.now().toString(),
      title: req.body.title,
      description: req.body.description,
      imageUrl: result.secure_url
    });

    res.redirect('/admin');
  } catch (error) {
    res.send(`Upload failed: ${error.message}. <a href="/admin">Try again</a>`);
  }
});

// Delete
app.post('/delete', (req, res) => {
  if (!isLoggedIn) {
    res.redirect('/admin');
    return;
  }

  artworks = artworks.filter(art => art.id !== req.body.id);
  res.redirect('/admin');
});

module.exports = app;
