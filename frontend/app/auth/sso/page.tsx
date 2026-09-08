"use client";

import { useEffect, useState } from 'react';
import { api } from '../../../lib/api';

export default function SsoPage() {
  const [message, setMessage] = useState('Signing in...');

  useEffect(() => {
    const url = new URL(window.location.href);
    const merchant = url.searchParams.get('merchant');
    const token = url.searchParams.get('token');
    const phone = url.searchParams.get('phone');

    if (!merchant || !token || !phone) {
      setMessage('Invalid SSO params');
      return;
    }

    api
      .get(`/auth/sso?merchant=${encodeURIComponent(merchant)}&token=${encodeURIComponent(token)}&phone=${encodeURIComponent(phone)}`)
      .then(() => {
        window.location.href = '/';
      })
      .catch(() => {
        setMessage('SSO login failed');
      });
  }, []);

  return (
    <section className="card" style={{ padding: 20, marginTop: 20 }}>
      {message}
    </section>
  );
}
