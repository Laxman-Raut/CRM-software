import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Leads from "./pages/Leads";
import Pipeline from "./pages/Pipeline";
import Static from "./pages/Static";
import Employees from "./pages/Employees";
import ProtectedRoute from "./components/ProtectedRoute";
import ForgotPassword from "./pages/ForgotPassword";
import Tasks from "./pages/Tasks";
import Calendar from "./pages/Calendar";
import Customers from "./pages/Customers";
import Settings from "./pages/Settings";
import Attendance from "./pages/Attendance";
// Permission-based route helper
const PermissionRoute = ({ children, requiredPermission }) => {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  const resolvedPermissions = JSON.parse(localStorage.getItem("resolvedPermissions") || "[]");

  if (!token) {
    return <Navigate to="/login" />;
  }

  if (role === "admin") {
    return children;
  }

  if (requiredPermission && !resolvedPermissions.includes(requiredPermission)) {
    return <Navigate to="/dashboard/leads" />;
  }

  return children;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" />} />
      <Route path="/login" element={<Login />} />
      
      {/* Protected Dashboard Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Navigate to="/dashboard/leads" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/leads"
        element={
          <ProtectedRoute>
            <Leads />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/pipeline"
        element={
          <ProtectedRoute>
            <Pipeline />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/static"
        element={
          <ProtectedRoute>
            <Static />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/customers"
        element={
          <ProtectedRoute>
            <Customers />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/employees"
        element={
          <PermissionRoute requiredPermission="employees:manage">
            <Employees />
          </PermissionRoute>
        }
      />
      <Route
        path="/dashboard/settings"
        element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        }
      />


      <Route 
  path="/forgot-password"
  element={<ForgotPassword />}
/>

<Route
  path="/dashboard/tasks"
  element={
    <ProtectedRoute>
      <Tasks/>
    </ProtectedRoute>
  }
/>

<Route
  path="/dashboard/calendar"
  element={
    <ProtectedRoute>
      <Calendar/>
    </ProtectedRoute>
  }
/>

<Route
  path="/dashboard/hrm/attendance"
  element={
    <ProtectedRoute>
      <Attendance/>
    </ProtectedRoute>
  }
/>
    </Routes>

   



  );
};

export default AppRoutes;
