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
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'password123';
let isLoggedIn = false;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Homepage
app.get('/', (req, res) => {
  res.send(`
    <h1>Art Gallery</h1>
    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px;">
      ${artworks.map(art => `
        <div style="border: 1px solid #ddd; padding: 10px; border-radius: 8px;">
          <img src="${art.imageUrl}" style="width: 100%; height: 300px; object-fit: cover;">
          <h3>${art.title}</h3>
          <p>${art.description}</p>
        </div>
      `).join('')}
    </div>
    <a href="/admin" style="position: fixed; bottom: 20px; right: 20px; background: #333; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Admin Panel</a>
  `);
});

// Admin panel
app.get('/admin', (req, res) => {
  if (!isLoggedIn) {
    res.send(`
      <h1>Login</h1>
      <form action="/login" method="POST">
        <input name="username" placeholder="Username" required><br>
        <input type="password" name="password" placeholder="Password" required><br>
        <button type="submit">Login</button>
      </form>
    `);
    return;
  }

  res.send(`
    <h1>Admin Panel</h1>
    <form action="/upload" method="POST" enctype="multipart/form-data">
      <input name="title" placeholder="Title" required><br>
      <textarea name="description" placeholder="Description" required></textarea><br>
      <input type="file" name="image" accept="image/*" required><br>
      <button type="submit">Upload</button>
    </form>
    <hr>
    <h2>Current Artworks</h2>
    ${artworks.map(art => `
      <div style="margin: 20px 0; padding: 10px; border: 1px solid #ddd;">
        <img src="${art.imageUrl}" style="max-width: 200px">
        <h3>${art.title}</h3>
        <p>${art.description}</p>
        <form action="/delete" method="POST" style="display: inline;">
          <input type="hidden" name="id" value="${art.id}">
          <button type="submit">Delete</button>
        </form>
      </div>
    `).join('')}
    <form action="/logout" method="POST">
      <button type="submit">Logout</button>
    </form>
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

// Start server
app.listen(3000, () => {
  console.log('Server running on port 3000');
});
