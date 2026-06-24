import { useState, useEffect } from "react";
import { FaTrash, FaUserPlus, FaUserShield, FaCheck, FaTimes, FaEdit } from "react-icons/fa";
import Layout from "../components/Layout";
import api from "../services/api";
import "./Employees.css";

const Employees = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    designation: "",
    canViewLeads: false,
    canUpdateLeads: false,
    canDeleteLeads: false,
  });

  const [editingEmployee, setEditingEmployee] = useState(null);

  const handleEditClick = (emp) => {
    setEditingEmployee(emp);
    setFormData({
      name: emp.name || "",
      email: emp.email || "",
      password: "", // password not needed for editing
      designation: emp.designation || "",
      canViewLeads: emp.permissions?.canViewLeads || false,
      canUpdateLeads: emp.permissions?.canUpdateLeads || false,
      canDeleteLeads: emp.permissions?.canDeleteLeads || false,
    });
    setIsModalOpen(true);
  };

  const [saving, setSaving] = useState(false);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await api.get("/employees");
      setEmployees(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || "Failed to load employees."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || (!editingEmployee && !formData.password)) {
      alert("Please fill all required fields.");
      return;
    }

    try {
      setSaving(true);
      if (editingEmployee) {
        // Edit flow: call PUT /employees/:id
        await api.put(`/employees/${editingEmployee._id}`, {
          name: formData.name,
          email: formData.email,
          designation: formData.designation,
        });
      } else {
        // Creation flow: call POST /employees
        await api.post("/employees", {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          designation: formData.designation,
          permissions: {
            canViewLeads: formData.canViewLeads,
            canUpdateLeads: formData.canUpdateLeads,
            canDeleteLeads: formData.canDeleteLeads,
          },
        });
      }

      // Reset form
      setFormData({
        name: "",
        email: "",
        password: "",
        designation: "",
        canViewLeads: false,
        canUpdateLeads: false,
        canDeleteLeads: false,
      });

      setEditingEmployee(null);
      setIsModalOpen(false);
      fetchEmployees();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to save employee.");
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePermission = async (id, permissionKey, currentValue) => {
    try {
      await api.put(`/employees/${id}/permissions`, {
        permissions: {
          [permissionKey]: !currentValue,
        },
      });

      // Update state locally
      setEmployees((prev) =>
        prev.map((emp) =>
          emp._id === id
            ? {
                ...emp,
                permissions: {
                  ...emp.permissions,
                  [permissionKey]: !currentValue,
                },
              }
            : emp
        )
      );
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update permission.");
    }
  };

  const handleDeleteEmployee = async (id, name) => {
    if (!window.confirm(`Are you sure you want to remove employee "${name}"?`)) {
      return;
    }

    try {
      await api.delete(`/employees/${id}`);
      setEmployees((prev) => prev.filter((emp) => emp._id !== id));
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete employee.");
    }
  };

  return (
    <Layout>
      <section className="employees-page">
        <div className="employees-header">
          <div>
            <p className="employees-kicker">Manage Access</p>
            <h1>Employees & Permissions</h1>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="employees-add-btn"
          >
            <FaUserPlus /> Add Employee
          </button>
        </div>

        {loading && <div className="employees-state">Loading employees list...</div>}

        {!loading && error && (
          <div className="employees-state employees-state-error">
            <strong>Could not load page data</strong>
            <span>{error}</span>
          </div>
        )}

        {!loading && !error && (
          <div className="employees-card">
            {employees.length > 0 ? (
              <div className="employees-table-wrapper">
                <table className="employees-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th className="text-center">View Leads</th>
                      <th className="text-center">Update Leads</th>
                      <th className="text-center">Delete Leads</th>
                      <th className="text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employees.map((emp) => (
                      <tr key={emp._id}>
                        <td>
                          <div className="employee-info-cell">
                            <strong>{emp.name || "Unnamed"}</strong>
                            <div style={{ display: "flex", gap: "6px", alignItems: "center", marginTop: "2px" }}>
                              <span className="role-tag" style={{ margin: 0 }}>{emp.role || "Employee"}</span>
                              {emp.designation && (
                                <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "500" }}>
                                  • {emp.designation}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td>{emp.email}</td>
                        <td className="text-center">
                          <button
                            type="button"
                            onClick={() =>
                              handleTogglePermission(
                                emp._id,
                                "canViewLeads",
                                emp.permissions?.canViewLeads
                              )
                            }
                            className={`permission-btn ${
                              emp.permissions?.canViewLeads ? "granted" : "denied"
                            }`}
                            title="Toggle View Leads Permission"
                          >
                            {emp.permissions?.canViewLeads ? <FaCheck /> : <FaTimes />}
                          </button>
                        </td>
                        <td className="text-center">
                          <button
                            type="button"
                            onClick={() =>
                              handleTogglePermission(
                                emp._id,
                                "canUpdateLeads",
                                emp.permissions?.canUpdateLeads
                              )
                            }
                            className={`permission-btn ${
                              emp.permissions?.canUpdateLeads ? "granted" : "denied"
                            }`}
                            title="Toggle Update Leads Permission"
                          >
                            {emp.permissions?.canUpdateLeads ? <FaCheck /> : <FaTimes />}
                          </button>
                        </td>
                        <td className="text-center">
                          <button
                            type="button"
                            onClick={() =>
                              handleTogglePermission(
                                emp._id,
                                "canDeleteLeads",
                                emp.permissions?.canDeleteLeads
                              )
                            }
                            className={`permission-btn ${
                              emp.permissions?.canDeleteLeads ? "granted" : "denied"
                            }`}
                            title="Toggle Delete Leads Permission"
                          >
                            {emp.permissions?.canDeleteLeads ? <FaCheck /> : <FaTimes />}
                          </button>
                        </td>
                        <td className="text-center">
                          <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
                            <button
                              type="button"
                              onClick={() => handleEditClick(emp)}
                              className="employee-edit-btn"
                              title="Edit Employee"
                              style={{
                                background: "transparent",
                                border: "1px solid #cbd5e1",
                                color: "#475569",
                                width: "32px",
                                height: "32px",
                                borderRadius: "6px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: "pointer",
                                transition: "all 0.15s ease"
                              }}
                            >
                              <FaEdit />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteEmployee(emp._id, emp.name)}
                              className="employee-delete-btn"
                              title="Delete Employee"
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="employees-empty">
                <FaUserShield size={48} className="empty-icon" />
                <h3>No Employees Registered Yet</h3>
                <p>Add employees to grant them access to the mini-CRM pipeline.</p>
                <button onClick={() => setIsModalOpen(true)} className="btn-secondary">
                  Add First Employee
                </button>
              </div>
            )}
          </div>
        )}

        {/* Create Employee Modal */}
        {isModalOpen && (
          <div className="employees-modal-backdrop">
            <div className="employees-modal">
              <div className="modal-header">
                <h2>{editingEmployee ? "Edit Employee Details" : "Add New Employee"}</h2>
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingEmployee(null);
                  }}
                  className="modal-close-btn"
                >
                  &times;
                </button>
              </div>

              <form onSubmit={handleAddEmployee} className="modal-form">
                <div className="form-group">
                  <label htmlFor="emp-name">Full Name *</label>
                  <input
                    id="emp-name"
                    type="text"
                    name="name"
                    placeholder="Enter full name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="emp-email">Email Address *</label>
                  <input
                    id="emp-email"
                    type="email"
                    name="email"
                    placeholder="name@company.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="emp-designation">Designation</label>
                  <input
                    id="emp-designation"
                    type="text"
                    name="designation"
                    placeholder="e.g. Sales Executive, Manager"
                    value={formData.designation}
                    onChange={handleInputChange}
                  />
                </div>

                {!editingEmployee && (
                  <div className="form-group">
                    <label htmlFor="emp-pass">Temporary Password *</label>
                    <input
                      id="emp-pass"
                      type="password"
                      name="password"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                )}

                {!editingEmployee && (
                  <div className="form-permissions-section">
                    <h3>Initial Permissions</h3>
                    <div className="permissions-checkboxes">
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          name="canViewLeads"
                          checked={formData.canViewLeads}
                          onChange={handleInputChange}
                        />
                        <span>Can View Leads</span>
                      </label>
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          name="canUpdateLeads"
                          checked={formData.canUpdateLeads}
                          onChange={handleInputChange}
                        />
                        <span>Can Update Leads (Create & Edit)</span>
                      </label>
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          name="canDeleteLeads"
                          checked={formData.canDeleteLeads}
                          onChange={handleInputChange}
                        />
                        <span>Can Delete Leads</span>
                      </label>
                    </div>
                  </div>
                )}

                <div className="modal-actions">
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      setEditingEmployee(null);
                    }}
                    className="modal-cancel-btn"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="modal-submit-btn"
                  >
                    {saving ? "Saving..." : editingEmployee ? "Update Employee" : "Save Employee"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </section>
    </Layout>
  );
};

export default Employees;
