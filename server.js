const express = require('express')
const app = express()

// Add this to handle form data and JSON
app.use(express.urlencoded({ extended: true }))
app.use(express.json())

// Store our data (in real apps, use a database)
let pageColor = '#ffffff'
const ADMIN_USERNAME = 'admin'
const ADMIN_PASSWORD = 'password123'
let isLoggedIn = false
let artworks = []
let comments = {}

// Homepage with art gallery
app.get('/', (req, res) => {
  res.send(`
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600&display=swap');
      
      body { 
        font-family: 'Poppins', sans-serif;
        max-width: 1200px; 
        margin: 0 auto; 
        padding: 20px;
        background-color: ${pageColor};
      }
      h1 { 
        color: #333;
        text-align: center;
        font-size: 2.5em;
      }
      .gallery {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 20px;
        padding: 20px;
      }
      .art-piece {
        border-radius: 10px;
        padding: 10px;
        background: white;
        box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        transition: transform 0.3s, box-shadow 0.3s;
        cursor: pointer;
      }
      .art-piece:hover {
        transform: translateY(-5px);
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
      }
      .art-piece img {
        width: 100%;
        height: 300px;
        object-fit: cover;
        border-radius: 8px;
      }
      .art-piece h3 {
        margin: 10px 0;
        color: #333;
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
      .modal {
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.8);
      }
      .modal-content {
        position: relative;
        background: white;
        width: 80%;
        max-width: 800px;
        margin: 50px auto;
        padding: 20px;
        border-radius: 10px;
      }
      .close {
        position: absolute;
        right: 20px;
        top: 10px;
        font-size: 30px;
        cursor: pointer;
      }
      .comments {
        margin-top: 20px;
        padding: 20px;
        background: #f5f5f5;
        border-radius: 8px;
      }
    </style>

    <h1>My Art Gallery</h1>
    
    <div class="gallery">
      ${artworks.map((art, index) => `
        <div class="art-piece" onclick="showArtwork(${index})">
          <img src="${art.url}" alt="${art.title}">
          <h3>${art.title}</h3>
          <p>${art.description}</p>
        </div>
      `).join('')}
    </div>

    <div id="artworkModal" class="modal">
      <div class="modal-content">
        <span class="close" onclick="closeModal()">&times;</span>
        <div id="modalContent"></div>
      </div>
    </div>

    <a href="/admin" class="admin-link">Admin Panel</a>

    <script>
      function showArtwork(index) {
        const modal = document.getElementById('artworkModal');
        const modalContent = document.getElementById('modalContent');
        const artwork = ${JSON.stringify(artworks)}[index];
        const comments = ${JSON.stringify(comments)}[artwork.id] || [];
        
        modalContent.innerHTML = \`
          <img src="\${artwork.url}" style="max-width: 100%; border-radius: 8px;">
          <h2>\${artwork.title}</h2>
          <p>\${artwork.description}</p>
          <div class="comments">
            <h3>Comments</h3>
            \${comments.map(c => \`<p>\${c}</p>\`).join('')}
            <form onsubmit="addComment(event, '\${artwork.id}')">
              <input type="text" id="comment" required placeholder="Add a comment...">
              <button type="submit">Post</button>
            </form>
          </div>
        \`;
        
        modal.style.display = 'block';
      }

      function closeModal() {
        document.getElementById('artworkModal').style.display = 'none';
      }

      async function addComment(event, artId) {
        event.preventDefault();
        const comment = document.getElementById('comment').value;
        
        await fetch('/add-comment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ artId, comment })
        });

        location.reload();
      }
    </script>
  `)
})

// Admin panel
app.get('/admin', (req, res) => {
  if (isLoggedIn) {
    res.send(`
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600&display=swap');
        body { 
          font-family: 'Poppins', sans-serif;
          max-width: 800px; 
          margin: 0 auto; 
          padding: 20px;
        }
        .form-group {
          margin-bottom: 20px;
        }
        label {
          display: block;
          margin-bottom: 5px;
        }
        input, textarea {
          width: 100%;
          padding: 8px;
          margin-bottom: 10px;
        }
        button {
          background: #333;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 5px;
          cursor: pointer;
        }
      </style>
      <h1>Admin Panel</h1>
      <form action="/add-artwork" method="POST">
        <div class="form-group">
          <label for="title">Artwork Title:</label>
          <input type="text" id="title" name="title" required>
        </div>
        <div class="form-group">
          <label for="url">Image URL:</label>
          <input type="text" id="url" name="url" required>
        </div>
        <div class="form-group">
          <label for="description">Description:</label>
          <textarea id="description" name="description" required></textarea>
        </div>
        <button type="submit">Add Artwork</button>
      </form>
      <br>
      <form action="/logout" method="POST">
        <button type="submit">Logout</button>
      </form>
      <br>
      <a href="/">Back to Gallery</a>
    `)
  } else {
    res.send(`
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600&display=swap');
        body { 
          font-family: 'Poppins', sans-serif;
          max-width: 400px; 
          margin: 0 auto; 
          padding: 20px;
        }
      </style>
      <h1>Admin Login</h1>
      <form action="/login" method="POST">
        <div>
          <label for="username">Username:</label>
          <input type="text" id="username" name="username" required>
        </div>
        <div style="margin-top: 10px;">
          <label for="password">Password:</label>
          <input type="password" id="password" name="password" required>
        </div>
        <div style="margin-top: 10px;">
          <button type="submit">Login</button>
        </div>
      </form>
      <br>
      <a href="/">Back to Gallery</a>
    `)
  }
})

// Handle login
app.post('/login', (req, res) => {
  if (req.body.username === ADMIN_USERNAME && req.body.password === ADMIN_PASSWORD) {
    isLoggedIn = true
    res.redirect('/admin')
  } else {
    res.send(`
      <p>Invalid username or password</p>
      <a href="/admin">Try again</a>
    `)
  }
})

// Handle logout
app.post('/logout', (req, res) => {
  isLoggedIn = false
  res.redirect('/admin')
})

// Handle adding new artwork
app.post('/add-artwork', (req, res) => {
  if (isLoggedIn) {
    const { title, url, description } = req.body
    const id = Date.now().toString() // Simple way to generate unique IDs
    artworks.push({ id, title, url, description })
  }
  res.redirect('/')
})

// Handle adding comments
app.post('/add-comment', (req, res) => {
  const { artId, comment } = req.body
  if (!comments[artId]) {
    comments[artId] = []
  }
  comments[artId].push(comment)
  res.json({ success: true })
})

app.listen(3000)
console.log('Server started on port 3000')
