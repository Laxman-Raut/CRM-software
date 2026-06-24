import { useState, useEffect, useMemo } from "react";
import api from "../services/api";
import {
  FaSearch,
  FaUserPlus,
  FaTimes,
  FaEnvelope,
  FaPhone,
  FaCalendarAlt,
  FaCommentAlt,
  FaTrash,
  FaEdit,
  FaFilePdf,
} from "react-icons/fa";
import Layout from "../components/Layout";
import AddLeadModal from "../components/AddLeadModal";
import { useSearch } from "../context/SearchContext";
import {
  getLeads,
  createLead,
  updateLead,
  deleteLeadById,
} from "../services/leadServices";
import "./Leads.css";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const Leads = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [leads, setLeads] = useState([]);
  const { search, setSearch } = useSearch();
  const [sortBy, setSortBy] = useState("newest");
  const [editingLead, setEditingLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

 
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Drawer state
  const [selectedLead, setSelectedLead] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [noteType, setNoteType] = useState("Note");
  const [loggingNote, setLoggingNote] = useState(false);

  const role = localStorage.getItem("role");
  const permissions = JSON.parse(localStorage.getItem("permissions") || "{}");

  const canView = role === "admin" || permissions.canViewLeads === true;
  const canUpdate = role === "admin" || permissions.canUpdateLeads === true;
  const canDelete = role === "admin" || permissions.canDeleteLeads === true;

  const fetchLeads = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await getLeads();
      const fetched = Array.isArray(response.data) ? response.data : response.data || [];
      setLeads(fetched);
      
      // Update selected lead details if drawer is open
      if (selectedLead) {
        const updated = fetched.find((l) => l._id === selectedLead._id);
        if (updated) {
          setSelectedLead(updated);
        }
      }
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || "Error fetching leads"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canView) {
      fetchLeads();
    } else {
      setLoading(false);
    }
  }, [canView]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, sortBy]);

  const addLead = async (leadData) => {
    if (!canUpdate) {
      alert("You do not have permission to create or edit leads.");
      return;
    }

    try {
      if (editingLead) {
        await updateLead(editingLead._id, leadData);
      } else {
        await createLead(leadData);
      }

      await fetchLeads();

      setEditingLead(null);
      setIsModalOpen(false);
    } catch (err) {
      alert(err.response?.data?.message || "Error saving lead.");
    }
  };

  const deleteLead = async (id) => {
    if (!canDelete) {
      alert("You do not have permission to delete leads.");
      return;
    }

    if (!window.confirm("Are you sure you want to delete this lead?")) {
      return;
    }

    try {
      await deleteLeadById(id);
      setIsDrawerOpen(false);
      setSelectedLead(null);
      await fetchLeads();
    } catch (err) {
      alert(err.response?.data?.message || "Error deleting lead.");
    }
  };

  const editLeadFromDrawer = () => {
    if (!canUpdate) {
      alert("You do not have permission to edit leads.");
      return;
    }
    setEditingLead(selectedLead);
    setIsModalOpen(true);
  };

  // Add Note directly via Drawer API
  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    try {
      setLoggingNote(true);
      const response = await api.post(
        `/leads/${selectedLead._id}/notes`,
        {
          text: newNote,
          type: noteType,
        }
      );

      // Reset note fields
      setNewNote("");
      setNoteType("Note");
      
      // Update selected lead to refresh history timeline
      setSelectedLead(response.data);
      
      // Refresh local leads list
      setLeads((prev) =>
        prev.map((l) => (l._id === response.data._id ? response.data : l))
      );
    } catch (err) {
      alert(err.response?.data?.message || "Failed to add activity log.");
    } finally {
      setLoggingNote(false);
    }
  };

  const exportToPDF = () => {
    if (!leads || leads.length === 0) {
      alert("No leads available to export.");
      return;
    }

    const doc = new jsPDF();

    // Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("CRM Leads Management Report", 14, 22);

    // Metadata
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated On: ${new Date().toLocaleString()}`, 14, 29);
    doc.text(`Total Leads: ${leads.length}`, 14, 34);

    // Format headers and data
    const tableHeaders = [["Name", "Company", "Email", "Phone", "Status", "Value (INR)"]];
    const tableData = leads.map((lead) => [
      lead.name || "",
      lead.company || "",
      lead.email || "",
      lead.phone || "",
      lead.status || "New",
      lead.value ? lead.value.toLocaleString("en-IN") : "0"
    ]);

    // Draw the table
    autoTable(doc, {
      head: tableHeaders,
      body: tableData,
      startY: 40,
      theme: "striped",
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [37, 99, 235], textColor: [255, 255, 255] }, // Royal Blue
      alternateRowStyles: { fillColor: [248, 250, 252] }, // Slate-50
    });

    // Save
    doc.save(`leads_report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const getLeadDate = (lead) => {
    const dateValue = lead.createdAt || lead.updatedAt || lead._id;
    const parsedDate = new Date(dateValue).getTime();

    return Number.isNaN(parsedDate) ? 0 : parsedDate;
  };

  const filteredLeads = leads.filter((lead) =>
    [lead.name, lead.company, lead.email, lead.phone, lead.status]
      .filter(Boolean)
      .some((value) => value.toLowerCase().includes(search.toLowerCase()))
  );

  const sortedLeads = useMemo(() => {
    return [...filteredLeads].sort((a, b) => {
      if (sortBy === "oldest") {
        return getLeadDate(a) - getLeadDate(b);
      }

      if (sortBy === "name") {
        return (a.name || "").localeCompare(b.name || "");
      }

      if (sortBy === "status") {
        return (a.status || "").localeCompare(b.status || "");
      }

      return getLeadDate(b) - getLeadDate(a);
    });
  }, [filteredLeads, sortBy]);

  // Compute pagination elements
  const totalPages = Math.ceil(sortedLeads.length / itemsPerPage);
  const paginatedLeads = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedLeads.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedLeads, currentPage]);

  const handleRowClick = (lead) => {
    setSelectedLead(lead);
    setIsDrawerOpen(true);
  };

  const getTimelineIcon = (type) => {
    switch (type) {
      case "Call":
        return <FaPhone style={{ color: "#3b82f6" }} />;
      case "Email":
        return <FaEnvelope style={{ color: "#6366f1" }} />;
      case "Meeting":
        return <FaCalendarAlt style={{ color: "#10b981" }} />;
      default:
        return <FaCommentAlt style={{ color: "#64748b" }} />;
    }
  };

  if (!canView) {
    return (
      <Layout>
        <section className="leads-page">
          <div className="leads-header">
            <div>
              <p className="leads-kicker">Access Restricted</p>
              <h1>Leads Directory</h1>
            </div>
          </div>
          <div className="leads-card" style={{ padding: "40px", textAlign: "center" }}>
            <div style={{ color: "#ef4444", fontSize: "18px", fontWeight: "700", marginBottom: "8px" }}>
              Access Denied
            </div>
            <div style={{ color: "#64748b" }}>
              You do not have permission to view lead information. Please contact your administrator.
            </div>
          </div>
        </section>
      </Layout>
    );
  }

  return (
    <>
      <Layout>
        <section className="leads-page">
          <div className="leads-header">
            <div>
              <p className="leads-kicker">CRM Directory</p>
              <h1>Leads Management</h1>
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <button
                type="button"
                onClick={exportToPDF}
                className="leads-export-btn"
                disabled={leads.length === 0}
              >
                <FaFilePdf /> Export PDF
              </button>

              {canUpdate && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingLead(null);
                    setIsModalOpen(true);
                  }}
                  className="leads-add-btn"
                >
                  <FaUserPlus /> Add Lead
                </button>
              )}
            </div>
          </div>

          <div className="leads-toolbar">
            <div className="leads-search-wrapper">
              <FaSearch aria-hidden="true" />
              <input
                type="text"
                placeholder="Search leads..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="leads-sort-select"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="name">Name A-Z</option>
              <option value="status">Status A-Z</option>
            </select>
          </div>

          {loading && <div className="leads-card leads-empty-state">Loading leads directory...</div>}

          {!loading && error && (
            <div className="leads-card leads-empty-state" style={{ color: "#ef4444" }}>
              {error}
            </div>
          )}

          {!loading && !error && (
            <div className="leads-card">
              <div className="leads-table-wrapper">
                <table className="leads-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email Address</th>
                      <th>Phone</th>
                      <th>Deal Value</th>
                      <th>Status</th>
                    </tr>
                  </thead>

                  <tbody>
                    {paginatedLeads.map((lead) => (
                      <tr key={lead._id} onClick={() => handleRowClick(lead)} className="clickable-row">
                        <td className="lead-name-cell">
                          <div style={{ fontWeight: "700" }}>{lead.name}</div>
                          {lead.company && (
                            <div style={{ fontSize: "12px", color: "#64748b", fontWeight: "500", marginTop: "2px" }}>
                              {lead.company}
                            </div>
                          )}
                        </td>
                        <td>{lead.email}</td>
                        <td>{lead.phone}</td>
                        <td className="lead-value-cell">{currencyFormatter.format(lead.value || 0)}</td>
                        <td>
                          <span className="lead-status-badge">
                            {lead.status || "New"}
                          </span>
                        </td>
                      </tr>
                    ))}

                    {paginatedLeads.length === 0 && (
                      <tr>
                        <td colSpan="5" className="leads-empty-state">
                          No leads found matching your search parameters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="leads-pagination">
                  <button
                    type="button"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((prev) => prev - 1)}
                    className="pagination-btn"
                  >
                    Previous
                  </button>
                  <span className="pagination-info">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((prev) => prev + 1)}
                    className="pagination-btn"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          )}
        </section>
      </Layout>

      {/* Slide-out Leads Detail Drawer */}
      <div className={`leads-drawer-backdrop ${isDrawerOpen ? "open" : ""}`} onClick={() => setIsDrawerOpen(false)}>
        <div className="leads-drawer" onClick={(e) => e.stopPropagation()}>
          {selectedLead && (
            <>
              {/* Drawer Header */}
              <div className="drawer-header">
                <div>
                  <span className={`lead-status-badge ${selectedLead.status?.toLowerCase() || "new"}`}>
                    {selectedLead.status || "New"}
                  </span>
                  <h2>{selectedLead.name}</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setIsDrawerOpen(false)}
                  className="drawer-close-btn"
                >
                  <FaTimes />
                </button>
              </div>

              {/* Drawer Body */}
              <div className="drawer-body">
                {/* Lead Profile Metadata */}
                <div className="drawer-section profile-meta">
                  <h3>Lead Overview</h3>
                  <div className="meta-grid">
                    {selectedLead.company && (
                      <div className="meta-item">
                        <span>Company</span>
                        <strong>{selectedLead.company}</strong>
                      </div>
                    )}
                    <div className="meta-item">
                      <span>Email</span>
                      <strong>{selectedLead.email}</strong>
                    </div>
                    <div className="meta-item">
                      <span>Phone</span>
                      <strong>{selectedLead.phone}</strong>
                    </div>
                    <div className="meta-item">
                      <span>Deal Value</span>
                      <strong className="value-high">{currencyFormatter.format(selectedLead.value || 0)}</strong>
                    </div>
                    <div className="meta-item">
                      <span>Created On</span>
                      <strong>
                        {selectedLead.createdAt
                          ? new Date(selectedLead.createdAt).toLocaleDateString()
                          : "Recently"}
                      </strong>
                    </div>
                  </div>

                  <div className="drawer-actions">
                    {canUpdate && (
                      <button
                        type="button"
                        onClick={editLeadFromDrawer}
                        className="btn-drawer-edit"
                      >
                        <FaEdit /> Edit Details
                      </button>
                    )}
                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => deleteLead(selectedLead._id)}
                        className="btn-drawer-delete"
                      >
                        <FaTrash /> Remove Lead
                      </button>
                    )}
                  </div>
                </div>

                {/* Log Activity Form */}
                {canUpdate && (
                  <div className="drawer-section note-logger">
                    <h3>Log Sales Activity</h3>
                    <form onSubmit={handleAddNote} className="logger-form">
                      <div className="logger-inputs">
                        <select
                          value={noteType}
                          onChange={(e) => setNoteType(e.target.value)}
                          className="logger-type-select"
                        >
                          <option value="Note">General Note</option>
                          <option value="Call">Call Log</option>
                          <option value="Email">Email Outbox</option>
                          <option value="Meeting">Meeting Log</option>
                        </select>
                        <input
                          type="text"
                          placeholder="Describe the interaction details..."
                          value={newNote}
                          onChange={(e) => setNewNote(e.target.value)}
                          className="logger-text-input"
                          required
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={loggingNote || !newNote.trim()}
                        className="logger-submit-btn"
                      >
                        {loggingNote ? "Logging..." : "Log Activity"}
                      </button>
                    </form>
                  </div>
                )}

                {/* Lead Activity Timeline */}
                <div className="drawer-section timeline-section">
                  <h3>Interaction History</h3>
                  {selectedLead.notes && selectedLead.notes.length > 0 ? (
                    <div className="drawer-timeline">
                      {selectedLead.notes
                        .slice()
                        .reverse()
                        .map((note) => (
                          <div className="timeline-node" key={note._id}>
                            <div className="node-icon">{getTimelineIcon(note.type)}</div>
                            <div className="node-content">
                              <div className="node-header">
                                <span className="node-author">{note.authorName || "System"}</span>
                                <span className="node-date">
                                  {note.createdAt
                                    ? new Date(note.createdAt).toLocaleString()
                                    : "Recently"}
                                </span>
                              </div>
                              <p className="node-text">{note.text}</p>
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="timeline-empty">
                      No interactions logged. Log a call, email, or meeting to populate the history stream.
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <AddLeadModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingLead(null);
        }}
        onAddLead={addLead}
        editingLead={editingLead}
      />
    </>
  );
};

export default Leads;
