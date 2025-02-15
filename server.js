const express = require('express');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const app = express();

// Setup Cloudinary
cloudinary.config({
  cloud_name: 'your_cloud_name',
  api_key: 'your_api_key',
  api_secret: 'your_api_secret'
});

// Setup multer for file upload
const upload = multer({ storage: multer.memoryStorage() });

// Store data (in real apps, use a database)
let artworks = [];
let analytics = {
  totalViews: 0,
  viewsByArtwork: {},
  lastWeekViews: []
};

const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'password123';
let isLoggedIn = false;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Homepage with gallery
app.get('/', (req, res) => {
  analytics.totalViews++;
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
      .status-badge {
        display: inline-block;
        padding: 3px 8px;
        border-radius: 12px;
        font-size: 12px;
        margin-left: 10px;
      }
      .draft { background: #ffd700; }
      .published { background: #90EE90; }
    </style>

    <h1>Art Gallery</h1>
    
    <div class="gallery">
      ${artworks
        .filter(art => art.status === 'published')
        .map(art => {
          analytics.viewsByArtwork[art.id] = (analytics.viewsByArtwork[art.id] || 0) + 1;
          return `
            <div class="art-piece">
              <img src="${art.imageUrl}" alt="${art.title}">
              <h3>${art.title}</h3>
              <p>${art.description}</p>
              <small>Views: ${analytics.viewsByArtwork[art.id]}</small>
            </div>
          `;
        }).join('')}
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
          <input type="text" name="username" placeholder="Username" required>
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
        max-width: 1200px; 
        margin: 0 auto; 
        padding: 20px;
      }
      .admin-panel {
        display: grid;
        grid-template-columns: 250px 1fr;
        gap: 20px;
      }
      .sidebar {
        background: #333;
        color: white;
        padding: 20px;
        border-radius: 10px;
        height: fit-content;
      }
      .sidebar a {
        color: white;
        text-decoration: none;
        display: block;
        padding: 10px;
        border-radius: 5px;
      }
      .sidebar a:hover {
        background: #444;
      }
      .content {
        background: white;
        padding: 20px;
        border-radius: 10px;
        box-shadow: 0 2px 5px rgba(0,0,0,0.1);
      }
      .artwork-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 20px;
        margin-top: 20px;
      }
      .artwork-card {
        background: #f5f5f5;
        padding: 10px;
        border-radius: 8px;
      }
      .artwork-card img {
        width: 100%;
        height: 150px;
        object-fit: cover;
        border-radius: 5px;
      }
      .stats {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 15px;
        margin-bottom: 20px;
      }
      .stat-card {
        background: #f5f5f5;
        padding: 15px;
        border-radius: 8px;
        text-align: center;
      }
      .stat-card h3 {
        margin: 0;
        color: #666;
      }
      .stat-card p {
        margin: 5px 0 0 0;
        font-size: 24px;
        font-weight: 600;
      }
      form {
        display: grid;
        gap: 10px;
      }
      input, textarea, button {
        padding: 8px;
        border: 1px solid #ddd;
        border-radius: 5px;
      }
      button {
        background: #333;
        color: white;
        border: none;
        cursor: pointer;
      }
      .status-toggle {
        display: flex;
        gap: 10px;
      }
    </style>

    <div class="admin-panel">
      <div class="sidebar">
        <h2>Admin Panel</h2>
        <a href="#dashboard">Dashboard</a>
        <a href="#upload">Upload Artwork</a>
        <a href="#manage">Manage Artwork</a>
        <form action="/logout" method="POST" style="margin-top: 20px;">
          <button type="submit">Logout</button>
        </form>
      </div>

      <div class="content">
        <div id="dashboard">
          <h2>Dashboard</h2>
          <div class="stats">
            <div class="stat-card">
              <h3>Total Views</h3>
              <p>${analytics.totalViews}</p>
            </div>
            <div class="stat-card">
              <h3>Total Artworks</h3>
              <p>${artworks.length}</p>
            </div>
            <div class="stat-card">
              <h3>Published</h3>
              <p>${artworks.filter(art => art.status === 'published').length}</p>
            </div>
            <div class="stat-card">
              <h3>Drafts</h3>
              <p>${artworks.filter(art => art.status === 'draft').length}</p>
            </div>
          </div>
        </div>

        <div id="upload">
          <h2>Upload New Artwork</h2>
          <form action="/upload" method="POST" enctype="multipart/form-data">
            <input type="text" name="title" placeholder="Artwork Title" required>
            <textarea name="description" placeholder="Description" required></textarea>
            <input type="file" name="image" accept="image/*" required>
            <div class="status-toggle">
              <label>
                <input type="radio" name="status" value="draft" checked>
                Draft
              </label>
              <label>
                <input type="radio" name="status" value="published">
                Publish
              </label>
            </div>
            <button type="submit">Upload</button>
          </form>
        </div>

        <div id="manage">
          <h2>Manage Artwork</h2>
          <div class="artwork-grid">
            ${artworks.map(art => `
              <div class="artwork-card">
                <img src="${art.imageUrl}" alt="${art.title}">
                <h3>${art.title}</h3>
                <p>Views: ${analytics.viewsByArtwork[art.id] || 0}</p>
                <span class="status-badge ${art.status}">${art.status}</span>
                <form action="/toggle-status" method="POST" style="display: inline;">
                  <input type="hidden" name="id" value="${art.id}">
                  <button type="submit">Toggle Status</button>
                </form>
                <form action="/delete-artwork" method="POST" style="display: inline;">
                  <input type="hidden" name="id" value="${art.id}">
                  <button type="submit" style="background: #ff4444;">Delete</button>
                </form>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    </div>
  `);
});

// Handle login
app.post('/login', (req, res) => {
  if (req.body.username === ADMIN_USERNAME && req.body.password === ADMIN_PASSWORD) {
    isLoggedIn = true;
    res.redirect('/admin');
  } else {
    res.send(`
      <p>Invalid credentials</p>
      <a href="/admin">Try again</a>
    `);
  }
});

// Handle logout
app.post('/logout', (req, res) => {
  isLoggedIn = false;
  res.redirect('/admin');
});

// Handle image upload
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
      imageUrl: result.secure_url,
      status: req.body.status || 'draft'
    };

    artworks.push(newArtwork);
    res.redirect('/admin');
  } catch (error) {
    res.send(`Error uploading: ${error.message}`);
  }
});

// Toggle artwork status
app.post('/toggle-status', (req, res) => {
  if (!isLoggedIn) {
    res.redirect('/admin');
    return;
  }

  const artwork = artworks.find(art => art.id === req.body.id);
  if (artwork) {
    artwork.status = artwork.status === 'published' ? 'draft' : 'published';
  }
  res.redirect('/admin');
});

// Delete artwork
app.post('/delete-artwork', (req, res) => {
  if (!isLoggedIn) {
    res.redirect('/admin');
    return;
  }

  artworks = artworks.filter(art => art.id !== req.body.id);
  res.redirect('/admin');
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
