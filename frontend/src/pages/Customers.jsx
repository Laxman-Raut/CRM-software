import { useState, useEffect, useMemo } from "react";
import api from "../services/api";
import {
  FaSearch,
  FaTimes,
  FaEnvelope,
  FaPhone,
  FaCalendarAlt,
  FaCommentAlt,
  FaTrash,
  FaEdit,
  FaFilePdf,
  FaUserCheck,
  FaBuilding,
  FaDollarSign,
  FaUsers,
  FaPlus,
  FaLock,
} from "react-icons/fa";
import Layout from "../components/Layout";
import {
  getCustomers,
  updateCustomer,
  deleteCustomerById,
  addCustomerNote,
} from "../services/customerServices";
import "./Customers.css";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

import { useSettings } from "../context/SettingsContext";

const Customers = () => {
  const { settings, formatCurrency } = useSettings();
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Drawer state
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [noteType, setNoteType] = useState("Note");
  const [loggingNote, setLoggingNote] = useState(false);

  // Editing state for drawer
  const [editingName, setEditingName] = useState("");
  const [editingCompany, setEditingCompany] = useState("");
  const [editingEmail, setEditingEmail] = useState("");
  const [editingPhone, setEditingPhone] = useState("");
  const [editingValue, setEditingValue] = useState(0);
  const [editingStatus, setEditingStatus] = useState("Active");

  const role = localStorage.getItem("role");
  const permissions = JSON.parse(localStorage.getItem("permissions") || "{}");

  const canView = role === "admin" || (permissions.canViewLeads === true && settings.allowEmployeeViewCustomers !== false);
  const canUpdate = role === "admin" || permissions.canUpdateLeads === true;
  const canDelete = role === "admin" || permissions.canDeleteLeads === true;

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await getCustomers();
      const fetched = Array.isArray(response.data) ? response.data : response.data || [];
      setCustomers(fetched);

      // Update selected customer details if drawer is open
      if (selectedCustomer) {
        const updated = fetched.find((c) => c._id === selectedCustomer._id);
        if (updated) {
          setSelectedCustomer(updated);
          setEditingName(updated.customerName || "");
          setEditingCompany(updated.company || "");
          setEditingEmail(updated.email || "");
          setEditingPhone(updated.phone || "");
          setEditingValue(updated.value || 0);
          setEditingStatus(updated.status || "Active");
        }
      }
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || "Error fetching customers"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canView) {
      fetchCustomers();
    } else {
      setLoading(false);
    }
  }, [canView]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, sortBy]);

  const saveCustomerDetails = async (e) => {
    e.preventDefault();
    if (!canUpdate) {
      alert("You do not have permission to edit customers.");
      return;
    }

    if (!editingName.trim() || !editingEmail.trim() || !editingPhone.trim()) {
      alert("Please fill in all required fields (Name, Email, Phone).");
      return;
    }

    try {
      const payload = {
        customerName: editingName,
        company: editingCompany,
        email: editingEmail,
        phone: editingPhone,
        status: editingStatus,
        value: Number(editingValue || 0),
      };

      const res = await updateCustomer(selectedCustomer._id, payload);
      setSelectedCustomer(res.data);
      setCustomers((prev) =>
        prev.map((c) => (c._id === selectedCustomer._id ? res.data : c))
      );
      alert("Customer details updated successfully!");
    } catch (err) {
      alert("Failed to update customer: " + (err.response?.data?.message || err.message));
    }
  };

  const deleteCustomer = async (id) => {
    if (!canDelete) {
      alert("You do not have permission to delete customers.");
      return;
    }

    if (!window.confirm("Are you sure you want to delete this customer?")) {
      return;
    }

    try {
      await deleteCustomerById(id);
      setIsDrawerOpen(false);
      setSelectedCustomer(null);
      await fetchCustomers();
    } catch (err) {
      alert(err.response?.data?.message || "Error deleting customer.");
    }
  };

  // Add Note directly via Drawer API
  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    try {
      setLoggingNote(true);
      const response = await addCustomerNote(selectedCustomer._id, {
        text: newNote,
        type: noteType,
      });

      setNewNote("");
      setNoteType("Note");
      setSelectedCustomer(response.data);
      setCustomers((prev) =>
        prev.map((c) => (c._id === response.data._id ? response.data : c))
      );
    } catch (err) {
      alert(err.response?.data?.message || "Failed to add activity log.");
    } finally {
      setLoggingNote(false);
    }
  };

  // Export PDF
  const exportToPDF = () => {
    if (!customers || customers.length === 0) {
      alert("No customers available to export.");
      return;
    }

    const doc = new jsPDF();

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("CRM Converted Customers Report", 14, 22);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated On: ${new Date().toLocaleString()}`, 14, 29);
    doc.text(`Total Customers: ${customers.length}`, 14, 34);

    const tableHeaders = [["Customer Name", "Company", "Email", "Phone", "Status", "Value (INR)"]];
    const tableData = customers.map((c) => [
      c.customerName || "",
      c.company || "",
      c.email || "",
      c.phone || "",
      c.status || "Active",
      c.value ? c.value.toLocaleString("en-IN") : "0",
    ]);

    autoTable(doc, {
      head: tableHeaders,
      body: tableData,
      startY: 40,
      theme: "striped",
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [16, 185, 129], textColor: [255, 255, 255] }, // Emerald / Green
      alternateRowStyles: { fillColor: [248, 250, 252] },
    });

    doc.save(`customers_report_${new Date().toISOString().split("T")[0]}.pdf`);
  };

  // Open Drawer helper
  const openDetailsDrawer = (customer) => {
    setSelectedCustomer(customer);
    setEditingName(customer.customerName || "");
    setEditingCompany(customer.company || "");
    setEditingEmail(customer.email || "");
    setEditingPhone(customer.phone || "");
    setEditingValue(customer.value || 0);
    setEditingStatus(customer.status || "Active");
    setNewNote("");
    setIsDrawerOpen(true);
  };

  // Filtered & Sorted customers
  const filteredCustomers = useMemo(() => {
    let result = [...customers];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.customerName?.toLowerCase().includes(q) ||
          c.company?.toLowerCase().includes(q) ||
          c.email?.toLowerCase().includes(q) ||
          c.phone?.toLowerCase().includes(q)
      );
    }

    if (statusFilter !== "all") {
      result = result.filter((c) => c.status === statusFilter);
    }

    result.sort((a, b) => {
      if (sortBy === "value-desc") return (b.value || 0) - (a.value || 0);
      if (sortBy === "value-asc") return (a.value || 0) - (b.value || 0);
      if (sortBy === "name") return (a.customerName || "").localeCompare(b.customerName || "");
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    return result;
  }, [customers, search, statusFilter, sortBy]);

  // Compute stats
  const stats = useMemo(() => {
    const totalCount = customers.length;
    const totalValue = customers.reduce((sum, c) => sum + Number(c.value || 0), 0);
    const activeCount = customers.filter((c) => c.status === "Active").length;
    const avgValue = totalCount ? Math.round(totalValue / totalCount) : 0;

    return {
      totalCount,
      totalValue,
      activeCount,
      avgValue,
    };
  }, [customers]);

  // Pagination
  const paginatedCustomers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredCustomers.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredCustomers, currentPage]);

  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage) || 1;

  if (loading) {
    return (
      <Layout>
        <div className="customers-loading">
          <div className="spinner"></div>
          <p>Loading customers base...</p>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="customers-error-container">
          <h2>Oops! Something went wrong</h2>
          <p>{error}</p>
          <button type="button" onClick={fetchCustomers} className="customers-retry-btn">
            Try Again
          </button>
        </div>
      </Layout>
    );
  }

  if (!loading && !canView) {
    return (
      <Layout>
        <div className="customers-error-container" style={{ color: "var(--text-secondary)" }}>
          <FaLock size={48} style={{ color: "#ef4444", marginBottom: "16px" }} />
          <h2>Access Restricted</h2>
          <p>System settings currently restrict employee access to the Customers directory.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="customers-page">
        {/* Top Header */}
        <header className="customers-header">
          <div>
            <p className="customers-kicker">Account Management</p>
            <h1>Customers Base</h1>
          </div>
          <div className="customers-actions-header">
            <button
              type="button"
              className="customers-pdf-btn"
              onClick={exportToPDF}
              disabled={customers.length === 0}
            >
              <FaFilePdf /> Export PDF
            </button>
          </div>
        </header>

        {/* Stats Row */}
        <section className="customers-stats-row" aria-label="Customer statistics">
          <div className="customers-stat-card">
            <div className="customers-stat-icon count"><FaUsers /></div>
            <div className="customers-stat-info">
              <span className="customers-stat-value">{stats.totalCount}</span>
              <span className="customers-stat-label">Total Customers</span>
            </div>
          </div>
          <div className="customers-stat-card">
            <div className="customers-stat-icon value"><FaDollarSign /></div>
            <div className="customers-stat-info">
              <span className="customers-stat-value">{formatCurrency(stats.totalValue)}</span>
              <span className="customers-stat-label">Total Portfolio Value</span>
            </div>
          </div>
          <div className="customers-stat-card">
            <div className="customers-stat-icon avg"><FaUserCheck /></div>
            <div className="customers-stat-info">
              <span className="customers-stat-value">{formatCurrency(stats.avgValue)}</span>
              <span className="customers-stat-label">Avg Account Value</span>
            </div>
          </div>
          <div className="customers-stat-card">
            <div className="customers-stat-icon active"><FaUserCheck style={{ color: "#10b981" }} /></div>
            <div className="customers-stat-info">
              <span className="customers-stat-value">{stats.activeCount}</span>
              <span className="customers-stat-label">Active Accounts</span>
            </div>
          </div>
        </section>

        {/* Search, Filters, Toolbar */}
        <section className="customers-toolbar" aria-label="Filters and Search">
          <div className="customers-search-wrapper">
            <FaSearch />
            <input
              type="search"
              placeholder="Search customers by name, company, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search customers"
            />
          </div>

          <div className="customers-filters">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="customers-select"
              aria-label="Filter by Status"
            >
              <option value="all">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="customers-select"
              aria-label="Sort options"
            >
              <option value="newest">Newest Added</option>
              <option value="value-desc">Value (High to Low)</option>
              <option value="value-asc">Value (Low to High)</option>
              <option value="name">Name (A-Z)</option>
            </select>
          </div>
        </section>

        {/* Data Table */}
        <main className="customers-table-container">
          {paginatedCustomers.length === 0 ? (
            <div className="customers-empty">
              <FaUsers size={48} className="empty-icon" />
              <h3>No Customers Found</h3>
              <p>Converted won leads automatically appear here as customers.</p>
            </div>
          ) : (
            <table className="customers-table">
              <thead>
                <tr>
                  <th>Customer Name</th>
                  <th>Company</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Portfolio Value</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedCustomers.map((customer) => (
                  <tr key={customer._id} onClick={() => openDetailsDrawer(customer)} className="clickable-row">
                    <td>
                      <div className="customer-name-cell">
                        <span className="customer-fullname">{customer.customerName}</span>
                        {customer.sourceLead && (
                          <span className="lead-converted-tag">Won Lead</span>
                        )}
                      </div>
                    </td>
                    <td>{customer.company || "—"}</td>
                    <td>{customer.email}</td>
                    <td>{customer.phone}</td>
                    <td>
                      <span className="customer-value-text">
                        {formatCurrency(customer.value || 0)}
                      </span>
                    </td>
                    <td>
                      <span className={`customer-status-badge ${customer.status?.toLowerCase() || "active"}`}>
                        {customer.status || "Active"}
                      </span>
                    </td>
                    <td>
                      <div className="customers-row-actions" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          className="action-icon-btn edit"
                          onClick={() => openDetailsDrawer(customer)}
                          title="View & Edit Details"
                        >
                          <FaEdit />
                        </button>
                        {canDelete && (
                          <button
                            type="button"
                            className="action-icon-btn delete"
                            onClick={() => deleteCustomer(customer._id)}
                            title="Delete Customer"
                          >
                            <FaTrash />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </main>

        {/* Pagination controls */}
        {filteredCustomers.length > 0 && (
          <nav className="customers-pagination" aria-label="Pagination Navigation">
            <button
              type="button"
              className="pagination-btn"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            >
              Previous
            </button>
            <span className="pagination-text">
              Page {currentPage} of {totalPages}
            </span>
            <button
              type="button"
              className="pagination-btn"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            >
              Next
            </button>
          </nav>
        )}

        {/* Sliding Details Drawer */}
        {isDrawerOpen && selectedCustomer && (
          <div className="drawer-overlay" onClick={() => setIsDrawerOpen(false)}>
            <div className="drawer-content" onClick={(e) => e.stopPropagation()}>
              <header className="drawer-header">
                <h2>Customer Details</h2>
                <button
                  type="button"
                  className="close-drawer-btn"
                  onClick={() => setIsDrawerOpen(false)}
                  aria-label="Close details"
                >
                  <FaTimes />
                </button>
              </header>

              <div className="drawer-body">
                {/* Profile header card */}
                <div className="drawer-profile-card">
                  <div className="drawer-avatar">
                    {(selectedCustomer.customerName || "C").charAt(0).toUpperCase()}
                  </div>
                  <h3>{selectedCustomer.customerName}</h3>
                  <p className="drawer-company-subtitle">
                    <FaBuilding /> {selectedCustomer.company || "No Company Specified"}
                  </p>
                </div>

                {/* Grid layout for info fields and notes */}
                <div className="drawer-details-grid">
                  {/* Left Column: Customer Form / Fields */}
                  <form onSubmit={saveCustomerDetails} className="drawer-form-section">
                    <h4>Customer Profile Info</h4>

                    <div className="form-group">
                      <label htmlFor="customerName">Full Name *</label>
                      <input
                        type="text"
                        id="customerName"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        disabled={!canUpdate}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="company">Company</label>
                      <input
                        type="text"
                        id="company"
                        value={editingCompany}
                        onChange={(e) => setEditingCompany(e.target.value)}
                        disabled={!canUpdate}
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="email">Email *</label>
                      <input
                        type="email"
                        id="email"
                        value={editingEmail}
                        onChange={(e) => setEditingEmail(e.target.value)}
                        disabled={!canUpdate}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="phone">Phone *</label>
                      <input
                        type="tel"
                        id="phone"
                        value={editingPhone}
                        onChange={(e) => setEditingPhone(e.target.value)}
                        disabled={!canUpdate}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="value">Account Value (INR)</label>
                      <input
                        type="number"
                        id="value"
                        value={editingValue}
                        onChange={(e) => setEditingValue(e.target.value)}
                        disabled={!canUpdate}
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="status">Status</label>
                      <select
                        id="status"
                        value={editingStatus}
                        onChange={(e) => setEditingStatus(e.target.value)}
                        disabled={!canUpdate}
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    </div>

                    {canUpdate && (
                      <button type="submit" className="save-details-btn">
                        Save Changes
                      </button>
                    )}
                  </form>

                  {/* Right Column: Notes & Activity Logs */}
                  <section className="drawer-notes-section">
                    <h4>Timeline & Activity Log</h4>

                    {/* Add note form */}
                    {canUpdate && (
                      <form onSubmit={handleAddNote} className="log-note-form">
                        <textarea
                          placeholder="Log an update, call details, or meeting summary..."
                          value={newNote}
                          onChange={(e) => setNewNote(e.target.value)}
                          required
                        ></textarea>
                        <div className="log-note-controls">
                          <select
                            value={noteType}
                            onChange={(e) => setNoteType(e.target.value)}
                            aria-label="Activity Type"
                          >
                            <option value="Note">📝 Note</option>
                            <option value="Call">📞 Call Log</option>
                            <option value="Email">📧 Email Sent</option>
                            <option value="Meeting">🤝 Meeting</option>
                          </select>
                          <button type="submit" className="post-note-btn" disabled={loggingNote}>
                            {loggingNote ? "Posting..." : "Log Activity"}
                          </button>
                        </div>
                      </form>
                    )}

                    {/* Timeline List */}
                    <div className="timeline-container">
                      {selectedCustomer.notes && selectedCustomer.notes.length > 0 ? (
                        [...selectedCustomer.notes].reverse().map((note, idx) => (
                          <div key={idx} className="timeline-item">
                            <div className={`timeline-marker ${note.type?.toLowerCase() || "note"}`}>
                              {note.type === "Call" && "📞"}
                              {note.type === "Email" && "📧"}
                              {note.type === "Meeting" && "🤝"}
                              {(!note.type || note.type === "Note") && "📝"}
                            </div>
                            <div className="timeline-card">
                              <p className="timeline-text">{note.text}</p>
                              <div className="timeline-meta">
                                <span>By: {note.authorName || "System"}</span>
                                {note.createdAt && (
                                  <span>
                                    {new Date(note.createdAt).toLocaleString(undefined, {
                                      dateStyle: "short",
                                      timeStyle: "short",
                                    })}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="no-notes-text">No logged activity yet.</p>
                      )}
                    </div>
                  </section>
                </div>

                {/* Section: Purchased Products & Services */}
                <div className="drawer-form-section" style={{ marginTop: "24px" }}>
                  <h4 style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span>Purchased Products & Services</span>
                    <span style={{ fontSize: "14px", color: "var(--text-secondary)" }}>
                      Total Portfolio Value: {formatCurrency(selectedCustomer.value || 0)}
                    </span>
                  </h4>
                  <div style={{ overflowX: "auto", marginTop: "12px" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", textAlign: "left" }}>
                      <thead>
                        <tr style={{ borderBottom: "1px solid var(--border-color)", color: "var(--text-secondary)" }}>
                          <th style={{ padding: "8px" }}>Product Name</th>
                          <th style={{ padding: "8px", textAlign: "center" }}>Quantity</th>
                          <th style={{ padding: "8px", textAlign: "right" }}>Unit Price</th>
                          <th style={{ padding: "8px", textAlign: "right" }}>Line Total</th>
                          <th style={{ padding: "8px", textAlign: "right" }}>Purchase Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedCustomer.purchases && selectedCustomer.purchases.length > 0 ? (
                          selectedCustomer.purchases.map((purchase, idx) => (
                            <tr key={idx} style={{ borderBottom: "1px solid var(--border-color)", color: "var(--text-primary)" }}>
                              <td style={{ padding: "8px", fontWeight: "600" }}>{purchase.name}</td>
                              <td style={{ padding: "8px", textAlign: "center" }}>{purchase.quantity}</td>
                              <td style={{ padding: "8px", textAlign: "right" }}>{formatCurrency(purchase.price)}</td>
                              <td style={{ padding: "8px", textAlign: "right" }}>{formatCurrency(purchase.quantity * purchase.price)}</td>
                              <td style={{ padding: "8px", textAlign: "right", color: "var(--text-secondary)" }}>
                                {new Date(purchase.purchaseDate).toLocaleDateString()}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} style={{ padding: "12px", textAlign: "center", color: "#94a3b8", fontStyle: "italic" }}>
                              No purchase items logged.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Customers;
