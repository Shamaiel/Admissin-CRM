import React, { useEffect, useState } from 'react';
import { dashboardService, academicYearService, institutionService } from '../services/services';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import toast from 'react-hot-toast';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [academicYears, setAcademicYears] = useState([]);
  const [institutions, setInstitutions] = useState([]);
  const [filters, setFilters] = useState({ academicYear: '', institution: '' });

  useEffect(() => {
    Promise.all([academicYearService.getAll(), institutionService.getAll()]).then(([ay, inst]) => {
      setAcademicYears(ay.data.data || []);
      setInstitutions(inst.data.data || []);
      const active = (ay.data.data || []).find(a => a.isActive);
      if (active) setFilters(p => ({ ...p, academicYear: active._id }));
    });
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [filters]);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.academicYear) params.academicYear = filters.academicYear;
      if (filters.institution) params.institution = filters.institution;
      const res = await dashboardService.getSummary(params);
      setData(res.data.data);
    } catch (err) {
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading dashboard…</div>;

  const stats = data?.overview || {};
  const seatMatrix = data?.seatMatrix || [];
  const appStats = data?.applicantStats || {};

  const barData = seatMatrix.map(p => ({
    name: p.code,
    Intake: p.totalIntake,
    Filled: p.totalFilled,
    Available: p.totalAvailable,
  }));

  const quotaData = [];
  seatMatrix.forEach(p => p.quotas.forEach(q => {
    const existing = quotaData.find(x => x.name === q.name);
    if (existing) { existing.filled += q.filled; existing.available += q.available; }
    else quotaData.push({ name: q.name, filled: q.filled, available: q.available });
  }));

  const statusCounts = [
    { name: 'Applied', value: appStats['Applied'] || 0 },
    { name: 'Seat Allocated', value: appStats['Seat Allocated'] || 0 },
    { name: 'Docs Verified', value: appStats['Documents Verified'] || 0 },
    { name: 'Fee Paid', value: appStats['Fee Paid'] || 0 },
    { name: 'Admitted', value: appStats['Admitted'] || 0 },
  ].filter(x => x.value > 0);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p>Real-time admission overview</p>
        </div>
        <div className="flex gap-2">
          <select className="form-control" value={filters.academicYear} onChange={e => setFilters(p => ({ ...p, academicYear: e.target.value }))}>
            <option value="">All Academic Years</option>
            {academicYears.map(ay => <option key={ay._id} value={ay._id}>{ay.label}</option>)}
          </select>
          <select className="form-control" value={filters.institution} onChange={e => setFilters(p => ({ ...p, institution: e.target.value }))}>
            <option value="">All Institutions</option>
            {institutions.map(i => <option key={i._id} value={i._id}>{i.name}</option>)}
          </select>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="stat-grid">
        <div className="stat-card">
          <div className="label">Total Intake</div>
          <div className="value">{stats.totalIntake || 0}</div>
          <div className="sub">Across all programs</div>
        </div>
        <div className="stat-card">
          <div className="label">Seats Filled</div>
          <div className="value" style={{ color: '#6366f1' }}>{stats.totalFilled || 0}</div>
          <div className="sub">{stats.totalIntake ? Math.round((stats.totalFilled / stats.totalIntake) * 100) : 0}% of total intake</div>
        </div>
        <div className="stat-card">
          <div className="label">Seats Available</div>
          <div className="value" style={{ color: '#10b981' }}>{stats.totalAvailable || 0}</div>
          <div className="sub">Remaining seats</div>
        </div>
        <div className="stat-card">
          <div className="label">Confirmed Admissions</div>
          <div className="value" style={{ color: '#8b5cf6' }}>{stats.confirmedAdmissions || 0}</div>
          <div className="sub">With admission number</div>
        </div>
        <div className="stat-card">
          <div className="label">Pending Documents</div>
          <div className="value" style={{ color: '#f59e0b' }}>{data?.pendingDocuments || 0}</div>
          <div className="sub">Need verification</div>
        </div>
        <div className="stat-card">
          <div className="label">Fee Pending</div>
          <div className="value" style={{ color: '#ef4444' }}>{data?.feePending || 0}</div>
          <div className="sub">Awaiting payment</div>
        </div>
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        <div className="card">
          <div className="card-header"><span className="card-title">Program-wise Seat Status</span></div>
          <div className="card-body" style={{ padding: '16px' }}>
            {barData.length === 0 ? <div className="empty-state">No data</div> : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Intake" fill="#e0e7ff" radius={[4,4,0,0]} />
                  <Bar dataKey="Filled" fill="#6366f1" radius={[4,4,0,0]} />
                  <Bar dataKey="Available" fill="#10b981" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">Applicant Pipeline</span></div>
          <div className="card-body" style={{ padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {statusCounts.length === 0 ? <div className="empty-state">No applicants yet</div> : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={statusCounts} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                    {statusCounts.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Seat Matrix Table */}
      <div className="card">
        <div className="card-header"><span className="card-title">Quota-wise Seat Matrix</span></div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Program</th>
                <th>Type</th>
                <th>Total Intake</th>
                {quotaData.map(q => <th key={q.name}>{q.name} (F/T)</th>)}
                <th>Total Filled</th>
                <th>Available</th>
                <th>Fill %</th>
              </tr>
            </thead>
            <tbody>
              {seatMatrix.length === 0 ? (
                <tr><td colSpan={8} className="empty-state">No programs configured</td></tr>
              ) : seatMatrix.map(p => (
                <tr key={p.programId}>
                  <td><strong>{p.name}</strong><br /><span className="text-muted text-sm">{p.code}</span></td>
                  <td><span className="badge badge-blue">{p.courseType}</span></td>
                  <td>{p.totalIntake}</td>
                  {quotaData.map(q => {
                    const pq = p.quotas.find(x => x.name === q.name);
                    return <td key={q.name}>{pq ? `${pq.filled}/${pq.seats}` : '—'}</td>;
                  })}
                  <td><strong>{p.totalFilled}</strong></td>
                  <td><span className={`badge ${p.totalAvailable === 0 ? 'badge-red' : 'badge-green'}`}>{p.totalAvailable}</span></td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div className="progress-bar-wrap" style={{ flex: 1 }}>
                        <div className={`progress-bar ${p.totalFilled / p.totalIntake > 0.9 ? 'danger' : ''}`} style={{ width: `${Math.min((p.totalFilled / p.totalIntake) * 100, 100)}%` }} />
                      </div>
                      <span style={{ fontSize: '0.75rem', whiteSpace: 'nowrap' }}>{p.totalIntake > 0 ? Math.round((p.totalFilled / p.totalIntake) * 100) : 0}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
