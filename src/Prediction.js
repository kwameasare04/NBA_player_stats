import React, { useEffect, useState } from 'react';
import Papa from 'papaparse';
import _ from 'lodash';
import * as mlRegression from 'ml-regression';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts';
import './Prediction.css';

const getColorByProbability = (value, statArray) => {
  const sorted = [...statArray].sort((a, b) => a - b);
  const index = sorted.findIndex((v) => value <= v);
  const percentile = index / sorted.length;

  if (percentile >= 0.75) return 'green';
  if (percentile >= 0.4) return 'amber';
  return 'red';
};

const Prediction = () => {
  const [playerStats, setPlayerStats] = useState({});
  const [selectedPlayer, setSelectedPlayer] = useState('');

  useEffect(() => {
    fetch('/player_stats.csv')
      .then((response) => response.text())
      .then((csvText) => {
        Papa.parse(csvText, {
          header: true,
          complete: (results) => {
            const rawData = results.data;
            const grouped = _.groupBy(rawData, (row) => row.PLAYER_NAME.toUpperCase());
            setPlayerStats(grouped);
            setSelectedPlayer(Object.keys(grouped)[0]);
          },
        });
      });
  }, []);

  const convertStats = (data) =>
    data.map((game, index) => ({
      gameNum: index + 1,
      PTS: parseFloat(game.PTS),
      REB: parseFloat(game.REB),
      AST: parseFloat(game.AST),
      TOV: parseFloat(game.TOV),
      "3PM": parseFloat(game["3PM"]),
      MIN: parseFloat(game.MIN),
    }));

  const predictWithRegression = (array) => {
    const x = array.map((_, i) => i + 1);
    const y = array;
    if (x.length < 2) return (y[y.length - 1] || 0).toFixed(1);
    const regression = new mlRegression.SimpleLinearRegression(x, y);
    const nextGame = x.length + 1;
    return regression.predict(nextGame).toFixed(1);
  };

  const calculateParlayProbability = (data, thresholds = { PTS: 20, REB: 5, AST: 6 }) => {
    const hits = data.filter(
      (g) => g.PTS >= thresholds.PTS && g.REB >= thresholds.REB && g.AST >= thresholds.AST
    );
    return ((hits.length / data.length) * 100).toFixed(2);
  };

  const playerData = selectedPlayer ? convertStats(playerStats[selectedPlayer]) : [];

  const statsMap = {
    PTS: playerData.map((g) => g.PTS),
    REB: playerData.map((g) => g.REB),
    AST: playerData.map((g) => g.AST),
    TOV: playerData.map((g) => g.TOV),
    '3PM': playerData.map((g) => g['3PM']),
    MIN: playerData.map((g) => g.MIN),
  };

  const predictions = Object.fromEntries(
    Object.entries(statsMap).map(([key, array]) => [key, predictWithRegression(array)])
  );

  const parlayThreshold = { PTS: 20, REB: 5, AST: 6 };
  const parlayChance = calculateParlayProbability(playerData, parlayThreshold);

  const chartData = playerData.map((game) => ({
    name: `G${game.gameNum}`,
    ...game,
  }));

  chartData.push({
    name: `Next`,
    ...Object.fromEntries(
      Object.keys(statsMap).map((key) => [key, parseFloat(predictions[key])])
    ),
    predicted: true,
  });

  return (
    <div className="prediction-container">
      <h2>🏀 NBA Player Stat Prediction</h2>

      <div className="stats-section">
        <label>Select Player: </label>
        <select
          value={selectedPlayer}
          onChange={(e) => setSelectedPlayer(e.target.value)}
        >
          {Object.keys(playerStats).map((player) => (
            <option key={player} value={player}>
              {player}
            </option>
          ))}
        </select>
      </div>

      {playerData.length === 0 ? (
        <p>Loading or no data...</p>
      ) : (
        <>
          <div className="stats-section">
            <h3>Next Game Predictions</h3>
            <ul>
              {Object.entries(predictions).map(([key, value]) => (
                <li key={key}>
                  {key}: <span className={getColorByProbability(value, statsMap[key])}>{value}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="stats-section">
            <h3>🎯 Parlay Probability</h3>
            <p>
              Chance of hitting {parlayThreshold.PTS}+ PTS, {parlayThreshold.REB}+ REB,{' '}
              {parlayThreshold.AST}+ AST:
            </p>
            <p className="green" style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{parlayChance}%</p>
          </div>

          <div className="chart-container">
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                {Object.keys(statsMap).map((stat) => (
                  <Line
                    key={stat}
                    type="monotone"
                    dataKey={stat}
                    stroke="#8884d8"
                    dot={{
                      stroke: '#000',
                      strokeWidth: 1,
                      r: 4,
                      fill: (entry) =>
                        entry && entry[stat] != null
                          ? getColorByProbability(entry[stat], statsMap[stat])
                          : '#000',
                    }}
                    strokeDasharray={(entry) => (entry?.predicted ? '5 5' : '')}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
};

export default Prediction;




