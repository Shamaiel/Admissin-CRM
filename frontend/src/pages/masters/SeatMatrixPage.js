import React, { useEffect, useState } from 'react';
import { seatMatrixService, academicYearService, institutionService } from '../../services/services';
import toast from 'react-hot-toast';

export default function SeatMatrixPage() {
  const [matrix, setMatrix] = useState([]);
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

  useEffect(() => { fetchMatrix(); }, [filters]);

  const fetchMatrix = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.academicYear) params.academicYear = filters.academicYear;
      if (filters.institution) params.institution = filters.institution;
      const res = await seatMatrixService.getAll(params);
      setMatrix(res.data.data || []);
    } catch { toast.error('Failed to load seat matrix'); }
    finally { setLoading(false); }
  };

  const allQuotaNames = [...new Set(matrix.flatMap(p => p.quotas.map(q => q.name)))];

  return (
    <div>
      <div className="page-header">
        <div><h1>Seat Matrix</h1><p>Real-time seat availability across all programs</p></div>
        <div className="flex gap-2">
          <select className="form-control" value={filters.academicYear} onChange={e => setFilters(p => ({ ...p, academicYear: e.target.value }))}>
            <option value="">All Years</option>
            {academicYears.map(ay => <option key={ay._id} value={ay._id}>{ay.label}</option>)}
          </select>
          <select className="form-control" value={filters.institution} onChange={e => setFilters(p => ({ ...p, institution: e.target.value }))}>
            <option value="">All Institutions</option>
            {institutions.map(i => <option key={i._id} value={i._id}>{i.name}</option>)}
          </select>
          <button className="btn btn-secondary" onClick={fetchMatrix}>↺ Refresh</button>
        </div>
      </div>

      <div className="card">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Program</th>
                <th>Type</th>
                <th>Total Intake</th>
                {allQuotaNames.map(q => <th key={q}>{q}</th>)}
                <th>Total Filled</th>
                <th>Available</th>
                <th>Fill %</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7 + allQuotaNames.length}><div className="loading">Loading…</div></td></tr>
              ) : matrix.length === 0 ? (
                <tr><td colSpan={7 + allQuotaNames.length}><div className="empty-state">No programs found.</div></td></tr>
              ) : matrix.map(p => {
                const fillPct = p.totalIntake > 0 ? Math.round((p.totalFilled / p.totalIntake) * 100) : 0;
                return (
                  <tr key={p._id}>
                    <td>
                      <strong>{p.name}</strong>
                      <br /><span className="text-muted text-sm">{p.code} · {p.department?.name}</span>
                    </td>
                    <td><span className="badge badge-blue">{p.courseType}</span></td>
                    <td><strong>{p.totalIntake}</strong></td>
                    {allQuotaNames.map(qName => {
                      const q = p.quotas.find(x => x.name === qName);
                      if (!q) return <td key={qName}>—</td>;
                      const isFull = q.available === 0;
                      return (
                        <td key={qName}>
                          <div style={{ lineHeight: 1.8 }}>
                            <span style={{ fontWeight: 600 }}>{q.filled}/{q.seats}</span>
                            <br />
                            <span className={`badge ${isFull ? 'badge-red' : 'badge-green'}`} style={{ fontSize: '0.68rem' }}>
                              {isFull ? 'FULL' : `${q.available} left`}
                            </span>
                          </div>
                        </td>
                      );
                    })}
                    <td><strong>{p.totalFilled}</strong></td>
                    <td><span className={`badge ${p.totalAvailable === 0 ? 'badge-red' : p.totalAvailable <= 5 ? 'badge-yellow' : 'badge-green'}`}>{p.totalAvailable}</span></td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div className="progress-bar-wrap" style={{ flex: 1 }}>
                          <div className={`progress-bar ${fillPct >= 100 ? 'danger' : fillPct >= 80 ? '' : 'success'}`} style={{ width: `${Math.min(fillPct, 100)}%` }} />
                        </div>
                        <span style={{ fontSize: '0.75rem', minWidth: 32 }}>{fillPct}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
