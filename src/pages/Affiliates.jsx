import { useEffect, useState } from 'react';
import { apiFetch, API_URL } from '../api/client.js';
import { usd, shortDate } from '../lib/format.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function Affiliates() {
  const { userMap } = useAuth();
  const canEdit = userMap.role === 'admin';

  const [affiliatesList, setAffiliatesList] = useState(null);
  const [defaultRatePercent, setDefaultRatePercent] = useState(null);
  const [error, setError] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  // Inline rate-editing state (one row at a time)
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [savingId, setSavingId] = useState(null);
  const [rateError, setRateError] = useState(null);

  useEffect(() => {
    apiFetch('/api/admin/affiliates')
      .then((dataMap) => {
        setAffiliatesList(dataMap.affiliatesList);
        setDefaultRatePercent(dataMap.defaultRatePercent);
      })
      .catch((err) => setError(err.message));
  }, []);

  const copyLink = async (affiliate) => {
    await navigator.clipboard.writeText(`${API_URL}/r/${affiliate.referralCode}`);
    setCopiedId(affiliate.id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const startEdit = (a) => {
    setRateError(null);
    setEditingId(a.id);
    setEditValue(a.commissionRatePercent == null ? '' : String(a.commissionRatePercent));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValue('');
    setRateError(null);
  };

  const saveRate = async (a) => {
    setRateError(null);
    const trimmed = editValue.trim();
    // Blank input clears the override → affiliate reverts to the program default.
    const nextRate = trimmed === '' ? null : Number(trimmed);
    if (nextRate !== null && (Number.isNaN(nextRate) || nextRate < 0 || nextRate > 100)) {
      setRateError('0–100, or blank for default');
      return;
    }
    setSavingId(a.id);
    try {
      await apiFetch(`/api/admin/affiliates/${a.id}/rate`, {
        method: 'PATCH',
        bodyMap: { commissionRatePercent: nextRate },
      });
      setAffiliatesList((list) =>
        list.map((x) => (x.id === a.id ? { ...x, commissionRatePercent: nextRate } : x))
      );
      cancelEdit();
    } catch (err) {
      setRateError(err.message);
    } finally {
      setSavingId(null);
    }
  };

  if (error) return <div className="error-text">{error}</div>;
  if (!affiliatesList) return <div className="loading">Loading…</div>;

  return (
    <>
      <div className="page-title">Affiliates</div>
      <div className="page-sub">Everyone in the program — signup is instant and self-serve from the mobile app.</div>

      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>Affiliate</th>
              <th>Code</th>
              <th>Share link</th>
              <th>Joined</th>
              <th className="num">Clicks</th>
              <th className="num">Conversions</th>
              <th>Rate</th>
              <th className="num">Pending</th>
              <th className="num">Approved</th>
              <th className="num">Paid</th>
              <th>Payout method</th>
            </tr>
          </thead>
          <tbody>
            {affiliatesList.map((a) => (
              <tr key={a.id}>
                <td>
                  <span className="strong">{a.name}</span>
                  <div className="muted" style={{ fontSize: 12 }}>{a.email}</div>
                </td>
                <td className="mono">{a.referralCode}</td>
                <td>
                  <a className="plain" href={`${API_URL}/r/${a.referralCode}`} target="_blank" rel="noreferrer">
                    open
                  </a>
                  <button className="copy-btn" onClick={() => copyLink(a)}>
                    {copiedId === a.id ? 'copied ✓' : 'copy'}
                  </button>
                </td>
                <td className="muted">{shortDate(a.createdAt)}</td>
                <td className="num">{a.clicksCount}</td>
                <td className="num">{a.conversionsCount}</td>
                <td>
                  {editingId === a.id ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.5"
                        value={editValue}
                        placeholder={`${defaultRatePercent}`}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveRate(a);
                          if (e.key === 'Escape') cancelEdit();
                        }}
                        style={{ width: 64, padding: '4px 6px' }}
                        autoFocus
                      />
                      <button className="copy-btn" disabled={savingId === a.id} onClick={() => saveRate(a)}>
                        {savingId === a.id ? '…' : 'save'}
                      </button>
                      <button className="copy-btn" onClick={cancelEdit}>cancel</button>
                      {rateError ? <span className="error-text" style={{ fontSize: 11 }}>{rateError}</span> : null}
                    </div>
                  ) : (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      {a.commissionRatePercent == null ? (
                        <span className="muted">
                          {defaultRatePercent}% <span style={{ fontSize: 11 }}>default</span>
                        </span>
                      ) : (
                        <span className="strong">{a.commissionRatePercent}%</span>
                      )}
                      {canEdit ? (
                        <button className="copy-btn" onClick={() => startEdit(a)}>edit</button>
                      ) : null}
                    </span>
                  )}
                </td>
                <td className="num">{usd(a.pendingCents)}</td>
                <td className="num">{usd(a.approvedCents)}</td>
                <td className="num">{usd(a.paidCents)}</td>
                <td>{a.payoutMethodSet ? <span className="badge-ok">on file</span> : <span className="badge-warn">not set</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
