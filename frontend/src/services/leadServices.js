import api from "./api";
const API_URL = "/leads";

export const getLeads = () => api.get(API_URL);

export const createLead = (leadData) =>
  api.post(API_URL, leadData);

export const updateLead = (id, leadData) =>
  api.put(`${API_URL}/${id}`, leadData);

export const deleteLeadById = (id) =>
  api.delete(`${API_URL}/${id}`);