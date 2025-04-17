from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd

app = Flask(__name__)
CORS(app)

@app.route('/predict', methods=['POST'])
def predict():
    data = request.json
    stats = data['stats']  # list of game stats per game
    thresholds = data['thresholds']  # dict: {"PTS": [10, 15, 20, 25], ...}

    results = {}

    for stat_type, values in thresholds.items():
        stat_counts = {str(v): 0 for v in values}
        for game in stats:
            if stat_type in game:
                val = int(game[stat_type]) if game[stat_type].isdigit() else 0
                for threshold in values:
                    if val >= threshold:
                        stat_counts[str(threshold)] += 1
        # Convert to probabilities
        total_games = len(stats)
        stat_probs = {k: round(v / total_games, 2) for k, v in stat_counts.items()}
        results[stat_type] = stat_probs

    return jsonify(results)

if __name__ == '__main__':
    app.run(port=5000)
