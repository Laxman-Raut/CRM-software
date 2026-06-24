import { useEffect, useMemo, useState } from "react";
import LeadStatusChart from "../components/LeadStatusChart";
import {
  FaChartLine,
  FaCheckCircle,
  FaClock,
  FaExclamationCircle,
  FaFilter,
  FaTrophy,
  FaUserPlus,
} from "react-icons/fa";
import Layout from "../components/Layout";
import { getLeads } from "../services/leadServices";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTasks } from "@fortawesome/free-solid-svg-icons";
import "./Static.css";

const STATUS_CONFIG = [
  { label: "New", icon: FaUserPlus, className: "status-new" },
  { label: "Contacted", icon: FaClock, className: "status-contacted" },
  { label: "Qualified", icon: FaCheckCircle, className: "status-qualified" },
  { label: "Won", icon: FaTrophy, className: "status-won" },
  { label: "Lost", icon: FaExclamationCircle, className: "status-lost" },
];

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const getLeadValue = (lead) => Number(lead.value || lead.amount || 0);

const Static = () => {
  const [leads, setLeads] = useState([]);
  const [sortBy, setSortBy] = useState("newest");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchLeads = async () => {
      try {
        const response = await getLeads();
        setLeads(Array.isArray(response.data) ? response.data : []);
      } catch (err) {
        setError(
          err.response?.data?.message || err.message || "Unable to load leads"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchLeads();
  }, []);

  const stats = useMemo(() => {
    const total = leads.length;
    const byStatus = STATUS_CONFIG.reduce((acc, status) => {
      acc[status.label] = leads.filter((lead) => lead.status === status.label).length;
      return acc;
    }, {});
    const won = byStatus.Won || 0;
    const open = total - won - (byStatus.Lost || 0);
    const conversionRate = total ? Math.round((won / total) * 100) : 0;
    const pipelineValue = leads.reduce((sum, lead) => sum + getLeadValue(lead), 0);

    return {
      total,
      open,
      conversionRate,
      pipelineValue,
      byStatus,
    };
  }, [leads]);

  const getLeadDate = (lead) => {
    const dateValue = lead.createdAt || lead.updatedAt || lead._id;
    const parsedDate = new Date(dateValue).getTime();

    return Number.isNaN(parsedDate) ? 0 : parsedDate;
  };

  const sortedLeads = useMemo(() => {
    return [...leads].sort((a, b) => {
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
  }, [leads, sortBy]);

  const recentLeads = useMemo(() => sortedLeads.slice(0, 5), [sortedLeads]);

  // Compile visual activity logs from lead dates
  const activityLogs = useMemo(() => {
    return leads
      .slice(0, 4)
      .map((lead) => ({
        id: lead._id,
        text: `Lead "${lead.name}" added to the pipeline under stage "${lead.status || "New"}"`,
        time: lead.createdAt ? new Date(lead.createdAt).toLocaleDateString() : "Recently",
        type: "lead",
      }));
  }, [leads]);

  return (
    <Layout>
      <section className="static-page">
        <div className="static-header">
          <div>
            <p className="static-kicker">CRM Dashboard</p>
            <h1>Overview & Analytics</h1>
          </div>
          <div className="static-header-icon" aria-hidden="true">
            <FaChartLine />
          </div>
        </div>

        {loading && <div className="static-state">Loading dashboard stats...</div>}

        {!loading && error && (
          <div className="static-state static-state-error">
            <strong>Could not load dashboard information</strong>
            <span>{error}</span>
          </div>
        )}

        {!loading && !error && (
          <>
            {/* KPI Cards Row */}
            <div className="summary-grid">
              <article className="summary-card summary-card-primary">
                <span>Pipeline Value</span>
                <strong>{currencyFormatter.format(stats.pipelineValue)}</strong>
              </article>

              <article className="summary-card">
                <span>Active Leads</span>
                <strong>{stats.open}</strong>
              </article>

              <article className="summary-card">
                <span>Conversion Rate</span>
                <strong>{stats.conversionRate}%</strong>
              </article>

              <article className="summary-card">
                <span>Total Profiles</span>
                <strong>{stats.total}</strong>
              </article>
            </div>
            <LeadStatusChart stats={stats} />

            {/* Dashboard Sections Grid */}
            <div className="dashboard-grid">
              <div className="dashboard-left-col">
                {/* Sales Funnel SVG Chart */}
                <section className="dashboard-panel funnel-section">
                  <div className="panel-title">
                    <FaChartLine aria-hidden="true" />
                    <h2>Sales Pipeline Funnel</h2>
                  </div>

                  <div className="funnel-container">
                    <div className="funnel-chart-wrapper">
                      <svg viewBox="0 0 200 170" className="funnel-svg">
                        <defs>
                          <linearGradient id="new-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#3b82f6" />
                            <stop offset="100%" stopColor="#60a5fa" />
                          </linearGradient>
                          <linearGradient id="contacted-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#6366f1" />
                            <stop offset="100%" stopColor="#818cf8" />
                          </linearGradient>
                          <linearGradient id="qualified-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#06b6d4" />
                            <stop offset="100%" stopColor="#22d3ee" />
                          </linearGradient>
                          <linearGradient id="won-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#10b981" />
                            <stop offset="100%" stopColor="#34d399" />
                          </linearGradient>
                        </defs>

                        {/* Funnel Stage 1: New */}
                        <polygon points="10,10 190,10 170,45 30,45" fill="url(#new-grad)" opacity="0.9" />
                        <text x="100" y="32" className="funnel-text">New: {stats.byStatus["New"] || 0}</text>

                        {/* Funnel Stage 2: Contacted */}
                        <polygon points="32,48 168,48 148,83 52,83" fill="url(#contacted-grad)" opacity="0.9" />
                        <text x="100" y="70" className="funnel-text">Contacted: {stats.byStatus["Contacted"] || 0}</text>

                        {/* Funnel Stage 3: Qualified */}
                        <polygon points="54,86 146,86 126,121 74,121" fill="url(#qualified-grad)" opacity="0.9" />
                        <text x="100" y="108" className="funnel-text">Qualified: {stats.byStatus["Qualified"] || 0}</text>

                        {/* Funnel Stage 4: Won */}
                        <polygon points="76,124 124,124 110,159 90,159" fill="url(#won-grad)" opacity="0.9" />
                        <text x="100" y="146" className="funnel-text">Won: {stats.byStatus["Won"] || 0}</text>
                      </svg>
                    </div>

                    <div className="funnel-legend">
                      <div className="legend-item"><span className="dot new" /> New Lead</div>
                      <div className="legend-item"><span className="dot contacted" /> Contacted</div>
                      <div className="legend-item"><span className="dot qualified" /> Qualified</div>
                      <div className="legend-item"><span className="dot won" /> Closed Won</div>
                    </div>
                  </div>
                </section>

                {/* Status Breakdown Panels */}
                <section className="dashboard-panel">
                  <div className="panel-title">
                    <FaFilter aria-hidden="true" />
                    <h2>Status Breakdown</h2>
                  </div>

                  <div className="status-grid">
                    {STATUS_CONFIG.map(({ label, icon: Icon, className }) => (
                      <article className={`status-card ${className}`} key={label}>
                        <div className="status-icon" aria-hidden="true">
                          <Icon />
                        </div>
                        <div>
                          <span>{label}</span>
                          <strong>{stats.byStatus[label] || 0}</strong>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              </div>

              <div className="dashboard-right-col">
                {/* Recent Leads Feed */}
                <section className="dashboard-panel">
                  <div className="panel-title">
                    <FaClock aria-hidden="true" />
                    <h2>Recent Leads</h2>
                  </div>

                  <div className="dashboard-sort">
                    <label htmlFor="dashboard-sort">Sort Order</label>
                    <select
                      id="dashboard-sort"
                      value={sortBy}
                      onChange={(event) => setSortBy(event.target.value)}
                    >
                      <option value="newest">Newest first</option>
                      <option value="oldest">Oldest first</option>
                      <option value="name">Name A-Z</option>
                      <option value="status">Status A-Z</option>
                    </select>
                  </div>

                  {recentLeads.length > 0 ? (
                    <div className="recent-list">
                      {recentLeads.map((lead) => (
                        <div className="recent-item" key={lead._id || lead.email}>
                          <div>
                            <strong>{lead.name || "Unnamed lead"}</strong>
                            <span>{lead.email || "No email provided"}</span>
                          </div>
                          <span className="recent-status">{lead.status || "New"}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-state">No leads available yet.</div>
                  )}
                </section>

                {/* Recent activity stream */}
                <section className="dashboard-panel">
                  <div className="panel-title">
                    <FaClock aria-hidden="true" />
                    <h2>Timeline Activity Stream</h2>
                  </div>

                  <div className="activity-feed">
                    {activityLogs.length > 0 ? (
                      activityLogs.map((log) => (
                        <div className="feed-item" key={log.id}>
                          <span className="feed-dot" />
                          <div className="feed-content">
                            <p>{log.text}</p>
                            <span>{log.time}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="empty-state">No activity logs recorded.</div>
                    )}
                  </div>
                </section>
              </div>
            </div>
          </>
        )}
      </section>
    </Layout>
  );
};

export default Static;
