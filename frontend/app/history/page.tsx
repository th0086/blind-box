"use client";

import { useEffect, useState } from 'react';
import { api } from '../../lib/api';

type RecordItem = {
  _id: string;
  prizeName: string;
  serialNumber: string;
  createdAt: string;
};

export default function HistoryPage() {
  const [rows, setRows] = useState<RecordItem[]>([]);

  useEffect(() => {
    api.get<RecordItem[]>('/history').then(setRows).catch(() => setRows([]));
  }, []);

  return (
    <section className="card" style={{ padding: 20 }}>
      <h2 style={{ marginTop: 0 }}>My Prize History</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', borderBottom: '1px solid #c9dfdc', paddingBottom: 8 }}>Prize</th>
            <th style={{ textAlign: 'left', borderBottom: '1px solid #c9dfdc', paddingBottom: 8 }}>Voucher Serial</th>
            <th style={{ textAlign: 'left', borderBottom: '1px solid #c9dfdc', paddingBottom: 8 }}>Time</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row._id}>
              <td style={{ padding: '10px 0', borderBottom: '1px solid #e1eceb' }}>{row.prizeName}</td>
              <td style={{ padding: '10px 0', borderBottom: '1px solid #e1eceb' }}>{row.serialNumber}</td>
              <td style={{ padding: '10px 0', borderBottom: '1px solid #e1eceb' }}>
                {new Date(row.createdAt).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
