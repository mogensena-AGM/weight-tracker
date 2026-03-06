from flask import Flask, request, jsonify, render_template
import sqlite3
import os

app = Flask(__name__)
DATABASE = 'weight.db'

def get_db():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS weight_entries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT NOT NULL UNIQUE,
            weight REAL NOT NULL,
            note TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.commit()
    conn.close()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/entries', methods=['GET'])
def get_entries():
    conn = get_db()
    entries = conn.execute('SELECT * FROM weight_entries ORDER BY date DESC').fetchall()
    conn.close()
    return jsonify([dict(row) for row in entries])

@app.route('/api/entries', methods=['POST'])
def add_entry():
    data = request.get_json()
    date = data.get('date')
    weight = data.get('weight')
    note = data.get('note', '')
    if not date or not weight:
        return jsonify({'error': 'date and weight are required'}), 400
    try:
        weight = float(weight)
    except ValueError:
        return jsonify({'error': 'weight must be a number'}), 400
    conn = get_db()
    conn.execute(
        'INSERT OR REPLACE INTO weight_entries (date, weight, note) VALUES (?, ?, ?)',
        (date, weight, note)
    )
    conn.commit()
    conn.close()
    return jsonify({'message': 'Entry saved', 'date': date, 'weight': weight}), 201

@app.route('/api/entries/<string:date>', methods=['DELETE'])
def delete_entry(date):
    conn = get_db()
    conn.execute('DELETE FROM weight_entries WHERE date = ?', (date,))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Entry deleted'})

if __name__ == '__main__':
    init_db()
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
