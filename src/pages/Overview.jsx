import { useEffect, useState } from 'react';
import { apiFetch, API_URL } from '../api/client.js';
import { usd, shortDate } from '../lib/format.js';
import MetricCard from '../components/MetricCard.jsx';
import StatusChip from '../components/StatusChip.jsx';

export default function Overview() {
  const [metricsMap, setMetricsMap] = useState(null);
  const [recentList, setRecentList] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([apiFetch('/api/admin/metrics'), apiFetch('/api/admin/commissions?limit=8')])
      .then(([metrics, commissions]) => {
        setMetricsMap(metrics);
        setRecentList(commissions.commissionsList);
      })
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <div className="error-text">{error}</div>;
  if (!metricsMap) return <div className="loading">Loading…</div>;

  const totalsMap = metricsMap.commissionTotalsMap;

  return (
    <>
      <div className="page-title">Overview</div>
      <div className="page-sub">Program health at a glance.</div>

      <div className="section-title">Growth</div>
      <div className="metric-grid">
        <MetricCard
          label="Affiliates"
          value={metricsMap.affiliatesTotal}
          hint={`+${metricsMap.affiliatesThisWeek} this week`}
          hintUp={metricsMap.affiliatesThisWeek > 0}
        />
        <MetricCard label="Link clicks" value={metricsMap.clicksTotal} />
        <MetricCard
          label="Conversions"
          value={metricsMap.conversionsTotal}
          hint={`${metricsMap.conversionRatePercent}% click → order`}
        />
      </div>

      <div className="section-title">Money</div>
      <div className="metric-grid">
        <MetricCard
          label="Pending review"
          value={usd(totalsMap.pending.totalCents)}
          hint={`${totalsMap.pending.count} commissions`}
        />
        <MetricCard
          label="Approved (owed)"
          value={usd(totalsMap.approved.totalCents)}
          hint={`${totalsMap.approved.count} commissions awaiting payout`}
        />
        <MetricCard
          label="In payout batches"
          value={usd(totalsMap.processing.totalCents)}
          hint={`${metricsMap.payoutsPendingCount} batch(es) awaiting payment`}
        />
        <MetricCard label="Paid out" value={usd(totalsMap.paid.totalCents)} hint={`${totalsMap.paid.count} commissions`} />
      </div>

      <div className="section-title">Latest commissions</div>
      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Affiliate</th>
              <th>Order</th>
              <th className="num">Commission</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {recentList.map((c) => (
              <tr key={c.id}>
                <td className="muted">{shortDate(c.createdAt)}</td>
                <td className="strong">{c.affiliateName}</td>
                <td className="mono">{c.externalOrderId}</td>
                <td className="num strong">{usd(c.amountCents)}</td>
                <td>
                  <StatusChip status={c.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="section-title">Try the loop yourself</div>
      <div className="card" style={{ fontSize: 13 }}>
        Open the demo storefront via any affiliate's share link (Affiliates page → link icon), buy something, and
        watch it appear under Commissions as <b>pending</b>. The store checkout calls the same conversion webhook a
        real merchant would: <code className="mono">{API_URL}/api/webhooks/conversion</code>
      </div>
    </>
  );
}
