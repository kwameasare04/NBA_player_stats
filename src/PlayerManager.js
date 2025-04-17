import React, { useEffect, useState } from 'react';

const PlayerManager = () => {
  const [players, setPlayers] = useState([]);
  const [newPlayerName, setNewPlayerName] = useState('');

  // Load players on component mount
  useEffect(() => {
    fetch('http://localhost:5000/api/players')
      .then((res) => res.json())
      .then((data) => setPlayers(data))
      .catch((err) => console.error('Failed to fetch players:', err));
  }, []);

  // Add new player
  const handleAddPlayer = async (e) => {
    e.preventDefault();

    if (!newPlayerName.trim()) return;

    try {
      const response = await fetch('http://localhost:5000/api/add-player', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ player: newPlayerName.trim() }),
      });

      const result = await response.json();
      if (result.success) {
        setPlayers(result.players);
        setNewPlayerName('');
      }
    } catch (err) {
      console.error('Failed to add player:', err);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Player Manager</h2>
      <form onSubmit={handleAddPlayer}>
        <input
          type="text"
          value={newPlayerName}
          onChange={(e) => setNewPlayerName(e.target.value)}
          placeholder="Enter player name"
          required
        />
        <button type="submit">Add Player</button>
      </form>

      <h3>Current Players</h3>
      <ul>
        {players.map((player, idx) => (
          <li key={idx}>{player}</li>
        ))}
      </ul>
    </div>
  );
};

export default PlayerManager;

