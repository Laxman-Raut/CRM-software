import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { FaChartLine, FaProjectDiagram, FaSignOutAlt, FaUserFriends, FaUsers, FaCalendarAlt, FaUserCheck, FaCog, FaBriefcase, FaChevronDown, FaChevronRight, FaClock } from "react-icons/fa";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTasks } from "@fortawesome/free-solid-svg-icons";
import { useSettings } from "../context/SettingsContext";
import api from "../services/api";
import "./Sidebar.css";

const Sidebar = () => {
  const { settings, reloadSettings } = useSettings();

  useEffect(() => {
    reloadSettings();
  }, []);

  const location = useLocation();
  const navigate = useNavigate();
  const [hrmOpen, setHrmOpen] = useState(location.pathname.startsWith("/dashboard/hrm"));

  useEffect(() => {
    let active = true;
    if (location.pathname.startsWith("/dashboard/hrm")) {
      const timer = setTimeout(() => {
        if (active) {
          setHrmOpen(true);
        }
      }, 0);
      return () => {
        active = false;
        clearTimeout(timer);
      };
    }
  }, [location.pathname]);

  const handleLogout = async () => {
    // Auto Check Out on Logout
    try {
      await api.post("/hrm/attendance/checkout");
    } catch (checkoutErr) {
      console.warn("Auto checkout failed on logout:", checkoutErr.response?.data?.message || checkoutErr.message);
    }

    localStorage.removeItem("token");
    localStorage.removeItem("email");
    localStorage.removeItem("name");
    localStorage.removeItem("role");
    localStorage.removeItem("permissions");
    localStorage.removeItem("resolvedPermissions");
    navigate("/login");
  };

  const isActive = (path) => location.pathname === path;
  const role = localStorage.getItem("role");
  const resolvedPermissions = JSON.parse(localStorage.getItem("resolvedPermissions") || "[]");
  const hasPermission = (perm) => role === "admin" || resolvedPermissions.includes(perm);

  return (
    <aside className="sidebar">
      <Link to="/dashboard/leads" className="sidebar-title">
        {settings.crmName || "Sales CRM"}
      </Link>

      <nav className="sidebar-nav" aria-label="Dashboard navigation">
        <Link
          to="/dashboard/static"
          className={`sidebar-item ${isActive("/dashboard/static") ? "active" : ""}`}
        >
          <FaChartLine aria-hidden="true" />
          Dashboard
        </Link>

        <Link
          to="/dashboard/leads"
          className={`sidebar-item ${isActive("/dashboard/leads") ? "active" : ""}`}
        >
          <FaUserFriends aria-hidden="true" />
          Leads
        </Link>

        <Link
          to="/dashboard/pipeline"
          className={`sidebar-item ${isActive("/dashboard/pipeline") ? "active" : ""}`}
        >
          <FaProjectDiagram aria-hidden="true" />
          Pipeline
        </Link>

        <Link
          to="/dashboard/customers"
          className={`sidebar-item ${isActive("/dashboard/customers") ? "active" : ""}`}
        >
          <FaUserCheck aria-hidden="true" />
          Customers
        </Link>

        <Link 
          to="/dashboard/tasks"
          className={`sidebar-item ${isActive("/dashboard/tasks") ? "active" : ""}`}
        >
          <FontAwesomeIcon icon={faTasks} />
          <span>
            Tasks
          </span>
        </Link>

        <Link
          to="/dashboard/calendar"
          className={`sidebar-item ${isActive("/dashboard/calendar") ? "active" : ""}`}
        >
          <FaCalendarAlt aria-hidden="true" />
          <span>
            Calendar
          </span>
        </Link>

        {hasPermission("employees:manage") && (
          <Link
            to="/dashboard/employees"
            className={`sidebar-item ${isActive("/dashboard/employees") ? "active" : ""}`}
          >
            <FaUsers aria-hidden="true" />
            Employees
          </Link>
        )}

        {/* HRM Collapsible Group */}
        <div className={`sidebar-group ${hrmOpen ? "expanded" : ""}`}>
          <button
            type="button"
            className={`sidebar-item sidebar-group-toggle ${location.pathname.startsWith("/dashboard/hrm") ? "group-active" : ""}`}
            onClick={() => setHrmOpen(!hrmOpen)}
          >
            <FaBriefcase aria-hidden="true" />
            <span>HRM</span>
            <span className="sidebar-group-chevron">
              {hrmOpen ? <FaChevronDown /> : <FaChevronRight />}
            </span>
          </button>
          {hrmOpen && (
            <div className="sidebar-subnav">
              <Link
                to="/dashboard/hrm/attendance"
                className={`sidebar-item sidebar-subitem ${isActive("/dashboard/hrm/attendance") ? "active" : ""}`}
              >
                <FaClock aria-hidden="true" />
                <span>Attendance</span>
              </Link>
            </div>
          )}
        </div>

        {hasPermission("settings:manage") && (
          <Link
            to="/dashboard/settings"
            className={`sidebar-item ${isActive("/dashboard/settings") ? "active" : ""}`}
          >
            <FaCog aria-hidden="true" />
            Settings
          </Link>
        )}

        <button type="button" className="sidebar-item sidebar-logout" onClick={handleLogout}>
          <FaSignOutAlt aria-hidden="true" />
          Logout
        </button>
      </nav>
    </aside>
  );
};

export default Sidebar;
