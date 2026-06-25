import api from "./api";

export const getEvents = () => {
  return api.get("/events");
};

export const createEvent = (eventData) => {
  return api.post("/events", eventData);
};

export const deleteEvent = (id) => {
  return api.delete(`/events/${id}`);
};