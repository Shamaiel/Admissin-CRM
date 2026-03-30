import React, { useEffect, useState } from 'react';
import { programService, departmentService, campusService, institutionService, academicYearService } from '../../services/services';
import Modal from '../../components/common/Modal';
import toast from 'react-hot-toast';

const QUOTA_TYPES = ['KCET', 'COMEDK', 'Management', 'JK', 'NRI'];

const emptyQuota = () => QUOTA_TYPES.slice(0, 3).map(name => ({ name, seats: 0 }));
const emptyForm = () => ({ name: '', code: '', department: '', campus: '', institution: '', academicYear: '', courseType: 'UG', entryType: 'Regular', admissionMode: 'Government', totalIntake: 60, quotas: emptyQuota(), supernumerarySeats: 0 });

export default function ProgramsPage() {
  const [items, setItems] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [campuses, setCampuses] = useState([]);
  const [institutions, setInstitutions] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const quotaTotal = form.quotas.reduce((s, q) => s + Number(q.seats), 0);
  const quotaMismatch = form.quotas.length > 0 && quotaTotal !== Number(form.totalIntake);

  const fetch = async () => {
    setLoading(true);
    try {
      const [p, d, c, i, ay] = await Promise.all([programService.getAll(), departmentService.getAll(), campusService.getAll(), institutionService.getAll(), academicYearService.getAll()]);
      setItems(p.data.data || []); setDepartments(d.data.data || []); setCampuses(c.data.data || []);
      setInstitutions(i.data.data || []); setAcademicYears(ay.data.data || []);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetch(); }, []);

  const openCreate = () => { setForm(emptyForm()); setEditing(null); setModal(true); };
  const openEdit = (item) => {
    setForm({
      ...item,
      department: item.department?._id || item.department,
      campus: item.campus?._id || item.campus,
      institution: item.institution?._id || item.institution,
      academicYear: item.academicYear?._id || item.academicYear,
      quotas: item.quotas || emptyQuota(),
    });
    setEditing(item._id); setModal(true);
  };

  const updateQuota = (idx, field, val) => {
    setForm(p => { const q = [...p.quotas]; q[idx] = { ...q[idx], [field]: field === 'seats' ? Number(val) : val }; return { ...p, quotas: q }; });
  };
  const addQuota = () => setForm(p => ({ ...p, quotas: [...p.quotas, { name: 'Management', seats: 0 }] }));
  const removeQuota = (idx) => setForm(p => ({ ...p, quotas: p.quotas.filter((_, i) => i !== idx) }));

  const handleSave = async (e) => {
    e.preventDefault();
    if (quotaMismatch) { toast.error(`Quota total (${quotaTotal}) must equal Total Intake (${form.totalIntake})`); return; }
    setSaving(true);
    try {
      if (editing) { await programService.update(editing, form); toast.success('Updated!'); }
      else { await programService.create(form); toast.success('Program created!'); }
      setModal(false); fetch();
    } catch (err) { toast.error(err.response?.data?.message || 'Error saving program'); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <div className="page-header">
        <div><h1>Programs</h1><p>Manage programs and quota configuration</p></div>
        <button className="btn btn-primary" onClick={openCreate}>+ Add Program</button>
      </div>

      <div className="card">
        <div className="table-wrapper">
          <table>
            <thead><tr><th>Program</th><th>Type</th><th>Department</th><th>Intake</th><th>Quotas</th><th>Filled</th><th>Available</th><th>Actions</th></tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={8}><div className="loading">Loading…</div></td></tr>
                : items.length === 0 ? <tr><td colSpan={8}><div className="empty-state">No programs yet. Create programs to enable admissions.</div></td></tr>
                : items.map(item => {
                  const filled = item.quotas?.reduce((s, q) => s + q.filled, 0) || 0;
                  const available = item.totalIntake - filled;
                  return (
                    <tr key={item._id}>
                      <td><strong>{item.name}</strong><br /><span className="text-muted text-sm">{item.code}</span></td>
                      <td><span className="badge badge-blue">{item.courseType}</span> <span className="badge badge-gray">{item.entryType}</span></td>
                      <td>{item.department?.name || '—'}</td>
                      <td>{item.totalIntake}</td>
                      <td>{item.quotas?.map(q => <div key={q.name} style={{ fontSize: '0.75rem' }}>{q.name}: {q.seats}</div>)}</td>
                      <td>{filled}</td>
                      <td><span className={`badge ${available === 0 ? 'badge-red' : 'badge-green'}`}>{available}</span></td>
                      <td><button className="btn btn-secondary btn-sm" onClick={() => openEdit(item)}>Edit</button></td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit Program' : 'Add Program'} size="lg">
        <form onSubmit={handleSave}>
          <div className="modal-body">
            <div className="form-section-title">Program Details</div>
            <div className="form-grid">
              <div className="form-group" style={{ gridColumn: '1/-1' }}><label>Program Name *</label><input className="form-control" required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="B.E. Computer Science & Engineering" /></div>
              <div className="form-group"><label>Program Code *</label><input className="form-control" required value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value.toUpperCase() }))} placeholder="CSE" /></div>
              <div className="form-group"><label>Course Type *</label><select className="form-control" value={form.courseType} onChange={e => setForm(p => ({ ...p, courseType: e.target.value }))}><option value="UG">UG</option><option value="PG">PG</option></select></div>
              <div className="form-group"><label>Entry Type *</label><select className="form-control" value={form.entryType} onChange={e => setForm(p => ({ ...p, entryType: e.target.value }))}><option value="Regular">Regular</option><option value="Lateral">Lateral</option></select></div>
              <div className="form-group"><label>Admission Mode *</label><select className="form-control" value={form.admissionMode} onChange={e => setForm(p => ({ ...p, admissionMode: e.target.value }))}><option value="Government">Government</option><option value="Management">Management</option></select></div>
              <div className="form-group"><label>Institution *</label><select className="form-control" required value={form.institution} onChange={e => setForm(p => ({ ...p, institution: e.target.value }))}><option value="">Select</option>{institutions.map(i => <option key={i._id} value={i._id}>{i.name}</option>)}</select></div>
              <div className="form-group"><label>Campus *</label><select className="form-control" required value={form.campus} onChange={e => setForm(p => ({ ...p, campus: e.target.value }))}><option value="">Select</option>{campuses.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}</select></div>
              <div className="form-group"><label>Department *</label><select className="form-control" required value={form.department} onChange={e => setForm(p => ({ ...p, department: e.target.value }))}><option value="">Select</option>{departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}</select></div>
              <div className="form-group"><label>Academic Year *</label><select className="form-control" required value={form.academicYear} onChange={e => setForm(p => ({ ...p, academicYear: e.target.value }))}><option value="">Select</option>{academicYears.map(a => <option key={a._id} value={a._id}>{a.label}</option>)}</select></div>
            </div>

            <div className="divider" />
            <div className="form-section-title">Seat Matrix & Quota</div>
            <div className="form-grid" style={{ marginBottom: 16 }}>
              <div className="form-group"><label>Total Intake *</label><input className="form-control" type="number" min={1} required value={form.totalIntake} onChange={e => setForm(p => ({ ...p, totalIntake: +e.target.value }))} /></div>
              <div className="form-group"><label>Supernumerary Seats</label><input className="form-control" type="number" min={0} value={form.supernumerarySeats} onChange={e => setForm(p => ({ ...p, supernumerarySeats: +e.target.value }))} /></div>
            </div>

            {quotaMismatch && <div className="alert alert-warning">⚠️ Quota total ({quotaTotal}) must equal Total Intake ({form.totalIntake})</div>}

            <table style={{ width: '100%', marginBottom: 12 }}>
              <thead><tr><th style={{ textAlign: 'left', padding: '6px 8px', fontSize: '0.75rem', color: '#64748b' }}>Quota</th><th style={{ textAlign: 'left', padding: '6px 8px', fontSize: '0.75rem', color: '#64748b' }}>Seats</th><th></th></tr></thead>
              <tbody>
                {form.quotas.map((q, i) => (
                  <tr key={i}>
                    <td style={{ padding: '4px 8px' }}>
                      <select className="form-control" value={q.name} onChange={e => updateQuota(i, 'name', e.target.value)}>
                        {QUOTA_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </td>
                    <td style={{ padding: '4px 8px' }}><input className="form-control" type="number" min={0} value={q.seats} onChange={e => updateQuota(i, 'seats', e.target.value)} /></td>
                    <td style={{ padding: '4px 8px' }}><button type="button" className="btn btn-danger btn-sm" onClick={() => removeQuota(i)}>✕</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button type="button" className="btn btn-secondary btn-sm" onClick={addQuota}>+ Add Quota</button>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => setModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving || quotaMismatch}>{saving ? 'Saving…' : 'Save Program'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
