import { request } from './http.js';

const resource = (name) => ({
  list: (params) => request(`/${name}`, { params }),
  get: (id) => request(`/${name}/${id}`),
  create: (body) => request(`/${name}`, { method: 'POST', body }),
  update: (id, body) => request(`/${name}/${id}`, { method: 'PATCH', body }),
  remove: (id) => request(`/${name}/${id}`, { method: 'DELETE' }),
});

export const observationsApi = resource('observations');
export const incidentsApi = resource('incidents');
export const patrolsApi = resource('patrols');
export const vegetationApi = resource('vegetation');
export const datasetsApi = resource('datasets');
export const modelsApi = resource('models');

export const alertsApi = {
  ...resource('alerts'),
  review: (id, body) => request(`/alerts/${id}/review`, { method: 'PATCH', body }),
};

export const reportsApi = {
  ...resource('reports'),
  generate: (body) => request('/reports/generate', { method: 'POST', body }),
};

export const dashboardApi = {
  summary: () => request('/dashboard/summary'),
  mapLayers: (params) => request('/dashboard/map-layers', { params }),
  tigerGeoJson: () => request('/dashboard/tiger-geojson'),
};

export const authApi = {
  login: (body) => request('/auth/login', { method: 'POST', body }),
  me: () => request('/auth/me'),
  updateProfile: (body) => request('/auth/me', { method: 'PATCH', body }),
  changePassword: (body) => request('/auth/change-password', { method: 'POST', body }),
};

export const usersApi = {
  list: (params) => request('/users', { params }),
  create: (body) => request('/users', { method: 'POST', body }),
  setActive: (id, isActive) => request(`/users/${id}/active`, { method: 'PATCH', body: { isActive } }),
};
