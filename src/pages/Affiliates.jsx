import { useEffect, useState } from 'react';
import { apiFetch, API_URL } from '../api/client.js';
import { usd, shortDate } from '../lib/format.js';

export default function Affiliates() {
  const [affiliatesList, setAffiliatesList] = useState(null);
  const [error, setError] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    apiFetch('/api/admin/affiliates')
      .then((dataMap) => setAffiliatesList(dataMap.affiliatesList))
      .catch((err) => setError(err.message));
  }, []);

  const copyLink = async (affiliate) => {
    await navigator.clipboard.writeText(`${API_URL}/r/${affiliate.referralCode}`);
    setCopiedId(affiliate.id);
    setTimeout(() => setCopiedId(null), 1500);
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
