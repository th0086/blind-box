"use client";

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api } from '../lib/api';

type MeResponse = { sub: string; phone: string; role: 'user' | 'super_admin' };

function CrownIcon() {
  return (
    <svg viewBox="0 0 24 24" className="bb-header-action-svg" aria-hidden="true" focusable="false">
      <path
        d="M3 8.4L7.7 12 12 6.9 16.3 12 21 8.4 19.4 18H4.6L3 8.4z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M7.4 18h9.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="3.6" cy="7.8" r="1.3" fill="currentColor" />
      <circle cx="12" cy="6.2" r="1.3" fill="currentColor" />
      <circle cx="20.4" cy="7.8" r="1.3" fill="currentColor" />
    </svg>
  );
}

function ExitIcon() {
  return (
    <svg viewBox="0 0 24 24" className="bb-header-action-svg" aria-hidden="true" focusable="false">
      <path
        d="M9 4.5h7.2a1.8 1.8 0 011.8 1.8v11.4a1.8 1.8 0 01-1.8 1.8H9"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path d="M13.5 12H4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M8.5 8l-4 4 4 4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Header() {
  const [user, setUser] = useState<MeResponse | null>(null);

  useEffect(() => {
    let mounted = true;
    api
      .get<MeResponse>('/auth/me')
      .then((data) => {
        if (mounted) {
          setUser(data);
        }
      })
      .catch(() => {
        if (mounted) {
          setUser(null);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  async function logout() {
    await api.post('/auth/logout');
    setUser(null);
    window.location.href = '/';
  }

  return (
    <header className="bb-header-wrap">
      <div className="container bb-header">
        <span className="bb-phone-chip">{user ? user.phone : 'Guest'}</span>

        <Link href="/" className="bb-brand" aria-label="Back to home">
          <Image src="/logo.png" alt="Ke7.com" width={210} height={56} priority className="bb-ke-logo" />
          <span className="bb-brand-divider" aria-hidden="true" />
          <Image src="/blind_box_logo.png" alt="Blind Box" width={182} height={30} priority className="bb-blind-box-logo" />
        </Link>

        <div className="bb-header-actions">
          {user?.role === 'super_admin' && (
            <Link href="/admin/prizes" className="bb-header-action bb-header-action-admin" aria-label="Admin">
              <CrownIcon />
              <span>Admin</span>
            </Link>
          )}
          {user ? (
            <button type="button" className="bb-header-action bb-header-action-gold" onClick={logout} aria-label="Logout">
              <span>Logout</span>
              <ExitIcon />
            </button>
          ) : (
            <Link href="/login" className="bb-header-action bb-header-action-gold" aria-label="Login">
              <span>Login</span>
              <ExitIcon />
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
