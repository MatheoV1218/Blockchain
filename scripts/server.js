// server.js

// Import required modules: Express and Gun
const express = require('express');
const Gun = require('gun');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files (like your HTML, CSS, and client-side JS) from the 'public' folder
app.use(express.static(__dirname + '/public'));

// Start the HTTP server
const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Attach Gun to the HTTP server with peer configuration
const gun = Gun({
  web: server, // Use the existing Express server
  peers: [
    'http://localhost:3000/gun'
  ]
});