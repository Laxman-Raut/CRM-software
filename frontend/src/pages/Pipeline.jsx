import { useEffect, useMemo, useState } from "react";
import {
  FaArrowLeft,
  FaArrowRight,
  FaEnvelope,
  FaPhone,
  FaSearch,
  FaSyncAlt,
  FaProjectDiagram,
  FaTimes,
  FaDollarSign,
  FaTrophy,
  FaCheck,
  FaCommentAlt,
  FaCalendarAlt,
  FaBriefcase
} from "react-icons/fa";
import Layout from "../components/Layout";
import api from "../services/api";
import "./Pipeline.css";

const STAGES = ["New", "Contacted", "Qualified", "Won", "Lost"];

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const Pipeline = () => {
  const [leads, setLeads] = useState([]);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState("");

  // Drawer / details modal state
  const [selectedLead, setSelectedLead] = useState(null);
  const [editingName, setEditingName] = useState("");
  const [editingCompany, setEditingCompany] = useState("");
  const [editingEmail, setEditingEmail] = useState("");
  const [editingPhone, setEditingPhone] = useState("");
  const [editingValue, setEditingValue] = useState(0);
  const [editingStatus, setEditingStatus] = useState("New");
  const [newNoteText, setNewNoteText] = useState("");
  const [newNoteType, setNewNoteType] = useState("Note");
  const [loggingNote, setLoggingNote] = useState(false);

  const role = localStorage.getItem("role");
  const permissions = JSON.parse(localStorage.getItem("permissions") || "{}");
  const canUpdate = role === "admin" || permissions.canUpdateLeads === true;

  const fetchLeads = async () => {
    try {
      setError("");
      const response = await api.get("/leads");
      setLeads(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Unable to load pipeline");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  // Compute global stats
  const stats = useMemo(() => {
    const totalCount = leads.length;
    const totalValue = leads.reduce((sum, lead) => sum + Number(lead.value || 0), 0);
    const activeDeals = leads.filter(
      (l) => l.status !== "Won" && l.status !== "Lost"
    ).length;
    const wonCount = leads.filter((l) => l.status === "Won").length;
    const winRate = totalCount ? Math.round((wonCount / totalCount) * 100) : 0;
    const avgValue = totalCount ? Math.round(totalValue / totalCount) : 0;

    return {
      totalValue,
      activeDeals,
      winRate,
      avgValue,
    };
  }, [leads]);

  // Filter leads by search query
  const searchedLeads = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return leads;

    return leads.filter((lead) =>
      [lead.name, lead.company, lead.email, lead.phone, lead.status]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query))
    );
  }, [leads, search]);

  // Sort and group leads by stage
  const leadsByStage = useMemo(() => {
    // Initialise grouped object
    const groups = STAGES.reduce((acc, stage) => {
      acc[stage] = [];
      return acc;
    }, {});

    // Sort leads first
    const sorted = [...searchedLeads].sort((a, b) => {
      if (sortBy === "value-desc") {
        return Number(b.value || 0) - Number(a.value || 0);
      }
      if (sortBy === "value-asc") {
        return Number(a.value || 0) - Number(b.value || 0);
      }
      if (sortBy === "name") {
        return (a.name || "").localeCompare(b.name || "");
      }
      // newest
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });

    // Distribute into stages
    sorted.forEach((lead) => {
      const stage = lead.status || "New";
      if (groups[stage]) {
        groups[stage].push(lead);
      }
    });

    return groups;
  }, [searchedLeads, sortBy]);

  // Compute stage aggregates (deal totals)
  const stageValues = useMemo(() => {
    return STAGES.reduce((acc, stage) => {
      const stageLeads = leadsByStage[stage] || [];
      acc[stage] = stageLeads.reduce((sum, l) => sum + Number(l.value || 0), 0);
      return acc;
    }, {});
  }, [leadsByStage]);

  // Move lead left/right
  const moveLead = async (lead, direction, e) => {
    if (e) e.stopPropagation();
    
    if (!canUpdate) {
      alert("You do not have permission to modify leads.");
      return;
    }

    const currentIndex = STAGES.indexOf(lead.status || "New");
    const nextStage = STAGES[currentIndex + direction];

    if (!nextStage || updatingId) {
      return;
    }

    try {
      setUpdatingId(lead._id);
      const payload = {
        name: lead.name,
        company: lead.company || "",
        email: lead.email,
        phone: lead.phone,
        status: nextStage,
        value: lead.value || 0
      };

      await api.put(`/leads/${lead._id}`, payload);

      setLeads((currentLeads) =>
        currentLeads.map((item) =>
          item._id === lead._id ? { ...item, status: nextStage } : item
        )
      );

      // If drawer is open and matches this lead, sync its status
      if (selectedLead && selectedLead._id === lead._id) {
        setEditingStatus(nextStage);
        setSelectedLead(prev => ({ ...prev, status: nextStage }));
      }

    } catch (err) {
      alert(err.response?.data?.message || err.message || "Unable to update lead");
    } finally {
      setUpdatingId("");
    }
  };

  // Open lead details drawer
  const handleLeadClick = (lead) => {
    setSelectedLead(lead);
    setEditingName(lead.name || "");
    setEditingCompany(lead.company || "");
    setEditingEmail(lead.email || "");
    setEditingPhone(lead.phone || "");
    setEditingValue(lead.value || 0);
    setEditingStatus(lead.status || "New");
    setNewNoteText("");
  };

  // Save deal value and status changes
  const handleSaveDetails = async (e) => {
    e.preventDefault();
    if (!canUpdate) {
      alert("You do not have permission to modify leads.");
      return;
    }

    if (!editingName.trim() || !editingEmail.trim() || !editingPhone.trim()) {
      alert("Please fill in all required fields (Name, Email, Phone).");
      return;
    }

    try {
      const payload = {
        name: editingName,
        company: editingCompany,
        email: editingEmail,
        phone: editingPhone,
        status: editingStatus,
        value: Number(editingValue || 0)
      };

      const res = await api.put(`/leads/${selectedLead._id}`, payload);
      
      // Update local states
      setSelectedLead(res.data);
      setLeads((prev) =>
        prev.map((l) => (l._id === selectedLead._id ? res.data : l))
      );
      
      alert("Deal details saved successfully!");
    } catch (err) {
      alert("Failed to update deal: " + (err.response?.data?.message || err.message));
    }
  };

  // Log activity note
  const handleLogNote = async (e) => {
    e.preventDefault();
    if (!canUpdate) {
      alert("You do not have permission to modify leads.");
      return;
    }
    if (!newNoteText.trim()) return;

    try {
      setLoggingNote(true);
      const res = await api.post(`/leads/${selectedLead._id}/notes`, {
        text: newNoteText,
        type: newNoteType,
      });

      setSelectedLead(res.data);
      setLeads((prev) =>
        prev.map((l) => (l._id === selectedLead._id ? res.data : l))
      );
      setNewNoteText("");
    } catch (err) {
      alert("Failed to log activity: " + (err.response?.data?.message || err.message));
    } finally {
      setLoggingNote(false);
    }
  };

  return (
    <Layout>
      <section className="pipeline-page">
        {/* Header Title */}
        <div className="pipeline-header">
          <div>
            <p className="pipeline-kicker">Sales Flow</p>
            <h1>Sales Pipeline</h1>
          </div>
          <button type="button" className="pipeline-refresh" onClick={fetchLeads}>
            <FaSyncAlt aria-hidden="true" /> Refresh
          </button>
        </div>

        {/* Stats Row */}
        {!loading && !error && (
          <section className="pipeline-stats-row">
            <div className="pipeline-stat-card">
              <div className="pipeline-stat-icon total-val"><FaDollarSign /></div>
              <div className="pipeline-stat-info">
                <span className="pipeline-stat-value">{currencyFormatter.format(stats.totalValue)}</span>
                <span className="pipeline-stat-label">Total Pipeline Value</span>
              </div>
            </div>
            <div className="pipeline-stat-card">
              <div className="pipeline-stat-icon active-deals"><FaBriefcase /></div>
              <div className="pipeline-stat-info">
                <span className="pipeline-stat-value">{stats.activeDeals}</span>
                <span className="pipeline-stat-label">Active Deals</span>
              </div>
            </div>
            <div className="pipeline-stat-card">
              <div className="pipeline-stat-icon win-rate"><FaTrophy /></div>
              <div className="pipeline-stat-info">
                <span className="pipeline-stat-value">{stats.winRate}%</span>
                <span className="pipeline-stat-label">Win Rate</span>
              </div>
            </div>
            <div className="pipeline-stat-card">
              <div className="pipeline-stat-icon avg-val"><FaCheck /></div>
              <div className="pipeline-stat-info">
                <span className="pipeline-stat-value">{currencyFormatter.format(stats.avgValue)}</span>
                <span className="pipeline-stat-label">Avg. Deal Size</span>
              </div>
            </div>
          </section>
        )}

        {/* Toolbar Controls */}
        <div className="pipeline-toolbar">
          <div className="pipeline-search-box">
            <FaSearch aria-hidden="true" />
            <input
              type="search"
              placeholder="Search leads in pipeline..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <div className="pipeline-sort-box">
            <select
              className="pipeline-sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="newest">Newest Leads</option>
              <option value="name">Lead Name (A-Z)</option>
              <option value="value-desc">Value (High to Low)</option>
              <option value="value-asc">Value (Low to High)</option>
            </select>
          </div>
        </div>

        {/* Board View */}
        {loading ? (
          <div className="pipeline-state">Loading sales pipeline...</div>
        ) : error ? (
          <div className="pipeline-state pipeline-state-error">{error}</div>
        ) : (
          <div className="pipeline-board">
            {STAGES.map((stage) => (
              <section className="pipeline-column" key={stage}>
                <div className="pipeline-column-header">
                  <div className="pipeline-column-info">
                    <span className="pipeline-column-title">{stage}</span>
                    <span className="pipeline-column-value">
                      {currencyFormatter.format(stageValues[stage] || 0)}
                    </span>
                  </div>
                  <span className="pipeline-column-count">
                    {(leadsByStage[stage] || []).length}
                  </span>
                </div>

                <div className="pipeline-cards">
                  {(leadsByStage[stage] || []).map((lead) => {
                    const stageIndex = STAGES.indexOf(lead.status || "New");
                    const isUpdating = updatingId === lead._id;
                    const notesCount = lead.notes?.length || 0;

                    return (
                      <article 
                        className={`pipeline-card stage-${(lead.status || "New").toLowerCase()}`} 
                        key={lead._id}
                        onClick={() => handleLeadClick(lead)}
                      >
                        <div className="pipeline-card-header">
                          <div>
                            <strong className="pipeline-card-name">{lead.name || "Unnamed lead"}</strong>
                            {lead.company && (
                              <div style={{ fontSize: "11px", color: "#64748b", fontWeight: "500", marginTop: "1px" }}>
                                {lead.company}
                              </div>
                            )}
                          </div>
                          <span className="pipeline-card-value-badge">
                            {currencyFormatter.format(lead.value || 0)}
                          </span>
                        </div>

                        {lead.email && (
                          <p>
                            <FaEnvelope aria-hidden="true" />
                            {lead.email}
                          </p>
                        )}

                        {lead.phone && (
                          <p>
                            <FaPhone aria-hidden="true" />
                            {lead.phone}
                          </p>
                        )}

                        <div className="pipeline-card-footer">
                          <span className="pipeline-card-notes-badge" title="Logged activities">
                            <FaCommentAlt /> {notesCount} {notesCount === 1 ? "note" : "notes"}
                          </span>

                          <div className="pipeline-card-actions" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={(e) => moveLead(lead, -1, e)}
                              disabled={stageIndex <= 0 || isUpdating || !canUpdate}
                              title="Move backward"
                            >
                              <FaArrowLeft aria-hidden="true" />
                            </button>

                            <button
                              type="button"
                              onClick={(e) => moveLead(lead, 1, e)}
                              disabled={stageIndex >= STAGES.length - 1 || isUpdating || !canUpdate}
                              title="Move forward"
                            >
                              <FaArrowRight aria-hidden="true" />
                            </button>
                          </div>
                        </div>
                      </article>
                    );
                  })}

                  {(leadsByStage[stage] || []).length === 0 && (
                    <div className="pipeline-empty">No leads in this stage.</div>
                  )}
                </div>
              </section>
            ))}
          </div>
        )}

        {/* Lead Details Slide-out Drawer */}
        {selectedLead && (
          <div className="pipeline-drawer-backdrop" onClick={() => setSelectedLead(null)}>
            <div className="pipeline-drawer" onClick={(e) => e.stopPropagation()}>
              <div className="pipeline-drawer-header">
                <h2>Deal Management</h2>
                <button className="pipeline-drawer-close" onClick={() => setSelectedLead(null)}>
                  <FaTimes />
                </button>
              </div>

              <div className="pipeline-drawer-content">
                {/* Section 1: Lead Information details */}
                <div className="pipeline-drawer-section">
                  <h3>Lead Contact Details</h3>
                  <div className="pipeline-lead-fields">
                    <div className="pipeline-lead-field-row">
                      <span className="pipeline-lead-field-label">Name:</span>
                      <span className="pipeline-lead-field-value">{selectedLead.name}</span>
                    </div>
                    {selectedLead.company && (
                      <div className="pipeline-lead-field-row">
                        <span className="pipeline-lead-field-label">Company:</span>
                        <span className="pipeline-lead-field-value">{selectedLead.company}</span>
                      </div>
                    )}
                    <div className="pipeline-lead-field-row">
                      <span className="pipeline-lead-field-label">Email:</span>
                      <span className="pipeline-lead-field-value">{selectedLead.email}</span>
                    </div>
                    <div className="pipeline-lead-field-row">
                      <span className="pipeline-lead-field-label">Phone:</span>
                      <span className="pipeline-lead-field-value">{selectedLead.phone}</span>
                    </div>
                  </div>
                </div>

                {/* Section 2: Edit Deal Details, Value & Stage Status */}
                <div className="pipeline-drawer-section">
                  <h3>Edit Lead Details</h3>
                  <form onSubmit={handleSaveDetails} className="pipeline-drawer-form">
                    <div className="pipeline-form-group">
                      <label htmlFor="edit-deal-name">Name *</label>
                      <input
                        type="text"
                        id="edit-deal-name"
                        className="pipeline-form-input"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        required
                        disabled={!canUpdate}
                      />
                    </div>

                    <div className="pipeline-form-group">
                      <label htmlFor="edit-deal-company">Company Name</label>
                      <input
                        type="text"
                        id="edit-deal-company"
                        className="pipeline-form-input"
                        value={editingCompany}
                        onChange={(e) => setEditingCompany(e.target.value)}
                        disabled={!canUpdate}
                      />
                    </div>

                    <div className="pipeline-form-group">
                      <label htmlFor="edit-deal-email">Email Address *</label>
                      <input
                        type="email"
                        id="edit-deal-email"
                        className="pipeline-form-input"
                        value={editingEmail}
                        onChange={(e) => setEditingEmail(e.target.value)}
                        required
                        disabled={!canUpdate}
                      />
                    </div>

                    <div className="pipeline-form-group">
                      <label htmlFor="edit-deal-phone">Phone Number *</label>
                      <input
                        type="text"
                        id="edit-deal-phone"
                        className="pipeline-form-input"
                        value={editingPhone}
                        onChange={(e) => setEditingPhone(e.target.value)}
                        required
                        disabled={!canUpdate}
                      />
                    </div>

                    <div className="pipeline-form-group">
                      <label htmlFor="edit-deal-value">Deal Value (INR) *</label>
                      <input
                        type="number"
                        id="edit-deal-value"
                        className="pipeline-form-input"
                        value={editingValue}
                        onChange={(e) => setEditingValue(e.target.value)}
                        required
                        disabled={!canUpdate}
                      />
                    </div>

                    <div className="pipeline-form-group">
                      <label htmlFor="edit-deal-stage">Pipeline Stage</label>
                      <select
                        id="edit-deal-stage"
                        className="pipeline-form-select"
                        value={editingStatus}
                        onChange={(e) => setEditingStatus(e.target.value)}
                        disabled={!canUpdate}
                      >
                        {STAGES.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>

                    {canUpdate && (
                      <button type="submit" className="pipeline-note-submit-btn" style={{ background: "#2563eb" }}>
                        Save Deal Details
                      </button>
                    )}
                  </form>
                </div>

                {/* Section 3: Log New Activity */}
                {canUpdate && (
                  <div className="pipeline-drawer-section">
                    <h3>Log Activity / Note</h3>
                    <form onSubmit={handleLogNote} className="pipeline-drawer-form">
                      <textarea
                        className="pipeline-note-input"
                        placeholder="Write note or details here..."
                        value={newNoteText}
                        onChange={(e) => setNewNoteText(e.target.value)}
                        required
                      />

                      <div className="pipeline-note-type-row">
                        {["Note", "Call", "Email", "Meeting"].map((type) => (
                          <button
                            type="button"
                            key={type}
                            className={`pipeline-note-type-btn ${newNoteType === type ? "active" : ""}`}
                            onClick={() => setNewNoteType(type)}
                          >
                            {type}
                          </button>
                        ))}
                      </div>

                      <button type="submit" className="pipeline-note-submit-btn" disabled={loggingNote}>
                        {loggingNote ? "Logging..." : "Log Note"}
                      </button>
                    </form>
                  </div>
                )}

                {/* Section 4: Chronological activity timeline history */}
                <div className="pipeline-drawer-section">
                  <h3>Activity History</h3>
                  {selectedLead.notes && selectedLead.notes.length > 0 ? (
                    <div className="pipeline-notes-timeline">
                      {[...selectedLead.notes].reverse().map((note) => (
                        <div key={note._id} className="pipeline-timeline-item">
                          <div className={`pipeline-timeline-marker ${note.type || "Note"}`} />
                          <div className="pipeline-timeline-header">
                            <span className="pipeline-timeline-author">{note.authorName || "System"}</span>
                            <span className="pipeline-timeline-type">{note.type || "Note"}</span>
                          </div>
                          <div className="pipeline-timeline-body">{note.text}</div>
                          <span className="pipeline-timeline-date">
                            {new Date(note.createdAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit"
                            })}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ color: "#94a3b8", fontSize: "13px", fontStyle: "italic", margin: 0 }}>
                      No activity notes logged yet for this lead.
                    </p>
                  )}
                </div>
              </div>

              <div className="pipeline-drawer-footer">
                <button type="button" className="task-btn-secondary" onClick={() => setSelectedLead(null)}>
                  Close Manager
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
    </Layout>
  );
};

export default Pipeline;
