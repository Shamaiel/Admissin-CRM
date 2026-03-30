import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { applicantService, admissionService, programService } from '../services/services';
import Modal from '../components/common/Modal';
import toast from 'react-hot-toast';

const STATUS_ORDER = ['Applied', 'Seat Allocated', 'Documents Verified', 'Fee Paid', 'Admitted'];

const statusBadge = {
  'Applied':            'badge-blue',
  'Seat Allocated':     'badge-purple',
  'Documents Verified': 'badge-yellow',
  'Fee Paid':           'badge-orange',
  'Admitted':           'badge-green',
  'Cancelled':          'badge-red',
};

const docStatusColor = {
  Pending:   { bg: '#fee2e2', color: '#b91c1c' },
  Submitted: { bg: '#fef9c3', color: '#92400e' },
  Verified:  { bg: '#dcfce7', color: '#15803d' },
};

export default function ApplicantDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [applicant, setApplicant]     = useState(null);
  const [admission, setAdmission]     = useState(null);
  const [programs, setPrograms]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [saving, setSaving]           = useState(false);

  // Seat allocation modal state
  const [allocModal, setAllocModal]   = useState(false);
  const [allocForm, setAllocForm]     = useState({ programId: '', quotaType: 'KCET', allotmentNumber: '' });
  const [availability, setAvailability] = useState(null);
  const [checkingAvail, setCheckingAvail] = useState(false);

  // ─── Fetch applicant + admission record ───────────────────────────────────
  // const fetchData = useCallback(async () => {
  //   try {
  //     const [appRes, progRes] = await Promise.all([
  //       applicantService.getOne(id),
  //       programService.getAll(),
  //     ]);
  //     const app = appRes.data.data;
  //     setApplicant(app);
  //     setPrograms(progRes.data.data || []);

  //     // Fetch admission record via dedicated endpoint
  //     try {
  //       const admRes = await admissionService.getByApplicant(id);
  //       setAdmission(admRes.data.data || null);
  //     } catch {
  //       setAdmission(null);
  //     }
  //   } catch {
  //     toast.error('Failed to load applicant data');
  //   } finally {
  //     setLoading(false);
  //   }
  // }, [id]);


  const fetchData = useCallback(async () => {
  setLoading(true);
  try {
    // Each call is independent — one failure won't crash the rest
    const appRes = await applicantService.getOne(id);
    setApplicant(appRes.data.data);

    try {
      const progRes = await programService.getAll();
      setPrograms(progRes.data.data || []);
    } catch {
      setPrograms([]);
    }

    try {
      const admRes = await admissionService.getByApplicant(id);
      setAdmission(admRes.data.data || null);
    } catch {
      // 404 = no admission record yet, totally normal for new applicants
      setAdmission(null);
    }
  } catch (err) {
    toast.error(err.response?.data?.message || 'Failed to load applicant');
  } finally {
    setLoading(false);
  }
}, [id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ─── STEP 2: Check seat availability ─────────────────────────────────────
  const checkAvailability = async () => {
    if (!allocForm.programId || !allocForm.quotaType) {
      toast.error('Select a program and quota first');
      return;
    }
    setCheckingAvail(true);
    setAvailability(null);
    try {
      const res = await programService.checkAvailability(allocForm.programId, allocForm.quotaType);
      setAvailability(res.data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to check availability');
    } finally {
      setCheckingAvail(false);
    }
  };

  // ─── STEP 2: Allocate seat ────────────────────────────────────────────────
  const handleAllocateSeat = async (e) => {
    e.preventDefault();
    if (!availability) { toast.error('Please check availability first'); return; }
    if (!availability.isAvailable) { toast.error('No seats available in this quota'); return; }

    setSaving(true);
    try {
      // 1. Allocate seat (updates Program quota counter + Applicant status)
      await applicantService.allocateSeat(id, allocForm);
      // 2. Create admission record
      await admissionService.create({ applicantId: id });
      toast.success('✅ Seat allocated successfully!');
      setAllocModal(false);
      setAvailability(null);
      await fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Seat allocation failed');
    } finally {
      setSaving(false);
    }
  };

  // ─── STEP 3: Update document status ──────────────────────────────────────
  const handleDocumentUpdate = async (docName, newStatus) => {
    try {
      await applicantService.updateDocument(id, { docName, status: newStatus });
      toast.success(`${docName} → ${newStatus}`);
      await fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update document');
    }
  };

  // ─── STEP 4: Mark fee as paid ─────────────────────────────────────────────
  const handleMarkFeePaid = async () => {
    if (!window.confirm('Confirm: Mark this student\'s fee as PAID?')) return;
    setSaving(true);
    try {
      await applicantService.updateFee(id);
      toast.success('✅ Fee marked as Paid');
      await fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update fee');
    } finally {
      setSaving(false);
    }
  };

  // ─── STEP 5: Confirm admission ────────────────────────────────────────────
  const handleConfirmAdmission = async () => {
    if (!admission) { toast.error('Admission record not found'); return; }
    if (!window.confirm('CONFIRM ADMISSION? This will generate a permanent, irreversible Admission Number.')) return;
    setSaving(true);
    try {
      const res = await admissionService.confirm(admission._id);
      toast.success(res.data.message || 'Admission confirmed!');
      await fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Confirmation failed');
    } finally {
      setSaving(false);
    }
  };

  // ─── Loading / Not found ─────────────────────────────────────────────────
  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, flexDirection: 'column', gap: 12 }}>
      <div style={{ width: 36, height: 36, border: '3px solid #e2e8f0', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <span style={{ color: '#94a3b8' }}>Loading applicant…</span>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (!applicant) return (
    <div className="empty-state">
      <p>Applicant not found.</p>
      <button className="btn btn-secondary" onClick={() => navigate('/applicants')}>← Back to list</button>
    </div>
  );

  const currentStepIndex = STATUS_ORDER.indexOf(applicant.status);
  const allDocsVerified  = applicant.documents.every(d => d.status === 'Verified');
  const isCancelled      = applicant.status === 'Cancelled';
  const isAdmitted       = applicant.status === 'Admitted';

  // What actions are available right now
  const canAllocateSeat  = applicant.status === 'Applied' && !isCancelled;
  const canUpdateDocs    = ['Seat Allocated', 'Documents Verified'].includes(applicant.status);
  const canMarkFeePaid   = ['Seat Allocated', 'Documents Verified'].includes(applicant.status) && applicant.feeStatus !== 'Paid';
  const canConfirm       = applicant.feeStatus === 'Paid' && admission && !isAdmitted && !isCancelled;

  return (
    <div>
      {/* ── Page Header ──────────────────────────────────────────────── */}
      <div className="page-header" style={{ flexWrap: 'wrap', gap: 12 }}>
        <div>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/applicants')} style={{ marginBottom: 8 }}>
            ← Back to Applicants
          </button>
          <h1 style={{ margin: 0 }}>{applicant.firstName} {applicant.lastName}</h1>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.875rem' }}>
            {applicant.email} &nbsp;·&nbsp; {applicant.phone}
          </p>
        </div>
        <div className="flex gap-2 items-center" style={{ flexWrap: 'wrap' }}>
          <span className={`badge ${statusBadge[applicant.status] || 'badge-gray'}`}
                style={{ fontSize: '0.85rem', padding: '6px 14px' }}>
            {applicant.status}
          </span>

          {canAllocateSeat && (
            <button className="btn btn-primary" onClick={() => {
              setAllocForm({ programId: '', quotaType: applicant.quotaType || 'KCET', allotmentNumber: applicant.allotmentNumber || '' });
              setAvailability(null);
              setAllocModal(true);
            }}>
              🪑 Allocate Seat
            </button>
          )}

          {canConfirm && (
            <button className="btn btn-success" onClick={handleConfirmAdmission} disabled={saving}>
              {saving ? 'Confirming…' : '🎓 Confirm Admission'}
            </button>
          )}
        </div>
      </div>

      {/* ── Admission Number Banner ───────────────────────────────────── */}
      {admission?.admissionNumber && (
        <div style={{
          background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
          border: '2px solid #86efac', borderRadius: 12, padding: '20px 24px',
          marginBottom: 24, display: 'flex', alignItems: 'center', gap: 16
        }}>
          <span style={{ fontSize: '2.5rem' }}>🎓</span>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#15803d', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Admission Confirmed
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#166534', letterSpacing: '0.06em', fontFamily: 'monospace' }}>
              {admission.admissionNumber}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#4ade80' }}>
              Confirmed on {admission.confirmedAt ? new Date(admission.confirmedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}
            </div>
          </div>
        </div>
      )}

      {/* ── Workflow Progress Bar ─────────────────────────────────────── */}
      {!isCancelled && (
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '20px 24px', marginBottom: 24 }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Admission Workflow
          </div>
          <div style={{ display: 'flex', gap: 0, position: 'relative' }}>
            {/* Connector line */}
            <div style={{ position: 'absolute', top: 16, left: '10%', right: '10%', height: 2, background: '#e2e8f0', zIndex: 0 }} />
            <div style={{ position: 'absolute', top: 16, left: '10%', height: 2, background: '#6366f1', zIndex: 1, width: `${Math.max(0, (currentStepIndex / (STATUS_ORDER.length - 1)) * 80)}%`, transition: 'width 0.4s ease' }} />

            {STATUS_ORDER.map((step, i) => {
              const done    = i <= currentStepIndex;
              const current = i === currentStepIndex;
              return (
                <div key={step} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, position: 'relative', zIndex: 2 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, fontSize: '0.8rem', transition: 'all 0.3s',
                    background: done ? '#6366f1' : '#f1f5f9',
                    color: done ? '#fff' : '#94a3b8',
                    border: current ? '3px solid #a5b4fc' : 'none',
                    boxShadow: current ? '0 0 0 4px rgba(99,102,241,0.15)' : 'none',
                  }}>
                    {done && i < currentStepIndex ? '✓' : i + 1}
                  </div>
                  <div style={{ fontSize: '0.72rem', fontWeight: current ? 700 : 500, color: done ? '#4f46e5' : '#94a3b8', textAlign: 'center', lineHeight: 1.3 }}>
                    {step.replace('Seat Allocated', 'Seat\nAllocated').replace('Documents Verified', 'Docs\nVerified').replace('Fee Paid', 'Fee\nPaid')}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Main Grid ─────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

        {/* Personal Info */}
        <div className="card">
          <div className="card-header"><span className="card-title">👤 Personal Information</span></div>
          <div className="card-body" style={{ padding: 0 }}>
            {[
              ['Full Name',    `${applicant.firstName} ${applicant.lastName}`],
              ['Date of Birth', applicant.dateOfBirth ? new Date(applicant.dateOfBirth).toLocaleDateString('en-IN') : '—'],
              ['Gender',       applicant.gender],
              ['Category',     applicant.category],
              ['State',        applicant.state],
              ['Address',      applicant.address],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 20px', borderBottom: '1px solid #f8fafc', fontSize: '0.875rem', gap: 12 }}>
                <span style={{ color: '#64748b', flexShrink: 0 }}>{k}</span>
                <span style={{ fontWeight: 500, textAlign: 'right' }}>{v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Academic & Admission Details */}
        <div className="card">
          <div className="card-header"><span className="card-title">🎓 Academic & Admission Details</span></div>
          <div className="card-body" style={{ padding: 0 }}>
            {[
              ['Qualifying Exam',  applicant.qualifyingExam],
              ['Marks %',         `${applicant.qualifyingMarks}%`],
              ['Board',           applicant.qualifyingBoard || '—'],
              ['Rank / Score',    applicant.rankOrScore || '—'],
              ['Entry Type',      applicant.entryType],
              ['Quota Type',      applicant.quotaType],
              ['Allotment No.',   applicant.allotmentNumber || '—'],
              ['Program',         applicant.program ? `${applicant.program.name} (${applicant.program.code})` : 'Not yet allocated'],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 20px', borderBottom: '1px solid #f8fafc', fontSize: '0.875rem', gap: 12 }}>
                <span style={{ color: '#64748b', flexShrink: 0 }}>{k}</span>
                <span style={{ fontWeight: 500, textAlign: 'right', color: k === 'Program' && !applicant.program ? '#94a3b8' : undefined }}>{v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* STEP 3 — Document Checklist */}
        <div className="card" style={{ gridColumn: '1 / -1' }}>
          <div className="card-header">
            <span className="card-title">📄 Step 3 — Document Checklist</span>
            <div className="flex gap-2 items-center">
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                {applicant.documents.filter(d => d.status === 'Verified').length}/{applicant.documents.length} verified
              </span>
              <span className={`badge ${allDocsVerified ? 'badge-green' : 'badge-yellow'}`}>
                {allDocsVerified ? '✓ All Verified' : 'Pending'}
              </span>
            </div>
          </div>

          {!canUpdateDocs && !isAdmitted && (
            <div className="alert alert-info" style={{ margin: '16px 20px 0' }}>
              ℹ️ Documents can be updated after seat is allocated (Step 2).
            </div>
          )}

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '10px 20px', fontSize: '0.72rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>Document</th>
                  <th style={{ textAlign: 'center', padding: '10px 20px', fontSize: '0.72rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>Current Status</th>
                  <th style={{ textAlign: 'center', padding: '10px 20px', fontSize: '0.72rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {applicant.documents.map((doc, i) => {
                  const colors = docStatusColor[doc.status];
                  return (
                    <tr key={doc.name} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px 20px', fontSize: '0.875rem', fontWeight: 500 }}>
                        {i + 1}. {doc.name}
                      </td>
                      <td style={{ padding: '12px 20px', textAlign: 'center' }}>
                        <span style={{ background: colors.bg, color: colors.color, padding: '3px 12px', borderRadius: 999, fontSize: '0.78rem', fontWeight: 600 }}>
                          {doc.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px 20px', textAlign: 'center' }}>
                        {(canUpdateDocs || isAdmitted) ? (
                          <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                            {['Pending', 'Submitted', 'Verified'].map(s => (
                              <button key={s}
                                onClick={() => doc.status !== s && handleDocumentUpdate(doc.name, s)}
                                disabled={isAdmitted || doc.status === s}
                                style={{
                                  padding: '4px 12px', borderRadius: 6, fontSize: '0.75rem', fontWeight: 600, cursor: doc.status === s || isAdmitted ? 'default' : 'pointer',
                                  border: doc.status === s ? '2px solid' : '1px solid #d1d5db',
                                  background: doc.status === s ? docStatusColor[s].bg : '#fff',
                                  color: doc.status === s ? docStatusColor[s].color : '#64748b',
                                  opacity: isAdmitted ? 0.6 : 1,
                                }}>
                                {s}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <span style={{ color: '#cbd5e1', fontSize: '0.8rem' }}>—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* STEP 4 — Fee Status */}
        <div className="card">
          <div className="card-header"><span className="card-title">💰 Step 4 — Fee Status</span></div>
          <div className="card-body">
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{ fontSize: '3.5rem', marginBottom: 12 }}>
                {applicant.feeStatus === 'Paid' ? '✅' : '⏳'}
              </div>
              <div style={{
                fontSize: '1.6rem', fontWeight: 800, marginBottom: 6,
                color: applicant.feeStatus === 'Paid' ? '#15803d' : '#dc2626'
              }}>
                {applicant.feeStatus}
              </div>
              {applicant.feePaidOn && (
                <div style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: 16 }}>
                  Paid on {new Date(applicant.feePaidOn).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
              )}

              {canMarkFeePaid && (
                <button className="btn btn-success" onClick={handleMarkFeePaid} disabled={saving}
                  style={{ padding: '10px 28px', fontSize: '0.95rem', marginTop: 8 }}>
                  {saving ? 'Updating…' : '✓ Mark Fee as Paid'}
                </button>
              )}

              {applicant.feeStatus !== 'Paid' && applicant.status === 'Applied' && (
                <div className="alert alert-warning" style={{ marginTop: 16, fontSize: '0.8rem', textAlign: 'left' }}>
                  ⚠️ Allocate a seat first before marking fee.
                </div>
              )}

              {applicant.feeStatus !== 'Paid' && applicant.status !== 'Applied' && (
                <div className="alert alert-warning" style={{ marginTop: 16, fontSize: '0.8rem', textAlign: 'left' }}>
                  ⚠️ Admission cannot be confirmed until fee is marked as Paid.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* STEP 5 — Confirm Admission */}
        <div className="card">
          <div className="card-header"><span className="card-title">🎓 Step 5 — Confirm Admission</span></div>
          <div className="card-body">
            {isAdmitted && admission?.admissionNumber ? (
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>🎉</div>
                <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: 6 }}>Admission Number</div>
                <div style={{ fontFamily: 'monospace', fontSize: '1.1rem', fontWeight: 800, color: '#166534', background: '#f0fdf4', padding: '10px 16px', borderRadius: 8, border: '1px solid #86efac', wordBreak: 'break-all' }}>
                  {admission.admissionNumber}
                </div>
                <div style={{ marginTop: 12, fontSize: '0.8rem', color: '#15803d', fontWeight: 500 }}>
                  ✓ This number is permanent and cannot be changed
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <div style={{ fontSize: '3rem', marginBottom: 12 }}>{canConfirm ? '🔓' : '🔒'}</div>

                {/* Checklist before confirmation */}
                <div style={{ textAlign: 'left', background: '#f8fafc', borderRadius: 8, padding: '12px 16px', marginBottom: 16 }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748b', marginBottom: 8 }}>REQUIREMENTS:</div>
                  {[
                    { label: 'Seat allocated',   done: applicant.status !== 'Applied' && !isCancelled },
                    { label: 'Fee paid',          done: applicant.feeStatus === 'Paid' },
                    { label: 'Admission record',  done: !!admission },
                  ].map(req => (
                    <div key={req.label} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', fontSize: '0.85rem', color: req.done ? '#15803d' : '#94a3b8' }}>
                      <span style={{ fontSize: '1rem' }}>{req.done ? '✅' : '⬜'}</span>
                      {req.label}
                    </div>
                  ))}
                </div>

                {canConfirm ? (
                  <button className="btn btn-success" onClick={handleConfirmAdmission} disabled={saving}
                    style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: '0.95rem' }}>
                    {saving ? 'Generating Admission Number…' : '🎓 Confirm Admission & Generate Number'}
                  </button>
                ) : (
                  <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                    Complete all requirements above to enable confirmation.
                  </div>
                )}

                {isCancelled && (
                  <div className="alert alert-error" style={{ marginTop: 12 }}>
                    This admission has been cancelled.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── SEAT ALLOCATION MODAL ─────────────────────────────────────── */}
      <Modal open={allocModal} onClose={() => { setAllocModal(false); setAvailability(null); }} title="🪑 Step 2 — Allocate Seat">
        <form onSubmit={handleAllocateSeat}>
          <div className="modal-body">
            <div className="alert alert-info" style={{ marginBottom: 20 }}>
              The system will <strong>block allocation</strong> if the selected quota has no remaining seats.
            </div>

            {/* Program */}
            <div className="form-group" style={{ marginBottom: 16 }}>
              <label>Select Program *</label>
              <select className="form-control" required value={allocForm.programId}
                onChange={e => { setAllocForm(p => ({ ...p, programId: e.target.value })); setAvailability(null); }}>
                <option value="">— Choose a program —</option>
                {programs.map(p => (
                  <option key={p._id} value={p._id}>
                    {p.name} ({p.code}) — {p.courseType}
                  </option>
                ))}
              </select>
            </div>

            {/* Quota */}
            <div className="form-group" style={{ marginBottom: 16 }}>
              <label>Quota Type *</label>
              <select className="form-control" required value={allocForm.quotaType}
                onChange={e => { setAllocForm(p => ({ ...p, quotaType: e.target.value })); setAvailability(null); }}>
                {['KCET', 'COMEDK', 'Management', 'JK', 'NRI'].map(q => (
                  <option key={q} value={q}>{q}</option>
                ))}
              </select>
            </div>

            {/* Allotment number (govt quota) */}
            <div className="form-group" style={{ marginBottom: 20 }}>
              <label>Allotment Number <span style={{ color: '#94a3b8', fontWeight: 400 }}>(required for KCET / COMEDK)</span></label>
              <input className="form-control" placeholder="e.g. K-2026-CSE-00123"
                value={allocForm.allotmentNumber}
                onChange={e => setAllocForm(p => ({ ...p, allotmentNumber: e.target.value }))} />
            </div>

            {/* Check availability button */}
            <button type="button" className="btn btn-secondary"
              onClick={checkAvailability}
              disabled={!allocForm.programId || checkingAvail}
              style={{ width: '100%', justifyContent: 'center', marginBottom: 12 }}>
              {checkingAvail ? '⏳ Checking…' : '🔍 Check Seat Availability'}
            </button>

            {/* Availability result */}
            {availability && (
              <div style={{
                padding: '16px', borderRadius: 10, marginTop: 4,
                background: availability.isAvailable ? '#f0fdf4' : '#fef2f2',
                border: `2px solid ${availability.isAvailable ? '#86efac' : '#fca5a5'}`,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <strong style={{ fontSize: '0.9rem', color: availability.isAvailable ? '#15803d' : '#b91c1c' }}>
                    {availability.isAvailable ? '✅ Seats Available' : '🚫 Quota FULL — Blocked'}
                  </strong>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                  {[
                    ['Total Seats', availability.total],
                    ['Filled',      availability.filled],
                    ['Available',   availability.available],
                  ].map(([label, val]) => (
                    <div key={label} style={{ textAlign: 'center', background: 'rgba(255,255,255,0.6)', borderRadius: 6, padding: '8px' }}>
                      <div style={{ fontSize: '1.4rem', fontWeight: 800, color: availability.isAvailable ? '#166534' : '#991b1b' }}>{val}</div>
                      <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 500 }}>{label}</div>
                    </div>
                  ))}
                </div>
                {!availability.isAvailable && (
                  <div style={{ marginTop: 10, fontSize: '0.82rem', color: '#b91c1c', fontWeight: 500 }}>
                    This quota has no remaining seats. Try a different quota or program.
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => { setAllocModal(false); setAvailability(null); }}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary"
              disabled={saving || !availability || !availability.isAvailable}
              style={{ minWidth: 140 }}>
              {saving ? 'Allocating…' : availability?.isAvailable ? '✓ Allocate Seat' : 'Check Availability First'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
