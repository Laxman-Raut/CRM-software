import api from "./api";
const API_URL = "/customers";

export const getCustomers = () => api.get(API_URL);

export const getCustomerById = (id) => api.get(`${API_URL}/${id}`);

export const updateCustomer = (id, customerData) =>
  api.put(`${API_URL}/${id}`, customerData);

export const deleteCustomerById = (id) =>
  api.delete(`${API_URL}/${id}`);

export const addCustomerNote = (id, noteData) =>
  api.post(`${API_URL}/${id}/notes`, noteData);
