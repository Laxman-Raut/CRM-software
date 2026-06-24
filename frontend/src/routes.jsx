import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Leads from "./pages/Leads";
import Pipeline from "./pages/Pipeline";
import Static from "./pages/Static";
import Employees from "./pages/Employees";
import ProtectedRoute from "./components/ProtectedRoute";
import ForgotPassword from "./pages/ForgotPassword";
import Tasks from "./pages/Tasks";
// Admin-only route helper
const AdminRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  if (!token) {
    return <Navigate to="/login" />;
  }

  if (role !== "admin") {
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
        path="/dashboard/employees"
        element={
          <AdminRoute>
            <Employees />
          </AdminRoute>
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
    </Routes>

   



  );
};

export default AppRoutes;
