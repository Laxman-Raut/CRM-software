import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

const Layout = ({ children }) => {
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
