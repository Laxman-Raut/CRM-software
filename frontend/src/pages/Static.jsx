import { useEffect, useMemo, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  AreaChart,
  Area
} from "recharts";
import {
  FaChartLine,
  FaDollarSign,
  FaUserFriends,
  FaUserCheck,
  FaBriefcase,
  FaClock,
  FaUsers,
  FaFilter,
  FaRegHandshake,
  FaArrowRight
} from "react-icons/fa";
import Layout from "../components/Layout";
import { getLeads } from "../services/leadServices";
import { getDeals } from "../services/dealServices";
import { getCustomers } from "../services/customerServices";
import "./Static.css";

import { useSettings } from "../context/SettingsContext";

const Static = () => {
  const { formatCurrency } = useSettings();
  const [leads, setLeads] = useState([]);
  const [deals, setDeals] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [sortBy, setSortBy] = useState("newest");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [leadsRes, dealsRes, customersRes] = await Promise.all([
          getLeads(),
          getDeals(),
          getCustomers()
        ]);
        setLeads(Array.isArray(leadsRes.data) ? leadsRes.data : []);
        setDeals(Array.isArray(dealsRes.data) ? dealsRes.data : []);
        setCustomers(Array.isArray(customersRes.data) ? customersRes.data : []);
      } catch (err) {
        setError(err.response?.data?.message || err.message || "Unable to load dashboard statistics");
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  // Compute unified statistics
  const stats = useMemo(() => {
    const totalLeads = leads.length;
    const leadsByStatus = leads.reduce((acc, lead) => {
      const status = lead.status || "New";
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    const totalDeals = deals.length;
    const activeDeals = deals.filter(d => d.stage !== "Won" && d.stage !== "Lost");
    const activeDealsValue = activeDeals.reduce((sum, d) => sum + Number(d.value || 0), 0);
    const dealsByStage = deals.reduce((acc, deal) => {
      const stage = deal.stage || "Proposal";
      acc[stage] = (acc[stage] || 0) + 1;
      return acc;
    }, {});

    const totalCustomers = customers.length;
    const activeCustomers = customers.filter(c => c.status === "Active").length;
    const totalRevenue = customers.reduce((sum, c) => sum + Number(c.value || 0), 0);

    const leadConversionRate = totalLeads ? Math.round(((leadsByStatus["Won"] || 0) / totalLeads) * 100) : 0;
    const dealConversionRate = totalDeals ? Math.round(((dealsByStage["Won"] || 0) / totalDeals) * 100) : 0;

    return {
      totalLeads,
      leadsByStatus,
      totalDeals,
      activeDealsCount: activeDeals.length,
      activeDealsValue,
      dealsByStage,
      totalCustomers,
      activeCustomers,
      totalRevenue,
      leadConversionRate,
      dealConversionRate
    };
  }, [leads, deals, customers]);

  // Combine and sort feeds
  const recentDeals = useMemo(() => {
    return [...deals].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);
  }, [deals]);

  const recentCustomers = useMemo(() => {
    return [...customers].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);
  }, [customers]);

  // Activity stream based on latest leads and deals
  const activityLogs = useMemo(() => {
    const logs = [];
    
    leads.slice(0, 3).forEach(lead => {
      logs.push({
        id: `lead-${lead._id}`,
        text: `New Lead "${lead.name}" added to prospecting pipeline.`,
        time: lead.createdAt ? new Date(lead.createdAt).toLocaleDateString() : "Recently",
        type: "lead"
      });
    });

    deals.slice(0, 3).forEach(deal => {
      logs.push({
        id: `deal-${deal._id}`,
        text: `Deal "${deal.dealName}" transitioned to stage "${deal.stage}".`,
        time: deal.updatedAt ? new Date(deal.updatedAt).toLocaleDateString() : "Recently",
        type: "deal"
      });
    });

    return logs.sort((a, b) => b.time.localeCompare(a.time)).slice(0, 5);
  }, [leads, deals]);

  // Recharts Chart Data
  const stageChartData = [
    { name: "Prospects (Leads)", count: stats.totalLeads, color: "#3b82f6" },
    { name: "Negotiation (Deals)", count: stats.activeDealsCount, color: "#f59e0b" },
    { name: "Customers (Closed)", count: stats.totalCustomers, color: "#10b981" }
  ];

  const customerPieData = [
    { name: "Active Accounts", value: stats.activeCustomers },
    { name: "Inactive Accounts", value: Math.max(0, stats.totalCustomers - stats.activeCustomers) }
  ];

  const PIE_COLORS = ["#10b981", "#ef4444"];

  if (loading) {
    return (
      <Layout>
        <div className="static-loading">
          <div className="static-spinner"></div>
          <p>Analyzing CRM metrics...</p>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="static-error-container">
          <h2>Analytics Load Error</h2>
          <p>{error}</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="static-page">
        {/* Header section */}
        <header className="static-header">
          <div>
            <p className="static-kicker">CRM Performance</p>
            <h1>Overview & Analytics</h1>
          </div>
          <div className="static-header-icon" aria-hidden="true">
            <FaChartLine />
          </div>
        </header>

        {/* Dashboard Key Cards */}
        <section className="summary-grid" aria-label="Key Performance Indicators">
          <article className="summary-card summary-card-primary">
            <div className="summary-card-icon-wrapper"><FaDollarSign /></div>
            <div>
              <span>Portfolio Value</span>
              <strong>{formatCurrency(stats.totalRevenue)}</strong>
            </div>
          </article>

          <article className="summary-card">
            <div className="summary-card-icon-wrapper secondary"><FaUserCheck /></div>
            <div>
              <span>Active Customers</span>
              <strong>{stats.activeCustomers}</strong>
            </div>
          </article>

          <article className="summary-card">
            <div className="summary-card-icon-wrapper warning"><FaBriefcase /></div>
            <div>
              <span>Open Deals Value</span>
              <strong>{formatCurrency(stats.activeDealsValue)}</strong>
            </div>
          </article>

          <article className="summary-card">
            <div className="summary-card-icon-wrapper info"><FaUserFriends /></div>
            <div>
              <span>Prospect Leads</span>
              <strong>{stats.totalLeads}</strong>
            </div>
          </article>
        </section>

        {/* Funnel Progress Section */}
        <section className="dashboard-panel funnel-section" aria-label="Sales Funnel Performance">
          <div className="panel-title">
            <FaFilter aria-hidden="true" />
            <h2>Sales Funnel Performance</h2>
          </div>
          
          <div className="funnel-funnel-container">
            <div className="funnel-stage">
              <span className="funnel-num">1</span>
              <h4>Prospect Leads</h4>
              <p className="funnel-metric">{stats.totalLeads} Leads</p>
              <p className="funnel-sub">Proactive prospecting</p>
            </div>
            <div className="funnel-arrow"><FaArrowRight /></div>
            <div className="funnel-stage">
              <span className="funnel-num">2</span>
              <h4>Negotiating Deals</h4>
              <p className="funnel-metric">{stats.totalDeals} Deals</p>
              <p className="funnel-sub">{stats.leadConversionRate}% Conv. Rate</p>
            </div>
            <div className="funnel-arrow"><FaArrowRight /></div>
            <div className="funnel-stage active">
              <span className="funnel-num">3</span>
              <h4>Won Customers</h4>
              <p className="funnel-metric">{stats.totalCustomers} Accounts</p>
              <p className="funnel-sub">{stats.dealConversionRate}% Win Rate</p>
            </div>
          </div>
        </section>

        {/* Charting Columns */}
        <div className="dashboard-grid">
          <div className="dashboard-left-col">
            {/* Sales Volume Bar Chart */}
            <section className="dashboard-panel">
              <div className="panel-title">
                <FaChartLine aria-hidden="true" />
                <h2>CRM Sales Pipeline Volume</h2>
              </div>
              <div style={{ width: "100%", height: "300px" }}>
                <ResponsiveContainer>
                  <BarChart data={stageChartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={12} />
                    <YAxis stroke="var(--text-secondary)" fontSize={12} />
                    <Tooltip cursor={{ fill: "rgba(0,0,0,0.02)" }} />
                    <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                      {stageChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            {/* Status breakdown grid */}
            <section className="dashboard-panel">
              <div className="panel-title">
                <FaRegHandshake aria-hidden="true" />
                <h2>Deals Pipeline Stage Breakdown</h2>
              </div>
              <div className="stage-breakdown-grid">
                <article className="stage-breakdown-card proposal">
                  <span>Proposal Stage</span>
                  <strong>{stats.dealsByStage["Proposal"] || 0}</strong>
                </article>
                <article className="stage-breakdown-card negotiation">
                  <span>Negotiation Stage</span>
                  <strong>{stats.dealsByStage["Negotiation"] || 0}</strong>
                </article>
                <article className="stage-breakdown-card won">
                  <span>Deals Won</span>
                  <strong>{stats.dealsByStage["Won"] || 0}</strong>
                </article>
                <article className="stage-breakdown-card lost">
                  <span>Deals Lost</span>
                  <strong>{stats.dealsByStage["Lost"] || 0}</strong>
                </article>
              </div>
            </section>
          </div>

          <div className="dashboard-right-col">
            {/* Customers Pie Chart */}
            <section className="dashboard-panel">
              <div className="panel-title">
                <FaUsers aria-hidden="true" />
                <h2>Customer Account Health</h2>
              </div>
              <div style={{ width: "100%", height: "240px" }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={customerPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {customerPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </section>

            {/* Recent Customers list */}
            <section className="dashboard-panel">
              <div className="panel-title">
                <FaClock aria-hidden="true" />
                <h2>Recent Customer Onboardings</h2>
              </div>
              <div className="recent-list">
                {recentCustomers.map((cust) => (
                  <div className="recent-item" key={cust._id}>
                    <div>
                      <strong className="recent-item-title">{cust.customerName}</strong>
                      <span className="recent-item-subtitle">{cust.company || "Independent"}</span>
                    </div>
                    <span className="recent-item-value">{formatCurrency(cust.value || 0)}</span>
                  </div>
                ))}
                {recentCustomers.length === 0 && (
                  <div className="empty-state">No onboarding events recorded.</div>
                )}
              </div>
            </section>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Static;
