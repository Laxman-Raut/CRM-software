import { Link, useLocation, useNavigate } from "react-router-dom";
import { FaChartLine, FaProjectDiagram, FaSignOutAlt, FaUserFriends, FaUsers } from "react-icons/fa";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTasks } from "@fortawesome/free-solid-svg-icons";
import "./Sidebar.css";

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("email");
    localStorage.removeItem("name");
    localStorage.removeItem("role");
    localStorage.removeItem("permissions");
    navigate("/login");
  };

  const isActive = (path) => location.pathname === path;
  const role = localStorage.getItem("role");

  return (
    <aside className="sidebar">
      <Link to="/dashboard/leads" className="sidebar-title">
        CRM
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
          to="/dashboard/tasks"
          className={`sidebar-item ${isActive("/dashboard/tasks") ? "active" : ""}`}
        >
          <FontAwesomeIcon icon={faTasks} />
          <span>
            Tasks
          </span>
        </Link>

        {role === "admin" && (
          <Link
            to="/dashboard/employees"
            className={`sidebar-item ${isActive("/dashboard/employees") ? "active" : ""}`}
          >
            <FaUsers aria-hidden="true" />
            Employees
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
