import { useEffect, useMemo, useState } from "react";
import {
  FaArrowLeft,
  FaArrowRight,
  FaEnvelope,
  FaPhone,
  FaSearch,
  FaSyncAlt,
  FaTimes,
  FaDollarSign,
  FaTrophy,
  FaCheck,
  FaCommentAlt,
  FaBriefcase,
  FaPlus,
  FaTrash
} from "react-icons/fa";
import Layout from "../components/Layout";
import { getDeals, updateDeal, addDealNote } from "../services/dealServices";
import "./Pipeline.css";

const STAGES = ["Proposal", "Negotiation", "Won", "Lost"];

import { useSettings } from "../context/SettingsContext";

const Pipeline = () => {
  const { formatCurrency } = useSettings();
  const [deals, setDeals] = useState([]);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState("");

  // Drawer / details modal state
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [editingName, setEditingName] = useState("");
  const [editingCompany, setEditingCompany] = useState("");
  const [editingEmail, setEditingEmail] = useState("");
  const [editingPhone, setEditingPhone] = useState("");
  const [editingValue, setEditingValue] = useState(0);
  const [editingStage, setEditingStage] = useState("Proposal");
  const [newNoteText, setNewNoteText] = useState("");
  const [newNoteType, setNewNoteType] = useState("Note");
  const [loggingNote, setLoggingNote] = useState(false);

  // Deal items / products states
  const [editingProducts, setEditingProducts] = useState([]);
  const [newItemName, setNewItemName] = useState("");
  const [newItemQty, setNewItemQty] = useState(1);
  const [newItemPrice, setNewItemPrice] = useState(0);

  const role = localStorage.getItem("role");
  const permissions = JSON.parse(localStorage.getItem("permissions") || "{}");
  const canUpdate = role === "admin" || permissions.canUpdateLeads === true;

  const fetchDealsList = async () => {
    try {
      setError("");
      const response = await getDeals();
      setDeals(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Unable to load pipeline");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDealsList();
  }, []);

  // Compute global stats
  const stats = useMemo(() => {
    const totalCount = deals.length;
    const totalValue = deals.reduce((sum, deal) => sum + Number(deal.value || 0), 0);
    const activeDeals = deals.filter(
      (d) => d.stage !== "Won" && d.stage !== "Lost"
    ).length;
    const wonCount = deals.filter((d) => d.stage === "Won").length;
    const winRate = totalCount ? Math.round((wonCount / totalCount) * 100) : 0;
    const avgValue = totalCount ? Math.round(totalValue / totalCount) : 0;

    return {
      totalValue,
      activeDeals,
      winRate,
      avgValue,
    };
  }, [deals]);

  // Filter deals by search query
  const searchedDeals = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return deals;

    return deals.filter((deal) =>
      [deal.dealName, deal.company, deal.email, deal.phone, deal.stage]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query))
    );
  }, [deals, search]);

  // Sort and group deals by stage
  const dealsByStage = useMemo(() => {
    // Initialise grouped object
    const groups = STAGES.reduce((acc, stage) => {
      acc[stage] = [];
      return acc;
    }, {});

    // Sort deals first
    const sorted = [...searchedDeals].sort((a, b) => {
      if (sortBy === "value-desc") {
        return Number(b.value || 0) - Number(a.value || 0);
      }
      if (sortBy === "value-asc") {
        return Number(a.value || 0) - Number(b.value || 0);
      }
      if (sortBy === "name") {
        return (a.dealName || "").localeCompare(b.dealName || "");
      }
      // newest
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });

    // Distribute into stages
    sorted.forEach((deal) => {
      const stage = deal.stage || "Proposal";
      if (groups[stage]) {
        groups[stage].push(deal);
      }
    });

    return groups;
  }, [searchedDeals, sortBy]);

  // Compute stage aggregates (deal totals)
  const stageValues = useMemo(() => {
    return STAGES.reduce((acc, stage) => {
      const currentStageDeals = dealsByStage[stage] || [];
      acc[stage] = currentStageDeals.reduce((sum, d) => sum + Number(d.value || 0), 0);
      return acc;
    }, {});
  }, [dealsByStage]);

  // Move deal left/right
  const moveDeal = async (deal, direction, e) => {
    if (e) e.stopPropagation();
    
    if (!canUpdate) {
      alert("You do not have permission to modify deals.");
      return;
    }

    const currentIndex = STAGES.indexOf(deal.stage || "Proposal");
    const nextStage = STAGES[currentIndex + direction];

    if (!nextStage || updatingId) {
      return;
    }

    try {
      setUpdatingId(deal._id);
      const payload = {
        dealName: deal.dealName,
        company: deal.company || "",
        email: deal.email,
        phone: deal.phone,
        stage: nextStage,
        value: deal.value || 0,
        products: deal.products || [],
        status: nextStage === "Won" ? "Won" : nextStage === "Lost" ? "Lost" : "Active"
      };

      const res = await updateDeal(deal._id, payload);

      setDeals((currentDeals) =>
        currentDeals.map((item) =>
          item._id === deal._id ? res.data : item
        )
      );

      // If drawer is open and matches this deal, sync its stage
      if (selectedDeal && selectedDeal._id === deal._id) {
        setEditingStage(nextStage);
        setSelectedDeal(res.data);
      }

    } catch (err) {
      alert(err.response?.data?.message || err.message || "Unable to update deal stage");
    } finally {
      setUpdatingId("");
    }
  };

  // Open deal details drawer
  const handleDealClick = (deal) => {
    setSelectedDeal(deal);
    setEditingName(deal.dealName || "");
    setEditingCompany(deal.company || "");
    setEditingEmail(deal.email || "");
    setEditingPhone(deal.phone || "");
    setEditingValue(deal.value || 0);
    setEditingStage(deal.stage || "Proposal");
    setEditingProducts(deal.products || []);
    setNewItemName("");
    setNewItemQty(1);
    setNewItemPrice(0);
    setNewNoteText("");
  };

  // Save deal value and stage changes
  const handleSaveDetails = async (e) => {
    e.preventDefault();
    if (!canUpdate) {
      alert("You do not have permission to modify deals.");
      return;
    }

    if (!editingName.trim() || !editingEmail.trim() || !editingPhone.trim()) {
      alert("Please fill in all required fields (Name, Email, Phone).");
      return;
    }

    try {
      const payload = {
        dealName: editingName,
        company: editingCompany,
        email: editingEmail,
        phone: editingPhone,
        stage: editingStage,
        value: Number(editingValue || 0),
        products: editingProducts,
        status: editingStage === "Won" ? "Won" : editingStage === "Lost" ? "Lost" : "Active"
      };

      const res = await updateDeal(selectedDeal._id, payload);
      
      // Update local states
      setSelectedDeal(res.data);
      setDeals((prev) =>
        prev.map((d) => (d._id === selectedDeal._id ? res.data : d))
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
      alert("You do not have permission to modify deals.");
      return;
    }
    if (!newNoteText.trim()) return;

    try {
      setLoggingNote(true);
      const res = await addDealNote(selectedDeal._id, {
        text: newNoteText,
        type: newNoteType,
      });

      setSelectedDeal(res.data);
      setDeals((prev) =>
        prev.map((d) => (d._id === selectedDeal._id ? res.data : d))
      );
      setNewNoteText("");
    } catch (err) {
      alert("Failed to log activity: " + (err.response?.data?.message || err.message));
    } finally {
      setLoggingNote(false);
    }
  };

  // Products manager handlers
  const handleAddProduct = () => {
    if (!newItemName.trim()) return;
    const updated = [
      ...editingProducts,
      { name: newItemName, quantity: Number(newItemQty), price: Number(newItemPrice) }
    ];
    setEditingProducts(updated);

    // Dynamic sum calculation
    const total = updated.reduce((sum, p) => sum + (p.quantity * p.price), 0);
    setEditingValue(total);

    setNewItemName("");
    setNewItemQty(1);
    setNewItemPrice(0);
  };

  const handleRemoveProduct = (index) => {
    const updated = editingProducts.filter((_, idx) => idx !== index);
    setEditingProducts(updated);

    const total = updated.reduce((sum, p) => sum + (p.quantity * p.price), 0);
    setEditingValue(total);
  };

  return (
    <Layout>
      <section className="pipeline-page">
        {/* Header Title */}
        <div className="pipeline-header">
          <div>
            <p className="pipeline-kicker">Sales Flow</p>
            <h1>Deals Sales Pipeline</h1>
          </div>
          <button type="button" className="pipeline-refresh" onClick={fetchDealsList}>
            <FaSyncAlt aria-hidden="true" /> Refresh
          </button>
        </div>

        {/* Stats Row */}
        {!loading && !error && (
          <section className="pipeline-stats-row">
            <div className="pipeline-stat-card">
              <div className="pipeline-stat-icon total-val"><FaDollarSign /></div>
              <div className="pipeline-stat-info">
                <span className="pipeline-stat-value">{formatCurrency(stats.totalValue)}</span>
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
                <span className="pipeline-stat-value">{formatCurrency(stats.avgValue)}</span>
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
              placeholder="Search deals in pipeline..."
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
              <option value="newest">Newest Deals</option>
              <option value="name">Deal Name (A-Z)</option>
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
                      {formatCurrency(stageValues[stage] || 0)}
                    </span>
                  </div>
                  <span className="pipeline-column-count">
                    {(dealsByStage[stage] || []).length}
                  </span>
                </div>

                <div className="pipeline-cards">
                  {(dealsByStage[stage] || []).map((deal) => {
                    const stageIndex = STAGES.indexOf(deal.stage || "Proposal");
                    const isUpdating = updatingId === deal._id;
                    const notesCount = deal.notes?.length || 0;

                    return (
                      <article 
                        className={`pipeline-card stage-${(deal.stage || "Proposal").toLowerCase()}`} 
                        key={deal._id}
                        onClick={() => handleDealClick(deal)}
                      >
                        <div className="pipeline-card-header">
                          <div>
                            <strong className="pipeline-card-name">{deal.dealName || "Unnamed deal"}</strong>
                            {deal.company && (
                              <div style={{ fontSize: "11px", color: "#64748b", fontWeight: "500", marginTop: "1px" }}>
                                {deal.company}
                              </div>
                            )}
                          </div>
                          <span className="pipeline-card-value-badge">
                            {formatCurrency(deal.value || 0)}
                          </span>
                        </div>

                        {deal.email && (
                          <p>
                            <FaEnvelope aria-hidden="true" />
                            {deal.email}
                          </p>
                        )}

                        {deal.phone && (
                          <p>
                            <FaPhone aria-hidden="true" />
                            {deal.phone}
                          </p>
                        )}

                        <div className="pipeline-card-footer">
                          <span className="pipeline-card-notes-badge" title="Logged activities">
                            <FaCommentAlt /> {notesCount} {notesCount === 1 ? "note" : "notes"}
                          </span>

                          <div className="pipeline-card-actions" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={(e) => moveDeal(deal, -1, e)}
                              disabled={stageIndex <= 0 || isUpdating || !canUpdate}
                              title="Move backward"
                            >
                              <FaArrowLeft aria-hidden="true" />
                            </button>

                            <button
                              type="button"
                              onClick={(e) => moveDeal(deal, 1, e)}
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

                  {(dealsByStage[stage] || []).length === 0 && (
                    <div className="pipeline-empty">No deals in this stage.</div>
                  )}
                </div>
              </section>
            ))}
          </div>
        )}

        {/* Deal Details Slide-out Drawer */}
        {selectedDeal && (
          <div className="pipeline-drawer-backdrop" onClick={() => setSelectedDeal(null)}>
            <div className="pipeline-drawer" onClick={(e) => e.stopPropagation()}>
              <div className="pipeline-drawer-header">
                <h2>Deal Management</h2>
                <button className="pipeline-drawer-close" onClick={() => setSelectedDeal(null)}>
                  <FaTimes />
                </button>
              </div>

              <div className="pipeline-drawer-content">
                {/* Section 1: Lead Information details */}
                {selectedDeal.sourceLead && (
                  <div className="pipeline-drawer-section">
                    <h3>Source Lead Contact Details</h3>
                    <div className="pipeline-lead-fields">
                      <div className="pipeline-lead-field-row">
                        <span className="pipeline-lead-field-label">Lead Name:</span>
                        <span className="pipeline-lead-field-value">{selectedDeal.sourceLead.name}</span>
                      </div>
                      <div className="pipeline-lead-field-row">
                        <span className="pipeline-lead-field-label">Original Email:</span>
                        <span className="pipeline-lead-field-value">{selectedDeal.sourceLead.email}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Section 2: Edit Deal Details */}
                <div className="pipeline-drawer-section">
                  <h3>Edit Deal Details</h3>
                  <form onSubmit={handleSaveDetails} className="pipeline-drawer-form">
                    <div className="pipeline-form-group">
                      <label htmlFor="edit-deal-name">Deal Account Name *</label>
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
                        disabled
                      />
                      <span style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
                        Calculated from negotiated products list below.
                      </span>
                    </div>

                    <div className="pipeline-form-group">
                      <label htmlFor="edit-deal-stage">Pipeline Stage</label>
                      <select
                        id="edit-deal-stage"
                        className="pipeline-form-select"
                        value={editingStage}
                        onChange={(e) => setEditingStage(e.target.value)}
                        disabled={!canUpdate}
                      >
                        {STAGES.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>

                    {canUpdate && (
                      <button type="submit" className="pipeline-note-submit-btn" style={{ background: "#10b981" }}>
                        Save Deal Details
                      </button>
                    )}
                  </form>
                </div>

                {/* Section: Products under Negotiation (Interactive) */}
                <div className="pipeline-drawer-section">
                  <h3>Products & Services under Negotiation</h3>
                  {canUpdate && (
                    <div style={{ display: "flex", gap: "8px", marginBottom: "12px", flexWrap: "wrap" }}>
                      <input
                        type="text"
                        placeholder="Product/Service Name"
                        value={newItemName}
                        onChange={(e) => setNewItemName(e.target.value)}
                        className="pipeline-form-input"
                        style={{ flex: 2, minWidth: "150px" }}
                      />
                      <input
                        type="number"
                        placeholder="Qty"
                        value={newItemQty}
                        onChange={(e) => setNewItemQty(e.target.value)}
                        className="pipeline-form-input"
                        style={{ flex: 0.5, minWidth: "60px" }}
                        min="1"
                      />
                      <input
                        type="number"
                        placeholder="Price (INR)"
                        value={newItemPrice}
                        onChange={(e) => setNewItemPrice(e.target.value)}
                        className="pipeline-form-input"
                        style={{ flex: 1, minWidth: "100px" }}
                        min="0"
                      />
                      <button
                        type="button"
                        onClick={handleAddProduct}
                        className="pipeline-note-submit-btn"
                        style={{ background: "#2563eb", height: "40px", display: "flex", alignItems: "center", gap: "4px", padding: "0 12px" }}
                      >
                        <FaPlus /> Add
                      </button>
                    </div>
                  )}

                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", textAlign: "left" }}>
                      <thead>
                        <tr style={{ borderBottom: "1px solid var(--border-color)", color: "var(--text-secondary)" }}>
                          <th style={{ padding: "8px" }}>Item Name</th>
                          <th style={{ padding: "8px", textAlign: "center" }}>Qty</th>
                          <th style={{ padding: "8px", textAlign: "right" }}>Price</th>
                          <th style={{ padding: "8px", textAlign: "right" }}>Total</th>
                          {canUpdate && <th style={{ padding: "8px", textAlign: "center" }}>Action</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {editingProducts.map((p, idx) => (
                          <tr key={idx} style={{ borderBottom: "1px solid var(--border-color)", color: "var(--text-primary)" }}>
                            <td style={{ padding: "8px" }}>{p.name}</td>
                            <td style={{ padding: "8px", textAlign: "center" }}>{p.quantity}</td>
                            <td style={{ padding: "8px", textAlign: "right" }}>{formatCurrency(p.price)}</td>
                            <td style={{ padding: "8px", textAlign: "right" }}>{formatCurrency(p.quantity * p.price)}</td>
                            {canUpdate && (
                              <td style={{ padding: "8px", textAlign: "center" }}>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveProduct(idx)}
                                  style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer" }}
                                  title="Delete Item"
                                >
                                  <FaTrash />
                                </button>
                              </td>
                            )}
                          </tr>
                        ))}
                        {editingProducts.length === 0 && (
                          <tr>
                            <td colSpan={canUpdate ? 5 : 4} style={{ padding: "12px", textAlign: "center", color: "#94a3b8", fontStyle: "italic" }}>
                              No products negotiated yet. Add them above.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
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
                  {selectedDeal.notes && selectedDeal.notes.length > 0 ? (
                    <div className="pipeline-notes-timeline">
                      {[...selectedDeal.notes].reverse().map((note, idx) => (
                        <div key={idx} className="pipeline-timeline-item">
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
                      No activity notes logged yet for this deal.
                    </p>
                  )}
                </div>
              </div>

              <div className="pipeline-drawer-footer">
                <button type="button" className="task-btn-secondary" onClick={() => setSelectedDeal(null)}>
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
