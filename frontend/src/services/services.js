import api from './api';

// Auth
export const authService = {
  login:      (data)     => api.post('/auth/login', data),
  getMe:      ()         => api.get('/auth/me'),
  getUsers:   ()         => api.get('/auth/users'),
  createUser: (data)     => api.post('/auth/users', data),
  updateUser: (id, data) => api.put(`/auth/users/${id}`, data),
};

// Masters
export const institutionService = {
  getAll:  ()           => api.get('/institutions'),
  create:  (data)       => api.post('/institutions', data),
  update:  (id, data)   => api.put(`/institutions/${id}`, data),
  delete:  (id)         => api.delete(`/institutions/${id}`),
};

export const campusService = {
  getAll:  ()           => api.get('/campuses'),
  create:  (data)       => api.post('/campuses', data),
  update:  (id, data)   => api.put(`/campuses/${id}`, data),
};

export const departmentService = {
  getAll:  ()           => api.get('/departments'),
  create:  (data)       => api.post('/departments', data),
  update:  (id, data)   => api.put(`/departments/${id}`, data),
};

export const academicYearService = {
  getAll:  ()           => api.get('/academic-years'),
  create:  (data)       => api.post('/academic-years', data),
  update:  (id, data)   => api.put(`/academic-years/${id}`, data),
};

// Programs & Seat Matrix
export const programService = {
  getAll:            (params)              => api.get('/programs', { params }),
  getOne:            (id)                  => api.get(`/programs/${id}`),
  create:            (data)               => api.post('/programs', data),
  update:            (id, data)           => api.put(`/programs/${id}`, data),
  delete:            (id)                 => api.delete(`/programs/${id}`),
  checkAvailability: (programId, quotaType) => api.get(`/programs/${programId}/availability/${quotaType}`),
};

export const seatMatrixService = {
  getAll: (params) => api.get('/seat-matrix', { params }),
};

// Applicants
export const applicantService = {
  getAll:         (params)       => api.get('/applicants', { params }),
  getOne:         (id)           => api.get(`/applicants/${id}`),
  create:         (data)         => api.post('/applicants', data),
  update:         (id, data)     => api.put(`/applicants/${id}`, data),
  allocateSeat:   (id, data)     => api.post(`/applicants/${id}/allocate-seat`, data),
  updateDocument: (id, data)     => api.patch(`/applicants/${id}/document`, data),
  updateFee:      (id)           => api.patch(`/applicants/${id}/fee`),
};

// Admissions
export const admissionService = {
  getAll:         (params) => api.get('/admissions', { params }),
  getOne:         (id)     => api.get(`/admissions/${id}`),
  // ✅ NEW: fetch admission record by applicant ID
  getByApplicant: (applicantId) => api.get(`/admissions/by-applicant/${applicantId}`),
  create:         (data)   => api.post('/admissions', data),
  confirm:        (id)     => api.post(`/admissions/${id}/confirm`),
  cancel:         (id)     => api.post(`/admissions/${id}/cancel`),
};

// Dashboard
export const dashboardService = {
  getSummary: (params) => api.get('/dashboard/summary', { params }),
};
