import { useState, useEffect } from "react";
import { FaTrash, FaUserPlus, FaUserShield, FaCheck, FaTimes, FaEdit, FaKey } from "react-icons/fa";
import Layout from "../components/Layout";
import api from "../services/api";
import "./Employees.css";

const ALL_PERMISSIONS = [
  {
    group: "Leads",
    perms: [
      { value: "leads:read", label: "View Leads" },
      { value: "leads:create", label: "Create Leads" },
      { value: "leads:update", label: "Update Leads" },
      { value: "leads:delete", label: "Delete Leads" }
    ]
  },
  {
    group: "Customers",
    perms: [
      { value: "customers:read", label: "View Customers" },
      { value: "customers:create", label: "Create Customers" },
      { value: "customers:update", label: "Update Customers" },
      { value: "customers:delete", label: "Delete Customers" }
    ]
  },
  {
    group: "Deals",
    perms: [
      { value: "deals:read", label: "View Deals" },
      { value: "deals:create", label: "Create Deals" },
      { value: "deals:update", label: "Update Deals" },
      { value: "deals:delete", label: "Delete Deals" }
    ]
  },
  {
    group: "Tasks",
    perms: [
      { value: "tasks:read", label: "View Tasks" },
      { value: "tasks:create", label: "Create Tasks" },
      { value: "tasks:update", label: "Update Tasks" },
      { value: "tasks:delete", label: "Delete Tasks" }
    ]
  },
  {
    group: "Administration",
    perms: [
      { value: "employees:manage", label: "Manage Employees & Roles" },
      { value: "settings:manage", label: "Manage CRM Settings" }
    ]
  },
  {
    group: "HRM (Human Resources)",
    perms: [
      { value: "attendance:read", label: "View All Attendance Logs" },
      { value: "attendance:manage", label: "Manage All Attendance Logs" }
    ]
  }
];

