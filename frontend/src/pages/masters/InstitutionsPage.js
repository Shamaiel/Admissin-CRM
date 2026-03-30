import React, { useEffect, useState } from 'react';
import { institutionService } from '../../services/services';
import Modal from '../../components/common/Modal';
import toast from 'react-hot-toast';

const empty = { name: '', code: '', address: '', contactEmail: '', contactPhone: '', website: '' };

export default function InstitutionsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const fetch = async () => {
    setLoading(true);
    try { const r = await institutionService.getAll(); setItems(r.data.data || []); }
    catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetch(); }, []);

  const openCreate = () => { setForm(empty); setEditing(null); setModal(true); };
  const openEdit = (item) => { setForm(item); setEditing(item._id); setModal(true); };

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      if (editing) { await institutionService.update(editing, form); toast.success('Updated!'); }
      else { await institutionService.create(form); toast.success('Created!'); }
      setModal(false); fetch();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <div className="page-header">
        <div><h1>Institutions</h1><p>Manage educational institutions</p></div>
        <button className="btn btn-primary" onClick={openCreate}>+ Add Institution</button>
      </div>

      <div className="card">
        <div className="table-wrapper">
          <table>
            <thead><tr><th>Name</th><th>Code</th><th>Contact</th><th>Address</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={6}><div className="loading">Loading…</div></td></tr>
                : items.length === 0 ? <tr><td colSpan={6}><div className="empty-state">No institutions yet. Create one to get started.</div></td></tr>
                : items.map(item => (
                  <tr key={item._id}>
                    <td><strong>{item.name}</strong></td>
                    <td><span className="badge badge-purple">{item.code}</span></td>
                    <td>{item.contactEmail}<br /><span className="text-muted text-sm">{item.contactPhone}</span></td>
                    <td>{item.address}</td>
                    <td><span className={`badge ${item.isActive ? 'badge-green' : 'badge-gray'}`}>{item.isActive ? 'Active' : 'Inactive'}</span></td>
                    <td><button className="btn btn-secondary btn-sm" onClick={() => openEdit(item)}>Edit</button></td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit Institution' : 'Add Institution'}>
        <form onSubmit={handleSave}>
          <div className="modal-body">
            <div className="form-grid">
              <div className="form-group"><label>Institution Name *</label><input className="form-control" required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></div>
              <div className="form-group"><label>Code *</label><input className="form-control" required value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value.toUpperCase() }))} placeholder="EIT" /></div>
              <div className="form-group"><label>Contact Email</label><input className="form-control" type="email" value={form.contactEmail} onChange={e => setForm(p => ({ ...p, contactEmail: e.target.value }))} /></div>
              <div className="form-group"><label>Contact Phone</label><input className="form-control" value={form.contactPhone} onChange={e => setForm(p => ({ ...p, contactPhone: e.target.value }))} /></div>
              <div className="form-group" style={{ gridColumn: '1/-1' }}><label>Address *</label><textarea className="form-control" required rows={2} value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} /></div>
              <div className="form-group"><label>Website</label><input className="form-control" value={form.website || ''} onChange={e => setForm(p => ({ ...p, website: e.target.value }))} placeholder="https://" /></div>
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
