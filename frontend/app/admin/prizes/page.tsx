"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../../../lib/api';

type Prize = {
  _id: string;
  name: string;
  description: string;
  value: number;
  probability: number;
  surfaceProbability?: number;
  marqueeEnabled?: boolean;
  autoMarqueeEnabled?: boolean;
  autoMarqueeIntervalMinutes?: number;
  imageUrl?: string;
  showInTeasers?: boolean;
  isActive: boolean;
};

type MeResponse = { role: 'user' | 'super_admin' };

const EMPTY_FORM = {
  name: '',
  description: '',
  value: 1,
  probability: 0,
  surfaceProbability: 0,
  marqueeEnabled: true,
  autoMarqueeEnabled: false,
  autoMarqueeIntervalMinutes: 0,
  imageUrl: '',
  showInTeasers: false,
  isActive: true,
};

export default function AdminPrizesPage() {
  const [authorized, setAuthorized] = useState(false);
  const [rows, setRows] = useState<Prize[]>([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const imageInputRef = useRef<HTMLInputElement | null>(null);

  async function load() {
    const data = await api.get<Prize[]>('/prizes?includeInactive=true');
    setRows(data);
  }

  useEffect(() => {
    api
      .get<MeResponse>('/auth/me')
      .then((me) => {
        if (me.role !== 'super_admin') {
          window.location.href = '/';
          return;
        }
        setAuthorized(true);
        return load();
      })
      .catch(() => {
        window.location.href = '/login';
      });
  }, []);

  const totalProbability = useMemo(
    () => rows.reduce((sum, item) => sum + Number(item.probability || 0), 0),
    [rows],
  );

  function resetForm() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setSelectedImageFile(null);
    setImagePreviewUrl('');
    if (imageInputRef.current) {
      imageInputRef.current.value = '';
    }
  }

  useEffect(() => {
    if (!selectedImageFile) {
      setImagePreviewUrl('');
      return undefined;
    }

    const previewUrl = URL.createObjectURL(selectedImageFile);
    setImagePreviewUrl(previewUrl);

    return () => URL.revokeObjectURL(previewUrl);
  }, [selectedImageFile]);

  function validateForm() {
    if (!form.name.trim()) {
      return 'Prize name is required';
    }
    if (form.value < 0) {
      return 'Remaining Quantity must be 0 or greater';
    }
    if (form.probability < 0 || form.probability > 100) {
      return 'Probability (Actual) must be between 0 and 100';
    }
    if (form.surfaceProbability < 0 || form.surfaceProbability > 100) {
      return 'Surface Probability must be between 0 and 100';
    }
    if (form.autoMarqueeIntervalMinutes < 0) {
      return 'Auto marquee interval must be 0 or greater';
    }
    if (form.autoMarqueeEnabled && form.autoMarqueeIntervalMinutes <= 0) {
      return 'Please set auto marquee interval greater than 0 minute';
    }
    return '';
  }

  function startEdit(row: Prize) {
    setEditingId(row._id);
    setForm({
      name: row.name,
      description: row.description,
      value: row.value,
      probability: row.probability,
      surfaceProbability: row.surfaceProbability ?? row.probability,
      marqueeEnabled: row.marqueeEnabled ?? true,
      autoMarqueeEnabled: row.autoMarqueeEnabled ?? false,
      autoMarqueeIntervalMinutes: row.autoMarqueeIntervalMinutes ?? 0,
      imageUrl: row.imageUrl ?? '',
      showInTeasers: row.showInTeasers ?? false,
      isActive: row.isActive,
    });
    setSelectedImageFile(null);
    setImagePreviewUrl('');
    if (imageInputRef.current) {
      imageInputRef.current.value = '';
    }
  }

  function onImageFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setSelectedImageFile(file);
  }

  async function uploadSelectedImage() {
    if (!selectedImageFile) {
      setError('Please choose an image file first');
      return;
    }

    setUploadingImage(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', selectedImageFile);
      const result = await api.upload<{ imageUrl: string }>('/prizes/upload-image', formData);
      setForm((prev) => ({ ...prev, imageUrl: result.imageUrl }));
      setSelectedImageFile(null);
      if (imageInputRef.current) {
        imageInputRef.current.value = '';
      }
    } catch (err) {
      setError((err as Error).message || 'Image upload failed');
    } finally {
      setUploadingImage(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }
    try {
      let imageUrl = form.imageUrl.trim();

      if (selectedImageFile) {
        const formData = new FormData();
        formData.append('file', selectedImageFile);
        const uploadResult = await api.upload<{ imageUrl: string }>('/prizes/upload-image', formData);
        imageUrl = uploadResult.imageUrl;
        setSelectedImageFile(null);
        if (imageInputRef.current) {
          imageInputRef.current.value = '';
        }
      }

      const payload = { ...form, imageUrl };

      if (editingId) {
        await api.put(`/prizes/${editingId}`, payload);
      } else {
        await api.post('/prizes', payload);
      }
      await load();
      resetForm();
    } catch (err) {
      setError((err as Error).message || 'Save failed');
    }
  }

  async function remove(id: string) {
    if (!window.confirm('Delete this prize?')) {
      return;
    }
    await api.delete(`/prizes/${id}`);
    await load();
  }

  if (!authorized) {
    return <section className="card" style={{ padding: 20 }}>Checking access...</section>;
  }

  return (
    <section style={{ display: 'grid', gap: 16, width: '100%', overflowX: 'auto', paddingBottom: 16 }}>
      <div className="card" style={{ padding: 20, minWidth: 1180 }}>
        <h2 style={{ marginTop: 0 }}>Admin Prize Management</h2>
        <p style={{ marginTop: 0 }}>
          Total actual probability: <strong>{totalProbability.toFixed(2)}%</strong>
        </p>

        <form onSubmit={submit} style={{ display: 'grid', gap: 10 }}>
          <div style={{ display: 'grid', gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 700 }}>Prize name</label>
            <input
              placeholder="Prize name"
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              required
              style={{ padding: 10, borderRadius: 10, border: '1px solid #86c5c0' }}
            />
          </div>
          <div style={{ display: 'grid', gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 700 }}>Description</label>
            <input
              placeholder="Description"
              value={form.description}
              onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
              style={{ padding: 10, borderRadius: 10, border: '1px solid #86c5c0' }}
            />
          </div>
          <div style={{ display: 'grid', gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 700 }}>Prize Image</label>
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              onChange={onImageFileChange}
              style={{ padding: 10, borderRadius: 10, border: '1px solid #86c5c0', background: '#fff' }}
            />
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              <button
                type="button"
                className="button"
                onClick={uploadSelectedImage}
                disabled={uploadingImage || !selectedImageFile}
              >
                {uploadingImage ? 'Uploading...' : 'Upload Image'}
              </button>
              <input
                placeholder="Image URL"
                value={form.imageUrl ?? ''}
                onChange={(event) => setForm((prev) => ({ ...prev, imageUrl: event.target.value }))}
                style={{ flex: 1, minWidth: 260, padding: 10, borderRadius: 10, border: '1px solid #86c5c0' }}
              />
            </div>
            {(imagePreviewUrl || form.imageUrl) && (
              <div
                style={{
                  display: 'flex',
                  gap: 12,
                  alignItems: 'center',
                  padding: 12,
                  borderRadius: 12,
                  border: '1px solid #c9dfdc',
                  background: '#f8fbfb',
                }}
              >
                <img
                  src={imagePreviewUrl || form.imageUrl}
                  alt="Prize preview"
                  style={{ width: 88, height: 64, objectFit: 'cover', borderRadius: 8, border: '1px solid #c9dfdc' }}
                />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>Preview</div>
                  <div style={{ fontSize: 12, wordBreak: 'break-all', color: '#466' }}>{form.imageUrl || 'Local file selected'}</div>
                </div>
              </div>
            )}
          </div>
          <div style={{ display: 'grid', gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 700 }}>Remaining Quantity</label>
            <input
              placeholder="Remaining Quantity"
              type="number"
              min={0}
              step="1"
              value={form.value}
              onChange={(event) => setForm((prev) => ({ ...prev, value: Number(event.target.value) }))}
              required
              style={{ padding: 10, borderRadius: 10, border: '1px solid #86c5c0' }}
            />
          </div>
          <div style={{ display: 'grid', gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 700 }}>Surface Probability %</label>
            <input
              placeholder="Surface Probability %"
              type="number"
              min={0}
              max={100}
              step="0.01"
              value={form.surfaceProbability}
              onChange={(event) => setForm((prev) => ({ ...prev, surfaceProbability: Number(event.target.value) }))}
              required
              style={{ padding: 10, borderRadius: 10, border: '1px solid #86c5c0' }}
            />
          </div>
          <div style={{ display: 'grid', gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 700 }}>Probability (Actual) %</label>
            <input
              placeholder="Probability (Actual) %"
              type="number"
              min={0}
              max={100}
              step="0.01"
              value={form.probability}
              onChange={(event) => setForm((prev) => ({ ...prev, probability: Number(event.target.value) }))}
              required
              style={{ padding: 10, borderRadius: 10, border: '1px solid #86c5c0' }}
            />
          </div>
          <label>
            <input
              type="checkbox"
              checked={form.marqueeEnabled}
              onChange={(event) => setForm((prev) => ({ ...prev, marqueeEnabled: event.target.checked }))}
            />{' '}
            Show winner in marquee
          </label>

          <label>
            <input
              type="checkbox"
              checked={form.autoMarqueeEnabled}
              onChange={(event) => setForm((prev) => ({ ...prev, autoMarqueeEnabled: event.target.checked }))}
            />{' '}
            Auto-draw winner to marquee
          </label>

          <div style={{ display: 'grid', gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 700 }}>Auto marquee interval (minutes)</label>
            <input
              placeholder="Auto marquee interval (minutes)"
              type="number"
              min={0}
              step="1"
              value={form.autoMarqueeIntervalMinutes}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, autoMarqueeIntervalMinutes: Number(event.target.value) }))
              }
              style={{ padding: 10, borderRadius: 10, border: '1px solid #86c5c0' }}
            />
          </div>

          <label>
            <input
              type="checkbox"
              checked={form.showInTeasers ?? false}
              onChange={(event) => setForm((prev) => ({ ...prev, showInTeasers: event.target.checked }))}
            />{' '}
            Show in PRIZE TEASERS
          </label>

          <label>
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(event) => setForm((prev) => ({ ...prev, isActive: event.target.checked }))}
            />{' '}
            Active
          </label>

          <div style={{ display: 'flex', gap: 10 }}>
            <button className="button" type="submit">
              {editingId ? 'Update Prize' : 'Create Prize'}
            </button>
            {editingId && (
              <button className="button" type="button" onClick={resetForm}>
                Cancel
              </button>
            )}
          </div>
          {error && <p style={{ color: '#b91c1c', wordBreak: 'break-word' }}>{error}</p>}
        </form>
      </div>

      <div className="card" style={{ padding: 20, minWidth: 1180 }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', minWidth: 1120, borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #c9dfdc', padding: '0 12px 8px 0', whiteSpace: 'nowrap' }}>Name</th>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #c9dfdc', padding: '0 12px 8px', whiteSpace: 'nowrap' }}>Image</th>
              <th style={{ textAlign: 'right', borderBottom: '1px solid #c9dfdc', padding: '0 12px 8px', whiteSpace: 'nowrap' }}>Remaining Quantity</th>
              <th style={{ textAlign: 'right', borderBottom: '1px solid #c9dfdc', padding: '0 12px 8px', whiteSpace: 'nowrap' }}>Probability (Actual)</th>
              <th style={{ textAlign: 'right', borderBottom: '1px solid #c9dfdc', padding: '0 12px 8px', whiteSpace: 'nowrap' }}>Surface Probability</th>
              <th style={{ textAlign: 'center', borderBottom: '1px solid #c9dfdc', padding: '0 12px 8px', whiteSpace: 'nowrap' }}>Teasers</th>
              <th style={{ textAlign: 'center', borderBottom: '1px solid #c9dfdc', padding: '0 12px 8px', whiteSpace: 'nowrap' }}>Marquee</th>
              <th style={{ textAlign: 'center', borderBottom: '1px solid #c9dfdc', padding: '0 12px 8px', whiteSpace: 'nowrap' }}>Auto Marquee</th>
              <th style={{ textAlign: 'right', borderBottom: '1px solid #c9dfdc', padding: '0 12px 8px', whiteSpace: 'nowrap' }}>Interval (min)</th>
              <th style={{ textAlign: 'center', borderBottom: '1px solid #c9dfdc', padding: '0 12px 8px', whiteSpace: 'nowrap' }}>Active</th>
              <th style={{ textAlign: 'right', borderBottom: '1px solid #c9dfdc', padding: '0 0 8px 12px', whiteSpace: 'nowrap' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row._id}>
                <td style={{ padding: '10px 12px 10px 0', borderBottom: '1px solid #e1eceb' }}>{row.name}</td>
                <td style={{ padding: '10px 12px', borderBottom: '1px solid #e1eceb' }}>
                  {row.imageUrl ? (
                    <img
                      src={row.imageUrl}
                      alt={row.name}
                      style={{ width: 72, height: 48, objectFit: 'cover', borderRadius: 8, border: '1px solid #c9dfdc' }}
                    />
                  ) : (
                    '-'
                  )}
                </td>
                <td style={{ textAlign: 'right', padding: '10px 12px', borderBottom: '1px solid #e1eceb' }}>{row.value}</td>
                <td style={{ textAlign: 'right', padding: '10px 12px', borderBottom: '1px solid #e1eceb' }}>
                  {row.probability.toFixed(2)}%
                </td>
                <td style={{ textAlign: 'right', padding: '10px 12px', borderBottom: '1px solid #e1eceb' }}>
                  {(row.surfaceProbability ?? row.probability).toFixed(2)}%
                </td>
                <td style={{ textAlign: 'center', padding: '10px 12px', borderBottom: '1px solid #e1eceb' }}>
                  {row.showInTeasers ? 'On' : 'Off'}
                </td>
                <td style={{ textAlign: 'center', padding: '10px 12px', borderBottom: '1px solid #e1eceb' }}>
                  {row.marqueeEnabled !== false ? 'On' : 'Off'}
                </td>
                <td style={{ textAlign: 'center', padding: '10px 12px', borderBottom: '1px solid #e1eceb' }}>
                  {row.autoMarqueeEnabled ? 'On' : 'Off'}
                </td>
                <td style={{ textAlign: 'right', padding: '10px 12px', borderBottom: '1px solid #e1eceb' }}>
                  {row.autoMarqueeEnabled ? `${row.autoMarqueeIntervalMinutes ?? 0} min` : '-'}
                </td>
                <td style={{ textAlign: 'center', padding: '10px 12px', borderBottom: '1px solid #e1eceb' }}>
                  {row.isActive ? 'Yes' : 'No'}
                </td>
                <td style={{ textAlign: 'right', padding: '10px 0 10px 12px', borderBottom: '1px solid #e1eceb', whiteSpace: 'nowrap' }}>
                  <button type="button" className="button" onClick={() => startEdit(row)} style={{ marginRight: 8 }}>
                    Edit
                  </button>
                  <button type="button" className="button" onClick={() => remove(row._id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