const Employees = () => {
  const [activeTab, setActiveTab] = useState("employees");
  const [employees, setEmployees] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Employee Modals / Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    designation: "",
    role: "Employee",
    canViewLeads: false,
    canUpdateLeads: false,
    canDeleteLeads: false,
    bankName: "",
    accountNumber: "",
    accountHolderName: "",
    ifscCode: "",
    branchName: "",
  });
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [saving, setSaving] = useState(false);

  // Role Modal / Form State
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [roleFormData, setRoleFormData] = useState({
    name: "",
    description: "",
    permissions: []
  });
  const [savingRole, setSavingRole] = useState(false);

  const fetchEmployees = async () => {
    try {
      const response = await api.get("/employees");
      setEmployees(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to load employees.");
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await api.get("/roles");
      setRoles(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error("Failed to load roles:", err);
    }
  };

  const loadData = async () => {
    setLoading(true);
    setError("");
    await Promise.all([fetchEmployees(), fetchRoles()]);
    setLoading(false);
  };

  useEffect(() => {
    let isMounted = true;
    const timer = setTimeout(() => {
      if (isMounted) {
        loadData();
      }
    }, 0);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleEditClick = (emp) => {
    setEditingEmployee(emp);
    setFormData({
      name: emp.name || "",
      email: emp.email || "",
      password: "",
      designation: emp.designation || "",
      role: emp.role || "Employee",
      canViewLeads: emp.permissions?.canViewLeads || false,
      canUpdateLeads: emp.permissions?.canUpdateLeads || false,
      canDeleteLeads: emp.permissions?.canDeleteLeads || false,
      bankName: emp.bankDetails?.bankName || "",
      accountNumber: emp.bankDetails?.accountNumber || "",
      accountHolderName: emp.bankDetails?.accountHolderName || "",
      ifscCode: emp.bankDetails?.ifscCode || "",
      branchName: emp.bankDetails?.branchName || "",
    });
    setIsModalOpen(true);
  };

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || (!editingEmployee && !formData.password)) {
      alert("Please fill all required fields.");
      return;
    }

    try {
      setSaving(true);
      const bankDetails = {
        bankName: formData.bankName,
        accountNumber: formData.accountNumber,
        accountHolderName: formData.accountHolderName,
        ifscCode: formData.ifscCode,
        branchName: formData.branchName,
      };

      if (editingEmployee) {
        await api.put(`/employees/${editingEmployee._id}`, {
          name: formData.name,
          email: formData.email,
          designation: formData.designation,
          role: formData.role,
          permissions: {
            canViewLeads: formData.canViewLeads,
            canUpdateLeads: formData.canUpdateLeads,
            canDeleteLeads: formData.canDeleteLeads,
          },
          bankDetails,
        });
      } else {
        await api.post("/employees", {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          designation: formData.designation,
          role: formData.role,
          permissions: {
            canViewLeads: formData.canViewLeads,
            canUpdateLeads: formData.canUpdateLeads,
            canDeleteLeads: formData.canDeleteLeads,
          },
          bankDetails,
        });
      }

      setFormData({
        name: "",
        email: "",
        password: "",
        designation: "",
        role: "Employee",
        canViewLeads: false,
        canUpdateLeads: false,
        canDeleteLeads: false,
        bankName: "",
        accountNumber: "",
        accountHolderName: "",
        ifscCode: "",
        branchName: "",
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

  // Roles Functions
  const handleRoleInputChange = (e) => {
    const { name, value } = e.target;
    setRoleFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRolePermissionChange = (permValue, isChecked) => {
    setRoleFormData((prev) => {
      const perms = [...prev.permissions];
      if (isChecked) {
        if (!perms.includes(permValue)) perms.push(permValue);
      } else {
        const index = perms.indexOf(permValue);
        if (index > -1) perms.splice(index, 1);
      }
      return { ...prev, permissions: perms };
    });
  };

  const handleEditRoleClick = (role) => {
    setEditingRole(role);
    setRoleFormData({
      name: role.name,
      description: role.description || "",
      permissions: role.permissions || []
    });
    setIsRoleModalOpen(true);
  };

  const handleSaveRole = async (e) => {
    e.preventDefault();
    if (!roleFormData.name) {
      alert("Role name is required.");
      return;
    }

    try {
      setSavingRole(true);
      if (editingRole) {
        await api.put(`/roles/${editingRole._id}`, roleFormData);
      } else {
        await api.post("/roles", roleFormData);
      }

      setRoleFormData({ name: "", description: "", permissions: [] });
      setEditingRole(null);
      setIsRoleModalOpen(false);
      fetchRoles();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to save role.");
    } finally {
      setSavingRole(false);
    }
  };

  const handleDeleteRole = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete role "${name}"?`)) {
      return;
    }

    try {
      await api.delete(`/roles/${id}`);
      fetchRoles();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete role.");
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
          {activeTab === "employees" ? (
            <button onClick={() => setIsModalOpen(true)} className="employees-add-btn">
              <FaUserPlus /> Add Employee
            </button>
          ) : (
            <button onClick={() => setIsRoleModalOpen(true)} className="employees-add-btn">
              <FaKey /> Create Custom Role
            </button>
          )}
        </div>

        {/* Tabs Bar */}
        <div style={{ display: "flex", gap: "12px", borderBottom: "1px solid var(--border-color)", paddingBottom: "1px" }}>
          <button
            onClick={() => setActiveTab("employees")}
            style={{
              background: "transparent",
              border: "none",
              borderBottom: activeTab === "employees" ? "2px solid #2563eb" : "none",
              color: activeTab === "employees" ? "#2563eb" : "var(--text-secondary)",
              fontWeight: "600",
              padding: "12px 18px",
              cursor: "pointer",
              fontSize: "15px"
            }}
          >
            Employees List
          </button>
          <button
            onClick={() => setActiveTab("roles")}
            style={{
              background: "transparent",
              border: "none",
              borderBottom: activeTab === "roles" ? "2px solid #2563eb" : "none",
              color: activeTab === "roles" ? "#2563eb" : "var(--text-secondary)",
              fontWeight: "600",
              padding: "12px 18px",
              cursor: "pointer",
              fontSize: "15px"
            }}
          >
            Roles & Permissions Matrix
          </button>
        </div>

        {loading && <div className="employees-state">Loading configuration data...</div>}

        {!loading && error && (
          <div className="employees-state employees-state-error">
            <strong>Could not load page data</strong>
            <span>{error}</span>
          </div>
        )}

        {!loading && !error && activeTab === "employees" && (
          <div className="employees-card">
            {employees.length > 0 ? (
              <div className="employees-table-wrapper">
                <table className="employees-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th className="text-center">View Leads Override</th>
                      <th className="text-center">Update Leads Override</th>
                      <th className="text-center">Delete Leads Override</th>
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
                              <span className="role-tag" style={{ margin: 0, background: emp.role === "admin" || emp.role === "Admin" ? "#dbeafe" : "#f1f5f9", color: emp.role === "admin" || emp.role === "Admin" ? "#2563eb" : "#475569" }}>
                                {emp.role || "Employee"}
                              </span>
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
                            disabled={emp.role === "admin" || emp.role === "Admin"}
                            onClick={() =>
                              handleTogglePermission(
                                emp._id,
                                "canViewLeads",
                                emp.permissions?.canViewLeads
                              )
                            }
                            className={`permission-btn ${
                              emp.permissions?.canViewLeads || emp.role === "admin" || emp.role === "Admin" ? "granted" : "denied"
                            }`}
                            title="Toggle View Leads Permission Override"
                          >
                            {emp.permissions?.canViewLeads || emp.role === "admin" || emp.role === "Admin" ? <FaCheck /> : <FaTimes />}
                          </button>
                        </td>
                        <td className="text-center">
                          <button
                            type="button"
                            disabled={emp.role === "admin" || emp.role === "Admin"}
                            onClick={() =>
                              handleTogglePermission(
                                emp._id,
                                "canUpdateLeads",
                                emp.permissions?.canUpdateLeads
                              )
                            }
                            className={`permission-btn ${
                              emp.permissions?.canUpdateLeads || emp.role === "admin" || emp.role === "Admin" ? "granted" : "denied"
                            }`}
                            title="Toggle Update Leads Permission Override"
                          >
                            {emp.permissions?.canUpdateLeads || emp.role === "admin" || emp.role === "Admin" ? <FaCheck /> : <FaTimes />}
                          </button>
                        </td>
                        <td className="text-center">
                          <button
                            type="button"
                            disabled={emp.role === "admin" || emp.role === "Admin"}
                            onClick={() =>
                              handleTogglePermission(
                                emp._id,
                                "canDeleteLeads",
                                emp.permissions?.canDeleteLeads
                              )
                            }
                            className={`permission-btn ${
                              emp.permissions?.canDeleteLeads || emp.role === "admin" || emp.role === "Admin" ? "granted" : "denied"
                            }`}
                            title="Toggle Delete Leads Permission Override"
                          >
                            {emp.permissions?.canDeleteLeads || emp.role === "admin" || emp.role === "Admin" ? <FaCheck /> : <FaTimes />}
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
                              disabled={emp.role === "admin" || emp.role === "Admin"}
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

        {/* Roles Tab */}
        {!loading && !error && activeTab === "roles" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "20px" }}>
            {roles.map((r) => (
              <div key={r._id} className="employees-card" style={{ display: "flex", flexDirection: "column", justifyContent: "between", position: "relative" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                  <div>
                    <h3 style={{ margin: "0 0 6px 0", display: "flex", alignItems: "center", gap: "8px" }}>
                      {r.name}
                      {r.isSystem && (
                        <span style={{ fontSize: "10px", background: "#fef3c7", color: "#d97706", padding: "2px 6px", borderRadius: "10px", fontWeight: "600" }}>
                          System Role
                        </span>
                      )}
                    </h3>
                    <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 16px 0" }}>
                      {r.description || "No description provided."}
                    </p>
                  </div>
                </div>

                <div style={{ flexGrow: 1 }}>
                  <strong style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em", color: "#475569" }}>
                    Granted Permissions ({r.permissions?.length || 0})
                  </strong>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "8px" }}>
                    {r.name.toLowerCase() === "admin" ? (
                      <span style={{ fontSize: "11px", background: "#ecfdf5", color: "#059669", padding: "4px 8px", borderRadius: "4px", fontWeight: "500" }}>
                        All Permissions (Wildcard)
                      </span>
                    ) : r.permissions && r.permissions.length > 0 ? (
                      r.permissions.map((p) => (
                        <span key={p} style={{ fontSize: "11px", background: "#f8fafc", border: "1px solid #e2e8f0", color: "#475569", padding: "2px 6px", borderRadius: "4px" }}>
                          {p}
                        </span>
                      ))
                    ) : (
                      <span style={{ fontSize: "11px", color: "#ef4444", fontStyle: "italic" }}>
                        No permissions assigned
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "end", gap: "10px", borderTop: "1px solid #f1f5f9", marginTop: "16px", paddingTop: "12px" }}>
                  {r.name.toLowerCase() !== "admin" && (
                    <button
                      onClick={() => handleEditRoleClick(r)}
                      style={{
                        background: "transparent",
                        border: "1px solid #cbd5e1",
                        color: "#475569",
                        padding: "6px 12px",
                        borderRadius: "6px",
                        fontSize: "12px",
                        fontWeight: "600",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px"
                      }}
                    >
                      <FaEdit /> Edit Permissions
                    </button>
                  )}
                  {!r.isSystem && (
                    <button
                      onClick={() => handleDeleteRole(r._id, r.name)}
                      style={{
                        background: "#fee2e2",
                        border: "none",
                        color: "#ef4444",
                        padding: "6px 12px",
                        borderRadius: "6px",
                        fontSize: "12px",
                        fontWeight: "600",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px"
                      }}
                    >
                      <FaTrash /> Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create/Edit Employee Modal */}
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

                <div className="form-group">
                  <label htmlFor="emp-role">Assigned Role *</label>
                  <select
                    id="emp-role"
                    name="role"
                    value={formData.role || "Employee"}
                    onChange={handleInputChange}
                    required
                    style={{
                      width: "100%",
                      padding: "10px",
                      borderRadius: "6px",
                      border: "1px solid var(--border-color)",
                      background: "var(--panel-bg)",
                      color: "var(--text-primary)"
                    }}
                  >
                    {roles.map((r) => (
                      <option key={r._id} value={r.name}>{r.name}</option>
                    ))}
                  </select>
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
                    <h3>Initial Permission Overrides</h3>
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
                        <span>Can Update Leads</span>
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

                {/* Banking details section in employee creation/editing */}
                <div style={{
                  gridColumn: "1 / -1",
                  borderTop: "1px solid var(--border-color)",
                  marginTop: "16px",
                  paddingTop: "16px"
                }}>
                  <h3 style={{ fontSize: "14px", fontWeight: "600", marginBottom: "12px", color: "var(--text-primary)" }}>
                    Banking Details (Optional)
                  </h3>
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "12px"
                  }}>
                    <div className="form-group">
                      <label htmlFor="emp-bank-holder">Account Holder Name</label>
                      <input
                        id="emp-bank-holder"
                        type="text"
                        name="accountHolderName"
                        placeholder="Enter account holder name"
                        value={formData.accountHolderName || ""}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="emp-bank-name">Bank Name</label>
                      <input
                        id="emp-bank-name"
                        type="text"
                        name="bankName"
                        placeholder="e.g. Chase Bank"
                        value={formData.bankName || ""}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="emp-bank-account">Account Number</label>
                      <input
                        id="emp-bank-account"
                        type="text"
                        name="accountNumber"
                        placeholder="Enter account number"
                        value={formData.accountNumber || ""}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="emp-bank-ifsc">IFSC / Routing Code</label>
                      <input
                        id="emp-bank-ifsc"
                        type="text"
                        name="ifscCode"
                        placeholder="Enter bank code"
                        value={formData.ifscCode || ""}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                      <label htmlFor="emp-bank-branch">Branch Name</label>
                      <input
                        id="emp-bank-branch"
                        type="text"
                        name="branchName"
                        placeholder="Enter bank branch location"
                        value={formData.branchName || ""}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                </div>

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

        {/* Create/Edit Role Modal */}
        {isRoleModalOpen && (
          <div className="employees-modal-backdrop">
            <div className="employees-modal" style={{ maxWidth: "650px" }}>
              <div className="modal-header">
                <h2>{editingRole ? `Edit Role: ${editingRole.name}` : "Create Custom Role"}</h2>
                <button
                  type="button"
                  onClick={() => {
                    setIsRoleModalOpen(false);
                    setEditingRole(null);
                  }}
                  className="modal-close-btn"
                >
                  &times;
                </button>
              </div>

              <form onSubmit={handleSaveRole} className="modal-form">
                <div className="form-group">
                  <label htmlFor="role-name">Role Name *</label>
                  <input
                    id="role-name"
                    type="text"
                    name="name"
                    placeholder="e.g. Sales Representative"
                    value={roleFormData.name}
                    onChange={handleRoleInputChange}
                    required
                    disabled={editingRole && editingRole.isSystem}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="role-desc">Role Description</label>
                  <textarea
                    id="role-desc"
                    name="description"
                    rows="2"
                    placeholder="Briefly describe what responsibilities this role has..."
                    value={roleFormData.description}
                    onChange={handleRoleInputChange}
                    style={{
                      width: "100%",
                      padding: "10px",
                      borderRadius: "6px",
                      border: "1px solid var(--border-color)",
                      background: "var(--panel-bg)",
                      color: "var(--text-primary)",
                      fontFamily: "inherit"
                    }}
                  />
                </div>

                <div className="form-permissions-section" style={{ borderTop: "1px solid var(--border-color)", paddingTop: "16px", marginTop: "16px" }}>
                  <h3 style={{ margin: "0 0 12px 0" }}>Configure Permissions</h3>
                  
                  {ALL_PERMISSIONS.map((groupObj) => (
                    <div key={groupObj.group} style={{ marginBottom: "16px" }}>
                      <h4 style={{ margin: "0 0 6px 0", color: "#475569", fontSize: "13px", textTransform: "uppercase" }}>
                        {groupObj.group}
                      </h4>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                        {groupObj.perms.map((p) => (
                          <label key={p.value} className="checkbox-label" style={{ display: "flex", gap: "8px", fontSize: "13px" }}>
                            <input
                              type="checkbox"
                              checked={roleFormData.permissions.includes(p.value)}
                              onChange={(e) => handleRolePermissionChange(p.value, e.target.checked)}
                            />
                            <span>{p.label} <code style={{ color: "#94a3b8", fontSize: "11px" }}>({p.value})</code></span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="modal-actions">
                  <button
                    type="button"
                    onClick={() => {
                      setIsRoleModalOpen(false);
                      setEditingRole(null);
                    }}
                    className="modal-cancel-btn"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingRole}
                    className="modal-submit-btn"
                  >
                    {savingRole ? "Saving..." : editingRole ? "Save Changes" : "Create Role"}
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
