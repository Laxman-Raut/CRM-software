import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import { useTheme } from "../context/ThemeContext";

const Layout = ({ children }) => {
  const { darkMode } = useTheme();

  return (
    <div className="dashboard-shell">
      <Sidebar />

      <div className="layout-body">
        <Navbar />
        <main className="dashboard-content">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;