import React, { useEffect, useState } from 'react';
import { authService } from '../services/services';
import Modal from '../components/common/Modal';
import toast from 'react-hot-toast';

const roleLabel = { admin: 'Admin', admission_officer: 'Admission Officer', management: 'Management' };
const roleBadge = { admin: 'badge-purple', admission_officer: 'badge-blue', management: 'badge-yellow' };
const emptyForm = { name: '', email: '', password: '', role: 'admission_officer' };

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const fetch = async () => {
    setLoading(true);
    try { const res = await authService.getUsers(); setUsers(res.data.data || []); }
    catch { toast.error('Failed to load users'); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetch(); }, []);

  const openCreate = () => { setForm(emptyForm); setEditing(null); setModal(true); };
  const openEdit = (u) => { setForm({ ...u, password: '' }); setEditing(u._id); setModal(true); };

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const payload = { ...form };
      if (editing && !payload.password) delete payload.password;
      if (editing) { await authService.updateUser(editing, payload); toast.success('User updated!'); }
      else { await authService.createUser(payload); toast.success('User created!'); }
      setModal(false); fetch();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <div className="page-header">
        <div><h1>User Management</h1><p>Manage system users and roles</p></div>
        <button className="btn btn-primary" onClick={openCreate}>+ Add User</button>
      </div>
      <div className="card">
        <div className="table-wrapper">
          <table>
            <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Created</th><th>Actions</th></tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={6}><div className="loading">Loading…</div></td></tr>
                : users.map(u => (
                  <tr key={u._id}>
                    <td><strong>{u.name}</strong></td>
                    <td>{u.email}</td>
                    <td><span className={`badge ${roleBadge[u.role]}`}>{roleLabel[u.role]}</span></td>
                    <td><span className={`badge ${u.isActive ? 'badge-green' : 'badge-red'}`}>{u.isActive ? 'Active' : 'Inactive'}</span></td>
                    <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td><button className="btn btn-secondary btn-sm" onClick={() => openEdit(u)}>Edit</button></td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit User' : 'Add User'}>
        <form onSubmit={handleSave}>
          <div className="modal-body">
            <div className="form-grid">
              <div className="form-group"><label>Full Name *</label><input className="form-control" required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></div>
              <div className="form-group"><label>Email *</label><input className="form-control" type="email" required value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} /></div>
              <div className="form-group"><label>{editing ? 'New Password (leave blank to keep)' : 'Password *'}</label><input className="form-control" type="password" required={!editing} value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} /></div>
              <div className="form-group"><label>Role *</label>
                <select className="form-control" value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}>
                  <option value="admin">Admin</option>
                  <option value="admission_officer">Admission Officer</option>
                  <option value="management">Management</option>
                </select>
              </div>
              {editing && (
                <div className="form-group" style={{ gridColumn: '1/-1', display: 'flex', gap: 10, alignItems: 'center' }}>
                  <input type="checkbox" id="isActive" checked={form.isActive ?? true} onChange={e => setForm(p => ({ ...p, isActive: e.target.checked }))} />
                  <label htmlFor="isActive" style={{ marginBottom: 0 }}>Account Active</label>
                </div>
              )}
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => setModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save User'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
