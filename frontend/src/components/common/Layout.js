import React, { useState } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const icons = {
  dashboard: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
  institution: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path d="M3 21h18M6 18V10M10 18V10M14 18V10M18 18V10M3 10l9-7 9 7"/></svg>,
  campus: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  department: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><circle cx="12" cy="7" r="4"/><path d="M5.5 20a7 7 0 0113 0"/></svg>,
  program: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path d="M12 14l9-5-9-5-9 5z"/><path d="M12 14l6.16-3.422a12 12 0 010 6.844L12 20l-6.16-3.578a12 12 0 010-6.844L12 14z"/></svg>,
  calendar: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  seat: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path d="M20 12V6a2 2 0 00-2-2H6a2 2 0 00-2 2v6m16 0H4m16 0l-2 8H6l-2-8"/></svg>,
  applicant: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>,
  admission: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="15" x2="15" y2="15"/><line x1="9" y1="11" x2="15" y2="11"/></svg>,
  users: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>,
  logout: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
};

const roleBadge = { admin: 'Admin', admission_officer: 'Admission Officer', management: 'Management' };

export default function Layout() {
  const { user, logout, isAdmin, isOfficer } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const pageTitles = {
    '/': 'Dashboard',
    '/masters/institutions': 'Institutions',
    '/masters/campuses': 'Campuses',
    '/masters/departments': 'Departments',
    '/masters/academic-years': 'Academic Years',
    '/masters/programs': 'Programs',
    '/seat-matrix': 'Seat Matrix',
    '/applicants': 'Applicants',
    '/admissions': 'Admissions',
    '/users': 'User Management',
  };
  const title = pageTitles[location.pathname] || 'Admission CRM';

  const handleLogout = () => {
    logout();
    toast.success('Logged out');
    navigate('/login');
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-logo">Edu<span>Merge</span> CRM</div>
        <nav className="sidebar-nav">
          <NavLink to="/" end className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            {icons.dashboard} Dashboard
          </NavLink>

          {(isAdmin || isOfficer) && <>
            <div className="nav-section-title">Admissions</div>
            {isAdmin && <NavLink to="/masters/institutions" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>{icons.institution} Institutions</NavLink>}
            {isAdmin && <NavLink to="/masters/campuses"    className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>{icons.campus} Campuses</NavLink>}
            {isAdmin && <NavLink to="/masters/departments" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>{icons.department} Departments</NavLink>}
            {isAdmin && <NavLink to="/masters/academic-years" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>{icons.calendar} Academic Years</NavLink>}
            {isAdmin && <NavLink to="/masters/programs"   className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>{icons.program} Programs</NavLink>}
            <NavLink to="/seat-matrix" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>{icons.seat} Seat Matrix</NavLink>
            <NavLink to="/applicants"  className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>{icons.applicant} Applicants</NavLink>
            <NavLink to="/admissions"  className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>{icons.admission} Admissions</NavLink>
          </>}

          {!isAdmin && !isOfficer && <>
            <div className="nav-section-title">Reports</div>
            <NavLink to="/seat-matrix" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>{icons.seat} Seat Matrix</NavLink>
            <NavLink to="/admissions"  className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>{icons.admission} Admissions</NavLink>
          </>}

          {isAdmin && <>
            <div className="nav-section-title">Admin</div>
            <NavLink to="/users" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>{icons.users} Users</NavLink>
          </>}
        </nav>
        <div className="sidebar-user">
          <strong>{user?.name}</strong>
          {roleBadge[user?.role]}
          <button onClick={handleLogout} className="btn btn-secondary btn-sm" style={{ marginTop: 10, width: '100%' }}>
            {icons.logout} Logout
          </button>
        </div>
      </aside>

      <div className="main-content">
        <header className="topbar">
          <span className="topbar-title">{title}</span>
          <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{user?.email}</span>
        </header>
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
