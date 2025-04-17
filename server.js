const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = 5000;

const playersFile = path.join(__dirname, 'players.json');

app.use(cors());
app.use(bodyParser.json());

// Get players
app.get('/api/players', (req, res) => {
  fs.readFile(playersFile, 'utf8', (err, data) => {
    if (err) return res.status(500).send('Failed to read players.');
    res.json(JSON.parse(data));
  });
});

// Add a player
app.post('/api/add-player', (req, res) => {
  const { player } = req.body;
  if (!player) return res.status(400).send('Player name required.');

  fs.readFile(playersFile, 'utf8', (err, data) => {
    if (err) return res.status(500).send('Failed to read players.');
    let players = JSON.parse(data);
    if (!players.includes(player.toLowerCase())) {
      players.push(player.toLowerCase());
    }
    fs.writeFile(playersFile, JSON.stringify(players, null, 2), (err) => {
      if (err) return res.status(500).send('Failed to save player.');
      res.json({ success: true, players });
    });
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
