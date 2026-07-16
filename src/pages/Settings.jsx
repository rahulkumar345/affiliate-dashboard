import { useEffect, useState } from 'react';
import { apiFetch } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function Settings() {
  const { userMap } = useAuth();
  const canEdit = userMap.role === 'admin';

  const [ratePercent, setRatePercent] = useState('');
  const [minPayoutUsd, setMinPayoutUsd] = useState('');
  const [statusMessage, setStatusMessage] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    apiFetch('/api/admin/config')
      .then((configMap) => {
        setRatePercent(String(configMap.commissionRatePercent));
        setMinPayoutUsd(String(configMap.minPayoutCents / 100));
      })
      .catch((err) => setError(err.message));
  }, []);

  const save = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setStatusMessage(null);
    try {
      await apiFetch('/api/admin/config', {
        method: 'PUT',
        bodyMap: {
          commissionRatePercent: Number(ratePercent),
          minPayoutCents: Math.round(Number(minPayoutUsd) * 100),
        },
      });
      setStatusMessage('Saved. New conversions will use the updated rate.');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="page-title">Program settings</div>
      <div className="page-sub">
        Applied to <b>new</b> conversions only — already-recorded commissions keep the rate they were earned at.
      </div>

      <form className="card" style={{ maxWidth: 420 }} onSubmit={save}>
        <div className="field">
          <label>Commission rate (% of order value)</label>
          <input
            type="number"
            min="0"
            max="100"
            step="0.5"
            value={ratePercent}
            onChange={(e) => setRatePercent(e.target.value)}
            disabled={!canEdit}
            required
          />
        </div>
        <div className="field">
          <label>Minimum payout (USD)</label>
          <input
            type="number"
            min="0"
            step="1"
            value={minPayoutUsd}
            onChange={(e) => setMinPayoutUsd(e.target.value)}
            disabled={!canEdit}
            required
          />
        </div>
        {error ? <div className="error-text">{error}</div> : null}
        {statusMessage ? <div style={{ color: 'var(--green)', fontSize: 13, marginBottom: 10 }}>{statusMessage}</div> : null}
        {canEdit ? (
          <button className="btn primary" disabled={busy}>
            {busy ? 'Saving…' : 'Save settings'}
          </button>
        ) : (
          <div className="muted" style={{ fontSize: 13 }}>Read-only for the finance role.</div>
        )}
      </form>
    </>
  );
}
