"use client";

import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import { BlindBox } from '../components/BlindBox';
import { MarqueeBanner } from '../components/MarqueeBanner';
import { Modal } from '../components/Modal';
import { PrizeTable } from '../components/PrizeTable';
import { ApiError, api } from '../lib/api';

type Prize = {
  _id: string;
  name: string;
  value: number;
  probability: number;
  surfaceProbability?: number;
  imageUrl?: string;
  showInTeasers?: boolean;
  isActive: boolean;
};

type Quota = {
  dailyLimit: number;
  usedToday: number;
  remainingToday: number;
};

type DrawResult = {
  prize: { id: string; name: string; value: number };
  serialNumber: string;
  remainingToday: number;
};

type HistoryRecord = {
  _id: string;
  prizeName: string;
  serialNumber: string;
  createdAt: string;
};

type ActiveModal = 'prizes' | 'history' | 'redeem' | null;
type MeResponse = { role: 'user' | 'super_admin' };

function PrizeListIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M7.5 6.2h9l-1 2.3h-7z" fill="currentColor" />
      <path d="M7 9h10v9.5H7z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M12 9V5.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M9.8 6.3c-.8 0-1.4-.6-1.4-1.4S9 3.5 9.8 3.5c1.1 0 1.6 1 2.2 2.8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M14.2 6.3c.8 0 1.4-.6 1.4-1.4s-.6-1.4-1.4-1.4c-1.1 0-1.6 1-2.2 2.8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function HistoryIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4.5 6.8v3.2h3.2" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 8.1v4.3l2.9 1.8" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function RedeemIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="5.5" y="4.5" width="13" height="15" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M9 9h6M9 12h6M9 15h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export default function HomePage() {
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [historyRows, setHistoryRows] = useState<HistoryRecord[]>([]);
  const [quota, setQuota] = useState<Quota | null>(null);
  const [lastDraw, setLastDraw] = useState<DrawResult | null>(null);
  const [error, setError] = useState<string>('');
  const [needLogin, setNeedLogin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [copiedSerial, setCopiedSerial] = useState<string>('');
  const [userRole, setUserRole] = useState<'user' | 'super_admin' | null>(null);

  async function refreshPrizes() {
    try {
      const latestPrizes = await api.get<Prize[]>('/prizes');
      setPrizes(latestPrizes);
    } catch {
      // keep existing list if refresh fails
    }
  }

  useEffect(() => {
    refreshPrizes();
    api
      .get<MeResponse>('/auth/me')
      .then((me) => {
        setUserRole(me.role);
      })
      .catch(() => {
        setUserRole(null);
      });
    api
      .get<Quota>('/draw/quota')
      .then((data) => {
        setQuota(data);
        setNeedLogin(false);
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) {
          setNeedLogin(true);
        }
        setQuota(null);
      });
  }, []);

  useEffect(() => {
    if (activeModal !== 'history' || historyLoaded || needLogin) {
      return;
    }

    api
      .get<HistoryRecord[]>('/history')
      .then((rows) => {
        setHistoryRows(rows);
        setHistoryLoaded(true);
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) {
          setNeedLogin(true);
        }
      });
  }, [activeModal, historyLoaded, needLogin]);

  useEffect(() => {
    if (activeModal === 'prizes') {
      refreshPrizes();
    }
  }, [activeModal]);

  const canDraw = useMemo(() => (quota ? quota.remainingToday > 0 : true), [quota]);
  const teaserPrizes = useMemo(() => prizes.filter((p) => p.isActive && p.showInTeasers), [prizes]);

  const prizeAssetRules: Array<{ image: string; keywords: string[] }> = [
    { image: '/ps5.png', keywords: ['ps5', 'playstation 5', 'play station 5', 'playstation', 'sony console'] },
    { image: '/switch.png', keywords: ['switch', 'nintendo switch', 'nintendo', 'oled switch'] },
    { image: '/tv.png', keywords: ['tv', 'smart tv', 'television', 'samsung', 'lg tv', 'screen'] },
    {
      image: '/bonus.png',
      keywords: ['bonus', 'cash', 'credit', 'voucher', 'token', 'wallet', 'kes', 'ksh', 'money'],
    },
  ];

  function normalizePrizeName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  }

  function getPrizeImage(prize: Prize): string {
    if (prize.imageUrl?.trim()) {
      return prize.imageUrl;
    }

    const normalizedName = normalizePrizeName(prize.name);
    const matchedRule = prizeAssetRules.find((rule) =>
      rule.keywords.some((keyword) => normalizedName.includes(normalizePrizeName(keyword))),
    );

    return matchedRule?.image ?? '/bonus.png';
  }

  async function copySerial(serialNumber: string) {
    try {
      await navigator.clipboard.writeText(serialNumber);
      setCopiedSerial(serialNumber);
      window.setTimeout(() => {
        setCopiedSerial((current) => (current === serialNumber ? '' : current));
      }, 1400);
    } catch {
      setError('Copy failed. Please copy manually.');
    }
  }

  function openModal(target: ActiveModal) {
    if (target === 'history' && needLogin) {
      setError('Please login first to view your history.');
      return;
    }
    setActiveModal(target);
  }

  async function handleDraw() {
    setError('');
    setLoading(true);
    try {
      if (needLogin) {
        setError('Please login first to draw.');
        return;
      }

      const result = await api.post<DrawResult>('/draw');
      setLastDraw(result);
      setHistoryLoaded(false);
      await refreshPrizes();
      setQuota((prev) => {
        if (!prev) {
          return { dailyLimit: 3, usedToday: 3 - result.remainingToday, remainingToday: result.remainingToday };
        }
        return {
          ...prev,
          usedToday: prev.dailyLimit - result.remainingToday,
          remainingToday: result.remainingToday,
        };
      });
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setNeedLogin(true);
        setError('Please login first to draw.');
      } else {
        setError((err as Error).message || 'Draw failed');
      }
      try {
        const currentQuota = await api.get<Quota>('/draw/quota');
        setQuota(currentQuota);
        setNeedLogin(false);
      } catch {
        // keep existing value
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleResetDrawQuota() {
    setError('');
    setLoading(true);
    try {
      const updated = await api.post<Quota>('/draw/reset');
      setQuota(updated);
      setNeedLogin(false);
    } catch (err) {
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        setError('Only super admin can reset draw chances.');
      } else {
        setError((err as Error).message || 'Reset failed');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bb-page">
      <MarqueeBanner />

      <div className="bb-tabs" role="tablist" aria-label="Blind box tabs">
        <button type="button" className="bb-tab is-active" onClick={() => openModal('prizes')}>
          <span className="bb-tab-icon"><PrizeListIcon /></span>
          <span>Prize List</span>
        </button>
        <button type="button" className="bb-tab" onClick={() => openModal('history')}>
          <span className="bb-tab-icon"><HistoryIcon /></span>
          <span>History Record</span>
        </button>
        <button type="button" className="bb-tab" onClick={() => openModal('redeem')}>
          <span className="bb-tab-icon"><RedeemIcon /></span>
          <span>Redeem Guide</span>
        </button>
      </div>

      <section className="bb-main-stage card">
        <aside className="bb-side-panel bb-side-left">
          <div className="bb-side-left-top">
            <h3 className="bb-side-left-title">WIN CASH & PRIZES</h3>
            <p className="bb-side-left-desc">Open the Blind Box and win real cash or premium rewards!</p>
          </div>

          <div className="bb-side-left-visual" aria-hidden="true" />

          <ul className="bb-side-left-list">
            <li>Chance to Win Rewards</li>
            <li>Instant Credit to Account</li>
            <li>More Chances, More Wins</li>
          </ul>
        </aside>

        <div className="bb-center-stage">
          <div className="bb-stage-visual">
            <Image
              src="/blind_box_background.png"
              alt="Blind box stage"
              fill
              sizes="(max-width: 720px) 96vw, 58vw"
              className="bb-stage-background"
            />

            <div className="bb-box-wrap">
              <BlindBox />
            </div>
          </div>

          <div className="bb-draw-panel">
            <div className="bb-draw-title-row">
              <span className="bb-draw-star" aria-hidden="true">★</span>
              <div className="bb-draw-title">DRAW CHANCES</div>
              <div className="bb-draw-count">{needLogin ? '-' : quota?.remainingToday ?? '-'}</div>
              <span className="bb-draw-star" aria-hidden="true">★</span>
            </div>
            <small>Today remaining quota for this account</small>
            <button
              type="button"
              className="bb-draw-image-btn"
              onClick={handleDraw}
              disabled={loading || !canDraw || needLogin}
              aria-label={loading ? 'Drawing' : 'Draw Once'}
            >
              <Image src="/draw_once_v2.png" alt="Draw Once" width={500} height={96} className="bb-draw-image" />
            </button>
            {userRole === 'super_admin' && (
              <button type="button" className="ghost-button" onClick={handleResetDrawQuota} disabled={loading}>
                Reset Draw Chances
              </button>
            )}
            {needLogin && <p className="empty-note">Login required before drawing or viewing personal records.</p>}
            {!needLogin && !canDraw && <p className="empty-note">You have reached your daily draw limit.</p>}
            {error && <p className="bb-error-note">{error}</p>}
            {lastDraw && (
              <div className="card bb-last-draw-card">
                <div className="bb-last-draw-prize">You got: {lastDraw.prize.name}</div>
                <div>Voucher Serial: {lastDraw.serialNumber}</div>
              </div>
            )}
          </div>
        </div>

        <aside className="bb-side-panel bb-side-right">
          <h3>PRIZE TEASERS</h3>
          <div className="bb-teaser-list">
            {teaserPrizes.length ? (
              teaserPrizes.map((prize) => (
                <div key={prize._id} className="bb-teaser-item">
                  <Image src={getPrizeImage(prize)} alt={prize.name} width={62} height={44} />
                  <div>
                    <strong>{prize.name}</strong>
                    <small>Quantity: {prize.value}</small>
                    <small>Probability: {(prize.surfaceProbability ?? prize.probability ?? 0).toFixed(2)}%</small>
                  </div>
                </div>
              ))
            ) : (
              <div className="bb-teaser-item">
                <Image src="/bonus.png" alt="Bonus" width={62} height={44} />
                <div>
                  <strong>10,000 KES Bonus</strong>
                  <small>Quantity: -</small>
                  <small>Probability: -</small>
                </div>
              </div>
            )}
          </div>
        </aside>
      </section>

      <div className="invite-panel">
        <Image src="/invite.png" alt="Invite section background" fill className="invite-bg-image" sizes="(max-width: 720px) 96vw, 92vw" />
        <a href="https://mouse-lottery.weedza.co/" className="invite-hotspot" target="_blank" rel="noreferrer">
          Generate Invite Link
        </a>
      </div>

      <Modal title="Prize List" open={activeModal === 'prizes'} onClose={() => setActiveModal(null)}>
        <PrizeTable prizes={prizes} />
      </Modal>

      <Modal title="History Record" open={activeModal === 'history'} onClose={() => setActiveModal(null)}>
        {needLogin ? (
          <p className="empty-note">Please login first to view your personal winning records.</p>
        ) : historyRows.length ? (
          <table className="table-shell">
            <thead>
              <tr>
                <th style={{ textAlign: 'left' }}>Prize</th>
                <th style={{ textAlign: 'left' }}>Voucher Serial</th>
                <th style={{ textAlign: 'left' }}>Time</th>
              </tr>
            </thead>
            <tbody>
              {historyRows.map((row) => (
                <tr key={row._id}>
                  <td>{row.prizeName}</td>
                  <td>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                      <span>{row.serialNumber}</span>
                      <button
                        type="button"
                        className="ghost-button"
                        style={{ padding: '5px 10px', fontSize: 12 }}
                        onClick={() => copySerial(row.serialNumber)}
                      >
                        {copiedSerial === row.serialNumber ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                  </td>
                  <td>{new Date(row.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="empty-note">No records yet. Draw once and your voucher history will appear here.</p>
        )}
      </Modal>

      <Modal title="Redeem Guide" open={activeModal === 'redeem'} onClose={() => setActiveModal(null)}>
        <div style={{ display: 'grid', gap: 10, color: '#f7f1de', lineHeight: 1.8 }}>
          <p style={{ margin: 0 }}>1. Keep your winning voucher serial number.</p>
          <p style={{ margin: 0 }}>2. Contact official customer support or the page administrator.</p>
          <p style={{ margin: 0 }}>3. Fill in the requested profile information for prize verification.</p>
          <p style={{ margin: 0 }}>4. Rewards are processed after manual verification from the official team.</p>
        </div>
      </Modal>
    </div>
  );
}
