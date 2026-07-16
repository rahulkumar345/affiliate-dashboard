import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '../api/client.js';
import { usd, shortDate, dateTime } from '../lib/format.js';
import StatusChip from '../components/StatusChip.jsx';
import Modal from '../components/Modal.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const TABS_LIST = ['all', 'pending', 'approved', 'processing', 'paid', 'rejected'];

export default function Commissions() {
  const { userMap } = useAuth();
  const canReview = userMap.role === 'admin';

  const [tab, setTab] = useState('pending');
  const [commissionsList, setCommissionsList] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [modalMap, setModalMap] = useState(null); // { action, commissionIds }
  const [note, setNote] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const query = tab === 'all' ? '' : `?status=${tab}`;
      const dataMap = await apiFetch(`/api/admin/commissions${query}`);
      setCommissionsList(dataMap.commissionsList);
      setSelectedIds([]);
    } catch (err) {
      setError(err.message);
    }
  }, [tab]);

  useEffect(() => {
    load();
  }, [load]);

  const pendingRowsList = (commissionsList || []).filter((c) => c.status === 'pending');
  const allPendingSelected = pendingRowsList.length > 0 && selectedIds.length === pendingRowsList.length;

  const toggleSelectAll = () => {
    setSelectedIds(allPendingSelected ? [] : pendingRowsList.map((c) => c.id));
  };

  const toggleSelect = (id) => {
    setSelectedIds((currentList) =>
      currentList.includes(id) ? currentList.filter((x) => x !== id) : [...currentList, id]
    );
  };

  const openAction = (action, commissionIds) => {
    setNote('');
    setModalMap({ action, commissionIds });
  };

  const confirmAction = async () => {
    setBusy(true);
    setError(null);
    try {
      const resultMap = await apiFetch('/api/admin/commissions/bulk', {
        method: 'POST',
        bodyMap: { commissionIds: modalMap.commissionIds, action: modalMap.action, note: note || null },
      });
      if (resultMap.skippedList.length > 0) {
        setError(`${resultMap.updatedCount} updated, ${resultMap.skippedList.length} skipped (already moved on)`);
      }
      setModalMap(null);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="page-title">Commissions</div>
      <div className="page-sub">
        Every referred order lands here as <b>pending</b>. Approve to make it payable — every change is audited.
      </div>

      <div className="tabs">
        {TABS_LIST.map((t) => (
          <button key={t} className={tab === t ? 'active' : ''} onClick={() => setTab(t)}>
            {t}
          </button>
        ))}
      </div>

      {canReview && selectedIds.length > 0 ? (
        <div className="bulk-bar">
          <span className="count">{selectedIds.length} selected</span>
          <button className="btn success small" onClick={() => openAction('approve', selectedIds)}>
            Approve
          </button>
          <button className="btn danger small" onClick={() => openAction('reject', selectedIds)}>
            Reject
          </button>
        </div>
      ) : null}

      {error ? <div className="error-text">{error}</div> : null}

      {!commissionsList ? (
        <div className="loading">Loading…</div>
      ) : commissionsList.length === 0 ? (
        <div className="table-card">
          <div className="empty">No {tab === 'all' ? '' : tab} commissions.</div>
        </div>
      ) : (
        <div className="table-card">
          <table>
            <thead>
              <tr>
                {canReview ? (
                  <th style={{ width: 30 }}>
                    {pendingRowsList.length > 0 ? (
                      <input type="checkbox" checked={allPendingSelected} onChange={toggleSelectAll} />
                    ) : null}
                  </th>
                ) : null}
                <th>Date</th>
                <th>Affiliate</th>
                <th>Order</th>
                <th className="num">Order value</th>
                <th className="num">Rate</th>
                <th className="num">Commission</th>
                <th>Status</th>
                <th style={{ width: 180 }}></th>
              </tr>
            </thead>
            <tbody>
              {commissionsList.map((c) => (
                <Row
                  key={c.id}
                  commission={c}
                  canReview={canReview}
                  selected={selectedIds.includes(c.id)}
                  onSelect={() => toggleSelect(c.id)}
                  expanded={expandedId === c.id}
                  onToggleExpand={() => setExpandedId(expandedId === c.id ? null : c.id)}
                  onAction={openAction}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalMap ? (
        <Modal
          title={`${modalMap.action === 'approve' ? 'Approve' : 'Reject'} ${modalMap.commissionIds.length} commission(s)`}
          subtitle={
            modalMap.action === 'approve'
              ? 'Approved commissions become payable and will appear in payout batches.'
              : 'Rejected commissions are final and will never be paid.'
          }
          onClose={() => setModalMap(null)}
        >
          <div className="field">
            <label>Note {modalMap.action === 'reject' ? '(recommended)' : '(optional)'}</label>
            <textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Verified with order system" />
          </div>
          <div className="actions">
            <button className="btn" onClick={() => setModalMap(null)} disabled={busy}>
              Cancel
            </button>
            <button
              className={`btn ${modalMap.action === 'approve' ? 'success' : 'danger'}`}
              onClick={confirmAction}
              disabled={busy}
            >
              {busy ? 'Working…' : modalMap.action === 'approve' ? 'Approve' : 'Reject'}
            </button>
          </div>
        </Modal>
      ) : null}
    </>
  );
}

function Row({ commission, canReview, selected, onSelect, expanded, onToggleExpand, onAction }) {
  const isPending = commission.status === 'pending';
  const columnCount = canReview ? 9 : 8;

  return (
    <>
      <tr>
        {canReview ? <td>{isPending ? <input type="checkbox" checked={selected} onChange={onSelect} /> : null}</td> : null}
        <td className="muted">{shortDate(commission.createdAt)}</td>
        <td className="strong">{commission.affiliateName}</td>
        <td className="mono">{commission.externalOrderId}</td>
        <td className="num">{usd(commission.orderAmountCents)}</td>
        <td className="num muted">{commission.ratePercent}%</td>
        <td className="num strong">{usd(commission.amountCents)}</td>
        <td>
          <StatusChip status={commission.status} />
        </td>
        <td style={{ textAlign: 'right' }}>
          {canReview && isPending ? (
            <>
              <button className="btn success small" onClick={() => onAction('approve', [commission.id])}>
                Approve
              </button>{' '}
              <button className="btn danger small" onClick={() => onAction('reject', [commission.id])}>
                Reject
              </button>{' '}
            </>
          ) : null}
          <button className="btn small" onClick={onToggleExpand}>
            {expanded ? 'Hide history' : 'History'}
          </button>
        </td>
      </tr>
      {expanded ? (
        <tr className="history-row">
          <td colSpan={columnCount}>
            <div className="timeline">
              {commission.statusHistoryList.map((entry, index) => (
                <div className="entry" key={index}>
                  <span className="when">{dateTime(entry.at)}</span>
                  <span>
                    {entry.from ? (
                      <>
                        <StatusChip status={entry.from} /> → <StatusChip status={entry.to} />
                      </>
                    ) : (
                      <StatusChip status={entry.to} />
                    )}
                  </span>
                  <span className="muted">by {entry.byName || 'system'}</span>
                  {entry.note ? <span className="note">“{entry.note}”</span> : null}
                </div>
              ))}
            </div>
          </td>
        </tr>
      ) : null}
    </>
  );
}
