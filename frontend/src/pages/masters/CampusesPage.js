import React, { useEffect, useState } from 'react';
import { campusService, institutionService } from '../../services/services';
import Modal from '../../components/common/Modal';
import toast from 'react-hot-toast';

const empty = { name: '', institution: '', address: '' };

export default function CampusesPage() {
  const [items, setItems] = useState([]);
  const [institutions, setInstitutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const fetch = async () => {
    setLoading(true);
    try {
      const [c, i] = await Promise.all([campusService.getAll(), institutionService.getAll()]);
      setItems(c.data.data || []); setInstitutions(i.data.data || []);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetch(); }, []);

  const openCreate = () => { setForm(empty); setEditing(null); setModal(true); };
  const openEdit = (item) => { setForm({ ...item, institution: item.institution?._id || item.institution }); setEditing(item._id); setModal(true); };

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      if (editing) { await campusService.update(editing, form); toast.success('Updated!'); }
      else { await campusService.create(form); toast.success('Created!'); }
      setModal(false); fetch();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <div className="page-header">
        <div><h1>Campuses</h1><p>Manage institution campuses</p></div>
        <button className="btn btn-primary" onClick={openCreate}>+ Add Campus</button>
      </div>
      <div className="card">
        <div className="table-wrapper">
          <table>
            <thead><tr><th>Campus Name</th><th>Institution</th><th>Address</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={5}><div className="loading">Loading…</div></td></tr>
                : items.length === 0 ? <tr><td colSpan={5}><div className="empty-state">No campuses yet.</div></td></tr>
                : items.map(item => (
                  <tr key={item._id}>
                    <td><strong>{item.name}</strong></td>
                    <td>{item.institution?.name || '—'}</td>
                    <td>{item.address || '—'}</td>
                    <td><span className={`badge ${item.isActive ? 'badge-green' : 'badge-gray'}`}>{item.isActive ? 'Active' : 'Inactive'}</span></td>
                    <td><button className="btn btn-secondary btn-sm" onClick={() => openEdit(item)}>Edit</button></td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit Campus' : 'Add Campus'}>
        <form onSubmit={handleSave}>
          <div className="modal-body">
            <div className="form-grid">
              <div className="form-group"><label>Campus Name *</label><input className="form-control" required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></div>
              <div className="form-group">
                <label>Institution *</label>
                <select className="form-control" required value={form.institution} onChange={e => setForm(p => ({ ...p, institution: e.target.value }))}>
                  <option value="">Select Institution</option>
                  {institutions.map(i => <option key={i._id} value={i._id}>{i.name}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ gridColumn: '1/-1' }}><label>Address</label><textarea className="form-control" rows={2} value={form.address || ''} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} /></div>
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
