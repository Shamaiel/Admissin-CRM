import React, { useEffect, useState } from 'react';
import { departmentService, campusService, institutionService } from '../../services/services';
import Modal from '../../components/common/Modal';
import toast from 'react-hot-toast';

const empty = { name: '', code: '', campus: '', institution: '', hodName: '' };

export default function DepartmentsPage() {
  const [items, setItems] = useState([]);
  const [campuses, setCampuses] = useState([]);
  const [institutions, setInstitutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const fetch = async () => {
    setLoading(true);
    try {
      const [d, c, i] = await Promise.all([departmentService.getAll(), campusService.getAll(), institutionService.getAll()]);
      setItems(d.data.data || []); setCampuses(c.data.data || []); setInstitutions(i.data.data || []);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetch(); }, []);

  const openCreate = () => { setForm(empty); setEditing(null); setModal(true); };
  const openEdit = (item) => {
    setForm({ ...item, campus: item.campus?._id || item.campus, institution: item.institution?._id || item.institution });
    setEditing(item._id); setModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      if (editing) { await departmentService.update(editing, form); toast.success('Updated!'); }
      else { await departmentService.create(form); toast.success('Created!'); }
      setModal(false); fetch();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <div className="page-header">
        <div><h1>Departments</h1><p>Manage academic departments</p></div>
        <button className="btn btn-primary" onClick={openCreate}>+ Add Department</button>
      </div>
      <div className="card">
        <div className="table-wrapper">
          <table>
            <thead><tr><th>Department</th><th>Code</th><th>Campus</th><th>Institution</th><th>HoD</th><th>Actions</th></tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={6}><div className="loading">Loading…</div></td></tr>
                : items.length === 0 ? <tr><td colSpan={6}><div className="empty-state">No departments yet.</div></td></tr>
                : items.map(item => (
                  <tr key={item._id}>
                    <td><strong>{item.name}</strong></td>
                    <td><span className="badge badge-blue">{item.code}</span></td>
                    <td>{item.campus?.name || '—'}</td>
                    <td>{item.institution?.name || '—'}</td>
                    <td>{item.hodName || '—'}</td>
                    <td><button className="btn btn-secondary btn-sm" onClick={() => openEdit(item)}>Edit</button></td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit Department' : 'Add Department'}>
        <form onSubmit={handleSave}>
          <div className="modal-body">
            <div className="form-grid">
              <div className="form-group"><label>Department Name *</label><input className="form-control" required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></div>
              <div className="form-group"><label>Code *</label><input className="form-control" required value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value.toUpperCase() }))} placeholder="CS" /></div>
              <div className="form-group">
                <label>Institution *</label>
                <select className="form-control" required value={form.institution} onChange={e => setForm(p => ({ ...p, institution: e.target.value }))}>
                  <option value="">Select Institution</option>
                  {institutions.map(i => <option key={i._id} value={i._id}>{i.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Campus *</label>
                <select className="form-control" required value={form.campus} onChange={e => setForm(p => ({ ...p, campus: e.target.value }))}>
                  <option value="">Select Campus</option>
                  {campuses.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </div>
              <div className="form-group"><label>Head of Department</label><input className="form-control" value={form.hodName || ''} onChange={e => setForm(p => ({ ...p, hodName: e.target.value }))} /></div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => setModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
