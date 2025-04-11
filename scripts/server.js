// server.js

// Import required modules: Express and Gun
const express = require('express');
const Gun = require('gun');

// Create an instance of Express
const app = express();

// Define the port to use (defaults to 3000 if not specified in environment variables)
const PORT = process.env.PORT || 3000;

// Serve static files (like your HTML, CSS, and client-side JS) from a 'public' folder
app.use(express.static(__dirname + '/public'));

// Start the HTTP server
const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Attach Gun to the HTTP server to enable P2P networking features
const gun = Gun({
  web: server // This tells Gun to use the existing Express server
});

console.log('Gun is attached to the server');
