import { useEffect, useState } from 'react';
import { apiFetch, API_URL } from '../api/client.js';
import { usd, shortDate } from '../lib/format.js';
import { useAuth } from '../context/AuthContext.jsx';

// A commission rate is a percentage: blank (revert to default) or a number 0–100.
function rateErrorFor(value) {
  const trimmed = value.trim();
  if (trimmed === '') return null; // blank clears the override → program default
  const rate = Number(trimmed);
  if (Number.isNaN(rate)) return 'Enter a number';
  if (rate < 0) return "Rate can't be negative";
  if (rate > 100) return "Rate can't exceed 100%";
  return null;
}

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
  const [saveError, setSaveError] = useState(null); // server-side errors only; range is validated live

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
    setSaveError(null);
    setEditingId(a.id);
    setEditValue(a.commissionRatePercent == null ? '' : String(a.commissionRatePercent));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValue('');
    setSaveError(null);
  };

  const saveRate = async (a) => {
    // Range is enforced live, but re-check here so Enter can't submit an invalid value.
    if (rateErrorFor(editValue)) return;
    const trimmed = editValue.trim();
    // Blank input clears the override → affiliate reverts to the program default.
    const nextRate = trimmed === '' ? null : Number(trimmed);
    setSavingId(a.id);
    setSaveError(null);
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
      setSaveError(err.message);
    } finally {
      setSavingId(null);
    }
  };

  if (error) return <div className="error-text">{error}</div>;
  if (!affiliatesList) return <div className="loading">Loading…</div>;

  // Only one row edits at a time, so a single live-validation result covers it.
  const liveError = editingId ? rateErrorFor(editValue) : null;

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
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <input
                          className={`rate-input${liveError ? ' invalid' : ''}`}
                          type="text"
                          inputMode="decimal"
                          value={editValue}
                          placeholder={`${defaultRatePercent}`}
                          aria-invalid={Boolean(liveError)}
                          onChange={(e) => { setEditValue(e.target.value); setSaveError(null); }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveRate(a);
                            if (e.key === 'Escape') cancelEdit();
                          }}
                          autoFocus
                        />
                        <span className="muted">%</span>
                        <button
                          className="copy-btn"
                          disabled={savingId === a.id || Boolean(liveError)}
                          onClick={() => saveRate(a)}
                        >
                          {savingId === a.id ? '…' : 'save'}
                        </button>
                        <button className="copy-btn" onClick={cancelEdit}>cancel</button>
                      </div>
                      {liveError || saveError ? (
                        <div className="error-text" style={{ fontSize: 11, margin: '4px 0 0' }}>
                          {liveError || saveError}
                        </div>
                      ) : null}
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
