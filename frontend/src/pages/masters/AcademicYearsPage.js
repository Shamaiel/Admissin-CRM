import React, { useEffect, useState } from 'react';
import { academicYearService } from '../../services/services';
import Modal from '../../components/common/Modal';
import toast from 'react-hot-toast';

const empty = { label: '', startYear: new Date().getFullYear(), endYear: new Date().getFullYear() + 1, isActive: false };

export default function AcademicYearsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const fetch = async () => {
    setLoading(true);
    try { const r = await academicYearService.getAll(); setItems(r.data.data || []); }
    catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetch(); }, []);

  const openCreate = () => { setForm(empty); setEditing(null); setModal(true); };
  const openEdit = (item) => { setForm(item); setEditing(item._id); setModal(true); };

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const payload = { ...form, label: `${form.startYear}-${String(form.endYear).slice(-2)}` };
      if (editing) { await academicYearService.update(editing, payload); toast.success('Updated!'); }
      else { await academicYearService.create(payload); toast.success('Created!'); }
      setModal(false); fetch();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <div className="page-header">
        <div><h1>Academic Years</h1><p>Manage academic year configurations</p></div>
        <button className="btn btn-primary" onClick={openCreate}>+ Add Academic Year</button>
      </div>
      <div className="card">
        <div className="table-wrapper">
          <table>
            <thead><tr><th>Label</th><th>Start Year</th><th>End Year</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={5}><div className="loading">Loading…</div></td></tr>
                : items.length === 0 ? <tr><td colSpan={5}><div className="empty-state">No academic years yet.</div></td></tr>
                : items.map(item => (
                  <tr key={item._id}>
                    <td><strong>{item.label}</strong></td>
                    <td>{item.startYear}</td>
                    <td>{item.endYear}</td>
                    <td><span className={`badge ${item.isActive ? 'badge-green' : 'badge-gray'}`}>{item.isActive ? 'Active' : 'Inactive'}</span></td>
                    <td><button className="btn btn-secondary btn-sm" onClick={() => openEdit(item)}>Edit</button></td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit Academic Year' : 'Add Academic Year'}>
        <form onSubmit={handleSave}>
          <div className="modal-body">
            <div className="form-grid">
              <div className="form-group"><label>Start Year *</label><input className="form-control" type="number" required value={form.startYear} onChange={e => setForm(p => ({ ...p, startYear: +e.target.value, endYear: +e.target.value + 1 }))} /></div>
              <div className="form-group"><label>End Year *</label><input className="form-control" type="number" required value={form.endYear} onChange={e => setForm(p => ({ ...p, endYear: +e.target.value }))} /></div>
              <div className="form-group" style={{ gridColumn: '1/-1', display: 'flex', alignItems: 'center', gap: 10 }}>
                <input type="checkbox" id="isActive" checked={form.isActive} onChange={e => setForm(p => ({ ...p, isActive: e.target.checked }))} />
                <label htmlFor="isActive" style={{ marginBottom: 0 }}>Set as Active Academic Year</label>
              </div>
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
