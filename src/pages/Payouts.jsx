import { useCallback, useEffect, useState } from 'react';
import { apiFetch, downloadCsv } from '../api/client.js';
import { usd, shortDate } from '../lib/format.js';
import StatusChip from '../components/StatusChip.jsx';
import Modal from '../components/Modal.jsx';

function methodLabel(methodMap) {
  if (!methodMap) return <span className="badge-warn">not set</span>;
  if (methodMap.method === 'upi') return `UPI · ${methodMap.upiId}`;
  if (methodMap.method === 'bank') return `Bank · ${methodMap.accountNumber}`;
  if (methodMap.method === 'paypal') return `PayPal · ${methodMap.paypalEmail}`;
  return '—';
}

export default function Payouts() {
  const [eligibleList, setEligibleList] = useState(null);
  const [payoutsList, setPayoutsList] = useState(null);
  const [markPaidMap, setMarkPaidMap] = useState(null); // payout being confirmed
  const [paymentNote, setPaymentNote] = useState('');
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [eligible, payouts] = await Promise.all([
        apiFetch('/api/admin/payouts/eligible'),
        apiFetch('/api/admin/payouts'),
      ]);
      setEligibleList(eligible.eligibleList);
      setPayoutsList(payouts.payoutsList);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const createBatch = async (affiliateId) => {
    setBusyId(affiliateId);
    setError(null);
    try {
      await apiFetch('/api/admin/payouts', { method: 'POST', bodyMap: { affiliateId } });
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const confirmMarkPaid = async () => {
    setBusyId(markPaidMap.id);
    setError(null);
    try {
      await apiFetch(`/api/admin/payouts/${markPaidMap.id}/mark-paid`, {
        method: 'PATCH',
        bodyMap: { paymentNote: paymentNote || null },
      });
      setMarkPaidMap(null);
      setPaymentNote('');
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const exportCsv = (status) => {
    downloadCsv(`/api/admin/payouts/export.csv?status=${status}`, `payouts-${status}.csv`).catch((err) =>
      setError(err.message)
    );
  };

  return (
    <>
      <div className="page-title">Payouts</div>
      <div className="page-sub">
        Batch approved commissions per affiliate, export the payment run, pay it, then mark it paid.
      </div>

      {error ? <div className="error-text">{error}</div> : null}

      <div className="section-title">Ready to pay</div>
      {!eligibleList ? (
        <div className="loading">Loading…</div>
      ) : eligibleList.length === 0 ? (
        <div className="table-card">
          <div className="empty">No affiliates have approved commissions right now.</div>
        </div>
      ) : (
        <div className="table-card">
          <table>
            <thead>
              <tr>
                <th>Affiliate</th>
                <th>Payment method</th>
                <th className="num">Approved balance</th>
                <th className="num">Commissions</th>
                <th style={{ width: 150 }}></th>
              </tr>
            </thead>
            <tbody>
              {eligibleList.map((row) => (
                <tr key={row.affiliateId}>
                  <td>
                    <span className="strong">{row.affiliateName}</span>
                    <div className="muted" style={{ fontSize: 12 }}>{row.affiliateEmail}</div>
                  </td>
                  <td>{row.hasPayoutMethod ? <span className="badge-ok">on file</span> : <span className="badge-warn">not set</span>}</td>
                  <td className="num strong">{usd(row.totalAmountCents)}</td>
                  <td className="num">{row.commissionCount}</td>
                  <td style={{ textAlign: 'right' }}>
                    {row.meetsMinimum ? (
                      <button
                        className="btn primary small"
                        disabled={busyId === row.affiliateId}
                        onClick={() => createBatch(row.affiliateId)}
                      >
                        {busyId === row.affiliateId ? 'Creating…' : 'Create batch'}
                      </button>
                    ) : (
                      <span className="muted" style={{ fontSize: 12 }}>
                        below {usd(row.minPayoutCents)} minimum
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="toolbar" style={{ marginTop: 26 }}>
        <div className="section-title" style={{ margin: 0 }}>Payout batches</div>
        <div className="spacer" />
        <button className="btn small" onClick={() => exportCsv('pending')}>
          Export pending (CSV)
        </button>
        <button className="btn small" onClick={() => exportCsv('all')}>
          Export all (CSV)
        </button>
      </div>

      {!payoutsList ? (
        <div className="loading">Loading…</div>
      ) : payoutsList.length === 0 ? (
        <div className="table-card">
          <div className="empty">No payout batches yet — create one above.</div>
        </div>
      ) : (
        <div className="table-card">
          <table>
            <thead>
              <tr>
                <th>Reference</th>
                <th>Affiliate</th>
                <th>Payment method</th>
                <th className="num">Amount</th>
                <th className="num">Commissions</th>
                <th>Status</th>
                <th>Created</th>
                <th>Paid</th>
                <th style={{ width: 120 }}></th>
              </tr>
            </thead>
            <tbody>
              {payoutsList.map((p) => (
                <tr key={p.id}>
                  <td className="mono">{p.reference}</td>
                  <td className="strong">{p.affiliateName}</td>
                  <td>{methodLabel(p.payoutMethodMap)}</td>
                  <td className="num strong">{usd(p.totalAmountCents)}</td>
                  <td className="num">{p.commissionCount}</td>
                  <td>
                    <StatusChip status={p.status} />
                  </td>
                  <td className="muted">{shortDate(p.createdAt)}</td>
                  <td className="muted">{p.paidAt ? shortDate(p.paidAt) : '—'}</td>
                  <td style={{ textAlign: 'right' }}>
                    {p.status === 'pending' ? (
                      <button className="btn success small" onClick={() => setMarkPaidMap(p)}>
                        Mark paid
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {markPaidMap ? (
        <Modal
          title={`Mark ${markPaidMap.reference} as paid`}
          subtitle={`${usd(markPaidMap.totalAmountCents)} to ${markPaidMap.affiliateName}. This finalizes ${markPaidMap.commissionCount} commission(s) as paid — it can't be undone.`}
          onClose={() => setMarkPaidMap(null)}
        >
          <div className="field">
            <label>Payment reference (optional)</label>
            <input
              value={paymentNote}
              onChange={(e) => setPaymentNote(e.target.value)}
              placeholder="e.g. UTR / transaction id"
            />
          </div>
          <div className="actions">
            <button className="btn" onClick={() => setMarkPaidMap(null)} disabled={busyId === markPaidMap.id}>
              Cancel
            </button>
            <button className="btn success" onClick={confirmMarkPaid} disabled={busyId === markPaidMap.id}>
              {busyId === markPaidMap.id ? 'Working…' : 'Mark as paid'}
            </button>
          </div>
        </Modal>
      ) : null}
    </>
  );
}
