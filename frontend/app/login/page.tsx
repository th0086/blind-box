"use client";

import { FormEvent, useState } from 'react';
import { api } from '../../lib/api';

export default function LoginPage() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.post('/auth/login', { phone, password });
      window.location.href = '/';
    } catch (err) {
      setError('Login failed. Please check phone/password.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="card" style={{ padding: 20, maxWidth: 520, margin: '20px auto 0' }}>
      <h2 style={{ marginTop: 0 }}>Login</h2>
      <form onSubmit={submit} style={{ display: 'grid', gap: 12 }}>
        <label>
          Phone
          <input
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            style={{ width: '100%', marginTop: 6, padding: 10, borderRadius: 10, border: '1px solid #80c8c1' }}
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            style={{ width: '100%', marginTop: 6, padding: 10, borderRadius: 10, border: '1px solid #80c8c1' }}
          />
        </label>

        <button className="button" type="submit" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
        {error && <p style={{ color: '#b91c1c' }}>{error}</p>}
      </form>
    </section>
  );
}
