import React, { useEffect, useState } from 'react';
import { admissionService } from '../services/services';
import toast from 'react-hot-toast';

const statusBadge = {
  'Seat Locked': 'badge-blue',
  'Documents Pending': 'badge-yellow',
  'Fee Pending': 'badge-orange',
  'Confirmed': 'badge-green',
  'Cancelled': 'badge-red',
};

export default function AdmissionsPage() {
  const [admissions, setAdmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [search, setSearch] = useState('');

  const fetch = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterStatus) params.status = filterStatus;
      const res = await admissionService.getAll(params);
      setAdmissions(res.data.data || []);
    } catch { toast.error('Failed to load admissions'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, [filterStatus]);

  const filtered = admissions.filter(a => {
    const name = `${a.applicant?.firstName || ''} ${a.applicant?.lastName || ''}`.toLowerCase();
    const num = (a.admissionNumber || '').toLowerCase();
    const s = search.toLowerCase();
    return name.includes(s) || num.includes(s);
  });

  return (
    <div>
      <div className="page-header">
        <div><h1>Admissions</h1><p>{admissions.length} total admission records</p></div>
      </div>

      <div className="filters-bar">
        <input className="form-control" placeholder="Search by name or admission number…" value={search} onChange={e => setSearch(e.target.value)} style={{ minWidth: 280 }} />
        <select className="form-control" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">All Statuses</option>
          {['Seat Locked','Documents Pending','Fee Pending','Confirmed','Cancelled'].map(s => <option key={s}>{s}</option>)}
        </select>
        <button className="btn btn-secondary" onClick={fetch}>↺ Refresh</button>
      </div>

      <div className="card">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Admission Number</th>
                <th>Student</th>
                <th>Program</th>
                <th>Quota</th>
                <th>Mode</th>
                <th>Fee Status</th>
                <th>Status</th>
                <th>Confirmed On</th>
              </tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan={8}><div className="loading">Loading…</div></td></tr>
                : filtered.length === 0 ? <tr><td colSpan={8}><div className="empty-state">No admissions found.</div></td></tr>
                : filtered.map(a => (
                  <tr key={a._id}>
                    <td>
                      {a.admissionNumber
                        ? <code style={{ background: '#f0fdf4', color: '#15803d', padding: '3px 8px', borderRadius: 6, fontSize: '0.8rem', fontWeight: 600 }}>{a.admissionNumber}</code>
                        : <span className="text-muted">—</span>}
                    </td>
                    <td>
                      <strong>{a.applicant?.firstName} {a.applicant?.lastName}</strong>
                      <br /><span className="text-muted text-sm">{a.applicant?.email}</span>
                    </td>
                    <td>{a.program?.name}<br /><span className="text-muted text-sm">{a.program?.code} · {a.program?.courseType}</span></td>
                    <td><span className="badge badge-blue">{a.quotaType}</span></td>
                    <td><span className="badge badge-purple">{a.admissionMode}</span></td>
                    <td><span className={`badge ${a.applicant?.feeStatus === 'Paid' ? 'badge-green' : 'badge-red'}`}>{a.applicant?.feeStatus}</span></td>
                    <td><span className={`badge ${statusBadge[a.status]}`}>{a.status}</span></td>
                    <td>{a.confirmedAt ? new Date(a.confirmedAt).toLocaleDateString() : '—'}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
