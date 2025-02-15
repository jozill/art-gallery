const express = require('express');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Test route
app.get('/', (req, res) => {
  res.send(`
    <h1>Art Gallery</h1>
    <p>Site is working!</p>
    <a href="/admin">Admin Panel</a>
  `);
});

// Simple admin route
app.get('/admin', (req, res) => {
  res.send(`
    <h1>Admin Panel</h1>
    <p>Admin page is working!</p>
  `);
});

// Export for Vercel
module.exports = app;
