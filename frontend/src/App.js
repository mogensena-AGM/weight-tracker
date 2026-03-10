import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import './App.css';

const API_URL = process.env.REACT_APP_API_URL || '';

function App() {
  const [entries, setEntries] = useState([]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [weight, setWeight] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchEntries();
  }, []);

  const fetchEntries = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/entries`);
      setEntries(res.data);
    } catch (err) {
      setError('Kunne ikke hente data. Prøv igen.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!weight || isNaN(weight)) {
      setError('Indtast en gyldig vægt');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await axios.post(`${API_URL}/api/entries`, {
        date,
        weight: parseFloat(weight),
        note,
      });
      setWeight('');
      setNote('');
      fetchEntries();
    } catch (err) {
      setError('Fejl ved gemning. Prøv igen.');
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_URL}/api/entries/${id}`);
      fetchEntries();
    } catch (err) {
      setError('Fejl ved sletning.');
    }
  };

  const chartData = [...entries]
    .reverse()
    .map(e => ({ date: e.date, weight: e.weight }));

  const latestWeight = entries.length > 0 ? entries[0].weight : null;
  const firstWeight = entries.length > 0 ? entries[entries.length - 1].weight : null;
  const weightChange = latestWeight && firstWeight ? (latestWeight - firstWeight).toFixed(1) : null;

  return (
    <div className="app">
      <header>
        <h1>Vægttracker</h1>
        <p>Hold styr på din vægt over tid</p>
      </header>

      {error && <div className="error">{error}</div>}

      <section className="stats">
        {latestWeight && (
          <>
            <div className="stat-card">
              <span className="stat-label">Nuværende vægt</span>
              <span className="stat-value">{latestWeight} kg</span>
            </div>
            {weightChange !== null && (
              <div className="stat-card">
                <span className="stat-label">Total ændring</span>
                <span className={`stat-value ${parseFloat(weightChange) < 0 ? 'green' : 'red'}`}>
                  {weightChange > 0 ? '+' : ''}{weightChange} kg
                </span>
              </div>
            )}
            <div className="stat-card">
              <span className="stat-label">Antal målinger</span>
              <span className="stat-value">{entries.length}</span>
            </div>
          </>
        )}
      </section>

      <section className="form-section">
        <h2>Tilføj måling</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Dato</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Vægt (kg)</label>
              <input
                type="number"
                step="0.1"
                placeholder="f.eks. 75.5"
                value={weight}
                onChange={e => setWeight(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Note (valgfri)</label>
              <input
                type="text"
                placeholder="f.eks. efter morgenmad"
                value={note}
                onChange={e => setNote(e.target.value)}
              />
            </div>
          </div>
          <button type="submit" disabled={loading}>
            {loading ? 'Gemmer...' : 'Gem måling'}
          </button>
        </form>
      </section>

      {chartData.length > 1 && (
        <section className="chart-section">
          <h2>Udvikling over tid</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis domain={['auto', 'auto']} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line type="monotone" dataKey="weight" stroke="#4f46e5" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </section>
      )}

      <section className="entries-section">
        <h2>Alle målinger</h2>
        {entries.length === 0 ? (
          <p className="empty">Ingen målinger endnu. Tilføj din første!</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Dato</th>
                <th>Vægt</th>
                <th>Note</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {entries.map(entry => (
                <tr key={entry.id}>
                  <td>{entry.date}</td>
                  <td>{entry.weight} kg</td>
                  <td>{entry.note || '-'}</td>
                  <td>
                    <button className="delete-btn" onClick={() => handleDelete(entry.id)}>
                      Slet
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

export default App;
