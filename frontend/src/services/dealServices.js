import api from "./api";
const API_URL = "/deals";

export const getDeals = () => api.get(API_URL);

export const getDealById = (id) => api.get(`${API_URL}/${id}`);

export const createDeal = (dealData) =>
  api.post(API_URL, dealData);

export const updateDeal = (id, dealData) =>
  api.put(`${API_URL}/${id}`, dealData);

export const deleteDealById = (id) =>
  api.delete(`${API_URL}/${id}`);

export const addDealNote = (id, noteData) =>
  api.post(`${API_URL}/${id}/notes`, noteData);
