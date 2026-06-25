import attendanceRoutes from "./route/attendanceRoutes.js";

export default {
  name: "HRM",

  register(app) {
    app.use("/api/hrm/attendance", attendanceRoutes);
  },
};