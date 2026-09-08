"use client";

import { useEffect, useRef, useState } from 'react';
import { api } from '../lib/api';
import { socket } from '../lib/socket';

const DEFAULT_MARQUEE_MESSAGE = 'Welcome to Ke7.com Blind Box';
const MARQUEE_REFRESH_MS = 3 * 60 * 1000;

function SpeakerIcon({ size = 20, color = '#9c5cff' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 10v4h3.8L13 18V6L7.8 10H4z" fill={color} />
      <path d="M16 9.2c1 .8 1.6 1.8 1.6 2.8s-.6 2-1.6 2.8" stroke={color} strokeWidth="1.9" strokeLinecap="round" />
      <path d="M17.9 6.8c1.8 1.4 2.9 3.2 2.9 5.2s-1.1 3.8-2.9 5.2" stroke={color} strokeWidth="1.9" strokeLinecap="round" />
    </svg>
  );
}

export function MarqueeBanner() {
  const [displayMessages, setDisplayMessages] = useState<string[]>([DEFAULT_MARQUEE_MESSAGE]);
  const pendingLiveMessagesRef = useRef<string[]>([]);
  const pendingSnapshotRef = useRef<string[] | null>(null);
  const marqueeMessages = displayMessages.slice(0, 3);
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const [motion, setMotion] = useState({ from: -900, to: 900, duration: 18 });

  function dedupeKeepOrder(items: string[]): string[] {
    const seen = new Set<string>();
    const result: string[] = [];
    for (const item of items) {
      if (!seen.has(item)) {
        seen.add(item);
        result.push(item);
      }
    }
    return result;
  }

  function applyPendingMessages() {
    setDisplayMessages((current) => {
      const snapshot = pendingSnapshotRef.current;
      const live = pendingLiveMessagesRef.current;

      if (!snapshot && live.length === 0) {
        return current;
      }

      let next = snapshot ?? current;
      if (snapshot) {
        pendingSnapshotRef.current = null;
      }

      if (live.length > 0) {
        next = dedupeKeepOrder([...live, ...next]).slice(0, 8);
        pendingLiveMessagesRef.current = [];
      }

      return next.length ? next : [DEFAULT_MARQUEE_MESSAGE];
    });
  }

  async function fetchRecentWinners() {
    try {
      const rows = await api.get<Array<{ message: string; timestamp: string }>>('/broadcast/recent');
      const recentMessages = rows.map((row) => row.message).slice(0, 8);
      return recentMessages.length ? recentMessages : [DEFAULT_MARQUEE_MESSAGE];
    } catch {
      return null;
    }
  }

  useEffect(() => {
    let mounted = true;

    void fetchRecentWinners().then((messages) => {
      if (!mounted || !messages) {
        return;
      }
      setDisplayMessages(messages);
    });

    const refreshTimer = window.setInterval(() => {
      void fetchRecentWinners().then((messages) => {
        if (!mounted || !messages) {
          return;
        }
        pendingSnapshotRef.current = messages;
      });
    }, MARQUEE_REFRESH_MS);

    socket.connect();

    socket.on('newWinner', (payload: { message: string }) => {
      pendingLiveMessagesRef.current = [payload.message, ...pendingLiveMessagesRef.current].slice(0, 8);
    });

    return () => {
      mounted = false;
      window.clearInterval(refreshTimer);
      socket.off('newWinner');
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    const updateMotion = () => {
      const containerWidth = containerRef.current?.clientWidth ?? 0;
      const textWidth = textRef.current?.scrollWidth ?? 0;

      if (!containerWidth || !textWidth) {
        return;
      }

      // Keep a stable reading speed while adapting to message/container width.
      const speedPxPerSecond = 68;
      const duration = Math.max(10, (containerWidth + textWidth) / speedPxPerSecond);
      setMotion({ from: -textWidth, to: containerWidth, duration });
    };

    updateMotion();

    const resizeObserver = new ResizeObserver(() => {
      updateMotion();
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    if (textRef.current) {
      resizeObserver.observe(textRef.current);
    }

    window.addEventListener('resize', updateMotion);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateMotion);
    };
  }, [displayMessages]);

  return (
    <div
      className="card"
      style={{
        padding: '10px 14px',
        overflow: 'hidden',
        background: 'linear-gradient(180deg, rgba(11, 5, 24, 0.92), rgba(7, 2, 17, 0.94))',
        borderRadius: 18,
        borderColor: 'rgba(139, 92, 246, 0.68)',
        boxShadow: '0 0 0 1px rgba(124, 58, 237, 0.28), inset 0 0 24px rgba(117, 42, 255, 0.12)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <div
          style={{
            width: 30,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRight: '1px solid rgba(138, 99, 255, 0.32)',
            paddingRight: 8,
          }}
        >
          <SpeakerIcon size={21} color="#8f53ff" />
        </div>

        <div
          ref={containerRef}
          style={{
            flex: 1,
            minWidth: 0,
            overflow: 'hidden',
          }}
        >
          <div
            ref={textRef}
            onAnimationIteration={applyPendingMessages}
            style={{
              whiteSpace: 'nowrap',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 180,
              animation: `marqueeLeftToRight ${motion.duration}s linear infinite`,
              fontWeight: 700,
              color: '#ddd2ff',
              transform: `translateX(${motion.from}px)`,
            }}
          >
            {marqueeMessages.map((message, index) => (
              <span
                key={`${message}-${index}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '2px 0',
                }}
              >
                {message}
              </span>
            ))}
          </div>
        </div>

        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '7px 12px',
            borderRadius: 999,
            border: '1px solid rgba(151, 111, 255, 0.45)',
            background: 'rgba(73, 25, 141, 0.28)',
            color: '#a56cff',
            fontWeight: 800,
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          <SpeakerIcon size={16} color="#a56cff" />
          <span>Next Draw Time 21:00</span>
          <span style={{ fontSize: 18, lineHeight: 1 }}>›</span>
        </div>
      </div>
      <style jsx>{`
        @keyframes marqueeLeftToRight {
          from { transform: translateX(${motion.from}px); }
          to { transform: translateX(${motion.to}px); }
        }
      `}</style>
    </div>
  );
}
