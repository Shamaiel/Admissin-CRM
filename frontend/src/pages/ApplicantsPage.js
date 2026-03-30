import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { applicantService, programService, institutionService, academicYearService } from '../services/services';
import Modal from '../components/common/Modal';
import toast from 'react-hot-toast';

const CATEGORIES = ['GM', 'SC', 'ST', 'OBC', 'EWS', 'Other'];
const QUOTAS = ['KCET', 'COMEDK', 'Management', 'JK', 'NRI'];

const emptyForm = () => ({
  firstName: '', lastName: '', email: '', phone: '', dateOfBirth: '',
  gender: 'Male', category: 'GM', address: '', state: '',
  qualifyingExam: 'PUC / 12th', qualifyingMarks: '', qualifyingBoard: '', rankOrScore: '',
  entryType: 'Regular', quotaType: 'KCET', allotmentNumber: '',
  program: '', institution: '', academicYear: '',
});

const statusBadge = {
  'Applied':             'badge-blue',
  'Seat Allocated':      'badge-purple',
  'Documents Verified':  'badge-yellow',
  'Fee Paid':            'badge-orange',
  'Admitted':            'badge-green',
  'Cancelled':           'badge-red',
};

export default function ApplicantsPage() {
  const [applicants, setApplicants] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [institutions, setInstitutions] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const navigate = useNavigate();


  const fetch = async () => {
    setLoading(true);
    try {
      const [a, p, i, ay] = await Promise.all([
        applicantService.getAll(filterStatus ? { status: filterStatus } : {}),
        programService.getAll(), institutionService.getAll(), academicYearService.getAll()
      ]);
      console.log("TTTTTT------", i)
      setApplicants(a.data.data || []);
      setPrograms(p.data.data || []);
      setInstitutions(i.data.data || []);
      setAcademicYears(ay.data.data || []);
    } catch { toast.error('Failed to load applicants'); }
    finally { setLoading(false); }
  };


  useEffect(() => { fetch(); }, [filterStatus]);

  const handleCreate = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const res = await applicantService.create(form);
      toast.success('Applicant created!');
      setModal(false);
      navigate(`/applicants/${res.data.data._id}`);
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };

  const filtered = applicants.filter(a => {
    const name = `${a.firstName} ${a.lastName}`.toLowerCase();
    return name.includes(search.toLowerCase()) || a.email.toLowerCase().includes(search.toLowerCase()) || a.phone.includes(search);
  });

  return (
    <div>
      <div className="page-header">
        <div><h1>Applicants</h1><p>{applicants.length} total applicants</p></div>
        <button className="btn btn-primary" onClick={() => { setForm(emptyForm()); setModal(true); }}>+ New Applicant</button>
      </div>

      <div className="filters-bar">
        <input className="form-control" placeholder="Search by name, email, phone…" value={search} onChange={e => setSearch(e.target.value)} style={{ minWidth: 260 }} />
        <select className="form-control" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">All Statuses</option>
          {['Applied','Seat Allocated','Documents Verified','Fee Paid','Admitted','Cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <button className="btn btn-secondary" onClick={fetch}>↺ Refresh</button>
      </div>

      <div className="card">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Applicant</th><th>Contact</th><th>Category</th><th>Quota</th>
                <th>Program</th><th>Status</th><th>Fee</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan={8}><div className="loading">Loading…</div></td></tr>
                : filtered.length === 0 ? <tr><td colSpan={8}><div className="empty-state">No applicants found.</div></td></tr>
                : filtered.map(a => (
                  <tr key={a._id}>
                    <td>
                      <strong>{a.firstName} {a.lastName}</strong>
                      <br /><span className="text-muted text-sm">{new Date(a.createdAt).toLocaleDateString()}</span>
                    </td>
                    <td>{a.email}<br /><span className="text-muted text-sm">{a.phone}</span></td>
                    <td><span className="badge badge-gray">{a.category}</span></td>
                    <td><span className="badge badge-blue">{a.quotaType}</span></td>
                    <td>{a.program?.name ? <><strong>{a.program.code}</strong><br /><span className="text-sm text-muted">{a.program.courseType}</span></> : '—'}</td>
                    <td><span className={`badge ${statusBadge[a.status] || 'badge-gray'}`}>{a.status}</span></td>
                    <td><span className={`badge ${a.feeStatus === 'Paid' ? 'badge-green' : 'badge-red'}`}>{a.feeStatus}</span></td>
                    <td><button className="btn btn-outline btn-sm" onClick={() => navigate(`/applicants/${a._id}`)}>View</button></td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Applicant Modal */}
      <Modal open={modal} onClose={() => setModal(false)} title="New Applicant" size="lg">
        <form onSubmit={handleCreate}>
          <div className="modal-body">
            <div className="form-section-title">Personal Information</div>
            <div className="form-grid">
              <div className="form-group"><label>First Name *</label><input className="form-control" required value={form.firstName} onChange={e => setForm(p => ({ ...p, firstName: e.target.value }))} /></div>
              <div className="form-group"><label>Last Name *</label><input className="form-control" required value={form.lastName} onChange={e => setForm(p => ({ ...p, lastName: e.target.value }))} /></div>
              <div className="form-group"><label>Email *</label><input className="form-control" type="email" required value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} /></div>
              <div className="form-group"><label>Phone *</label><input className="form-control" required value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} /></div>
              <div className="form-group"><label>Date of Birth *</label><input className="form-control" type="date" required value={form.dateOfBirth} onChange={e => setForm(p => ({ ...p, dateOfBirth: e.target.value }))} /></div>
              <div className="form-group"><label>Gender *</label><select className="form-control" value={form.gender} onChange={e => setForm(p => ({ ...p, gender: e.target.value }))}><option>Male</option><option>Female</option><option>Other</option></select></div>
              <div className="form-group"><label>Category *</label><select className="form-control" value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>{CATEGORIES.map(c => <option key={c}>{c}</option>)}</select></div>
              <div className="form-group"><label>State *</label><input className="form-control" required value={form.state} onChange={e => setForm(p => ({ ...p, state: e.target.value }))} /></div>
              <div className="form-group" style={{ gridColumn: '1/-1' }}><label>Address *</label><textarea className="form-control" required rows={2} value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} /></div>
            </div>

            <div className="divider" />
            <div className="form-section-title">Academic Details</div>
            <div className="form-grid">
              <div className="form-group"><label>Qualifying Exam *</label><input className="form-control" required value={form.qualifyingExam} onChange={e => setForm(p => ({ ...p, qualifyingExam: e.target.value }))} placeholder="PUC / 12th / Diploma" /></div>
              <div className="form-group"><label>Marks % *</label><input className="form-control" type="number" min={0} max={100} step={0.01} required value={form.qualifyingMarks} onChange={e => setForm(p => ({ ...p, qualifyingMarks: e.target.value }))} /></div>
              <div className="form-group"><label>Board / University</label><input className="form-control" value={form.qualifyingBoard} onChange={e => setForm(p => ({ ...p, qualifyingBoard: e.target.value }))} /></div>
              <div className="form-group"><label>Rank / Score</label><input className="form-control" type="number" value={form.rankOrScore} onChange={e => setForm(p => ({ ...p, rankOrScore: e.target.value }))} /></div>
            </div>

            <div className="divider" />
            <div className="form-section-title">Admission Details</div>
            <div className="form-grid">
              <div className="form-group"><label>Entry Type *</label><select className="form-control" value={form.entryType} onChange={e => setForm(p => ({ ...p, entryType: e.target.value }))}><option>Regular</option><option>Lateral</option></select></div>
              <div className="form-group"><label>Quota Type *</label><select className="form-control" value={form.quotaType} onChange={e => setForm(p => ({ ...p, quotaType: e.target.value }))}>{QUOTAS.map(q => <option key={q}>{q}</option>)}</select></div>
              <div className="form-group"><label>Allotment Number</label><input className="form-control" value={form.allotmentNumber} onChange={e => setForm(p => ({ ...p, allotmentNumber: e.target.value }))} placeholder="For KCET/COMEDK" /></div>
              <div className="form-group"><label>Institution *</label><select className="form-control" required value={form.institution} onChange={e => setForm(p => ({ ...p, institution: e.target.value }))}><option value="">Select</option>{institutions.map(i => <option key={i._id} value={i._id}>{i.name}</option>)}</select></div>
              <div className="form-group"><label>Academic Year *</label><select className="form-control" required value={form.academicYear} onChange={e => setForm(p => ({ ...p, academicYear: e.target.value }))}><option value="">Select</option>{academicYears.map(a => <option key={a._id} value={a._id}>{a.label}</option>)}</select></div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => setModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Creating…' : 'Create Applicant'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
