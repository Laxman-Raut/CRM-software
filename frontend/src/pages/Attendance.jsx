import { useState, useEffect } from "react";
import { 
  FaClock, 
  FaSignInAlt, 
  FaCalendarAlt, 
  FaCheckCircle, 
  FaHistory, 
  FaBusinessTime, 
  FaUserClock,
  FaUsers,
  FaSearch,
  FaFilter,
  FaFileExport,
  FaTimes
} from "react-icons/fa";
import Layout from "../components/Layout";
import api from "../services/api";
import "./Attendance.css";

// Helper to calculate duration between two dates
const calculateDuration = (start, end) => {
  if (!start || !end) return "-";
  const diffMs = new Date(end).getTime() - new Date(start).getTime();
  if (diffMs < 0) return "00:00:00";
  
  const hrs = Math.floor(diffMs / 3600000);
  const mins = Math.floor((diffMs % 3600000) / 60000);
  const secs = Math.floor((diffMs % 60000) / 1000);

  return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};

const Attendance = () => {
  // Permission checks
  const role = localStorage.getItem("role");
  const resolvedPermissions = JSON.parse(localStorage.getItem("resolvedPermissions") || "[]");
  const canViewAllAttendance = role === "admin" || resolvedPermissions.includes("attendance:read");

  // State Management
  const [activeTab, setActiveTab] = useState("my"); // "my" or "all"
  const [personalHistory, setPersonalHistory] = useState([]);
  const [allHistory, setAllHistory] = useState([]);
  
  const [loadingPersonal, setLoadingPersonal] = useState(true);
  const [loadingAll, setLoadingAll] = useState(false);
  
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  
  // Live Clock & Active Session duration
  const [currentTime, setCurrentTime] = useState(new Date());
  const [todayRecord, setTodayRecord] = useState(null);
  const [workedTimeToday, setWorkedTimeToday] = useState("00:00:00");

  // Admin filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterDate, setFilterDate] = useState("");

  // Fetch personal attendance on mount
  useEffect(() => {
    let isMounted = true;

    const fetchPersonalAttendance = async () => {
      try {
        const response = await api.get("/hrm/attendance/my-attendance");
        if (isMounted) {
          const records = Array.isArray(response.data) ? response.data : [];
          setPersonalHistory(records);
          
          // Find today's record
          const todayStr = new Date().toDateString();
          const todayRec = records.find(rec => new Date(rec.date).toDateString() === todayStr);
          setTodayRecord(todayRec || null);
          setLoadingPersonal(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.response?.data?.message || err.message || "Failed to load attendance history.");
          setLoadingPersonal(false);
        }
      }
    };

    const timer = setTimeout(() => {
      fetchPersonalAttendance();
    }, 0);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, []);

  // Fetch all attendance logs when "all" tab is opened
  useEffect(() => {
    if (activeTab !== "all" || !canViewAllAttendance) return;
    
    let isMounted = true;

    const fetchAllAttendance = async () => {
      try {
        const response = await api.get("/hrm/attendance/all");
        if (isMounted) {
          setAllHistory(Array.isArray(response.data) ? response.data : []);
          setLoadingAll(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.response?.data?.message || err.message || "Failed to load all employees logs.");
          setLoadingAll(false);
        }
      }
    };

    const timer = setTimeout(() => {
      if (isMounted) {
        setLoadingAll(true);
        setError("");
        fetchAllAttendance();
      }
    }, 0);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [activeTab, canViewAllAttendance]);

  // Live Clock effect
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Update worked duration today if checked in and not checked out
  useEffect(() => {
    let active = true;

    if (!todayRecord || !todayRecord.checkIn || todayRecord.checkOut) {
      const timer = setTimeout(() => {
        if (active) {
          if (todayRecord && todayRecord.checkIn && todayRecord.checkOut) {
            setWorkedTimeToday(calculateDuration(todayRecord.checkIn, todayRecord.checkOut));
          } else {
            setWorkedTimeToday("00:00:00");
          }
        }
      }, 0);
      return () => {
        active = false;
        clearTimeout(timer);
      };
    }

    const interval = setInterval(() => {
      const checkInTime = new Date(todayRecord.checkIn).getTime();
      const now = new Date().getTime();
      const diffMs = now - checkInTime;

      if (diffMs > 0 && active) {
        const hrs = Math.floor(diffMs / 3600000);
        const mins = Math.floor((diffMs % 3600000) / 60000);
        const secs = Math.floor((diffMs % 60000) / 1000);

        setWorkedTimeToday(
          `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
        );
      }
    }, 1000);

    const initialTimer = setTimeout(() => {
      if (active) {
        const checkInTime = new Date(todayRecord.checkIn).getTime();
        const now = new Date().getTime();
        const diffMs = now - checkInTime;

        if (diffMs > 0) {
          const hrs = Math.floor(diffMs / 3600000);
          const mins = Math.floor((diffMs % 3600000) / 60000);
          const secs = Math.floor((diffMs % 60000) / 1000);

          setWorkedTimeToday(
            `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
          );
        }
      }
    }, 0);

    return () => {
      active = false;
      clearInterval(interval);
      clearTimeout(initialTimer);
    };
  }, [todayRecord]);

  // Formatter Helpers
  const formatDateString = (dateObj) => {
    return dateObj.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTimeString = (dateObj) => {
    return dateObj.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
  };



  // Compute Personal Statistics
  const getPersonalStats = () => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const monthRecords = personalHistory.filter(rec => {
      const d = new Date(rec.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const presentDays = monthRecords.filter(rec => rec.status === "Present" || rec.status === "Late").length;
    const lateDays = monthRecords.filter(rec => rec.status === "Late").length;

    let totalMs = 0;
    monthRecords.forEach(rec => {
      if (rec.checkIn && rec.checkOut) {
        totalMs += new Date(rec.checkOut).getTime() - new Date(rec.checkIn).getTime();
      }
    });
    const totalHours = (totalMs / 3600000).toFixed(1);
    const onTimeRate = presentDays > 0 ? Math.round(((presentDays - lateDays) / presentDays) * 100) : 100;

    return {
      presentDays,
      lateDays,
      totalHours,
      onTimeRate
    };
  };

  const personalStats = getPersonalStats();

  // Filtered All Logs (Admin View)
  const getFilteredLogs = () => {
    return allHistory.filter(rec => {
      // Search matches employee name or email
      const employeeName = rec.employee?.name || "";
      const employeeEmail = rec.employee?.email || "";
      const matchesSearch = searchQuery.trim() === "" ||
        employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        employeeEmail.toLowerCase().includes(searchQuery.toLowerCase());

      // Status Filter
      const matchesStatus = filterStatus === "" || rec.status.toLowerCase() === filterStatus.toLowerCase();

      // Date Filter
      let matchesDate = true;
      if (filterDate) {
        const recordDateStr = new Date(rec.date).toISOString().split("T")[0];
        matchesDate = recordDateStr === filterDate;
      }

      return matchesSearch && matchesStatus && matchesDate;
    });
  };

  const filteredAllLogs = getFilteredLogs();

  // Export to CSV helper
  const exportToCSV = () => {
    if (filteredAllLogs.length === 0) return;
    
    const headers = ["Employee Name", "Email", "Designation", "Date", "Check In", "Check Out", "Duration", "Status"];
    const rows = filteredAllLogs.map(rec => {
      const recDate = new Date(rec.date).toLocaleDateString("en-US");
      const checkInTime = rec.checkIn ? new Date(rec.checkIn).toLocaleTimeString("en-US") : "-";
      const checkOutTime = rec.checkOut ? new Date(rec.checkOut).toLocaleTimeString("en-US") : "-";
      const duration = rec.checkIn && rec.checkOut ? calculateDuration(rec.checkIn, rec.checkOut) : "-";
      
      return [
        rec.employee?.name || "Unknown",
        rec.employee?.email || "",
        rec.employee?.designation || "",
        recDate,
        checkInTime,
        checkOutTime,
        duration,
        rec.status
      ];
    });

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.map(val => `"${val.replace(/"/g, '""')}"`).join(","))].join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Attendance_Export_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Layout>
      <div className="attendance-container">
        {/* Header Section */}
        <div className="attendance-header">
          <div>
            <h1>HRM Attendance Tracker</h1>
            <p className="subtitle">Track daily logs, view statistics, and manage role-based permissions.</p>
          </div>
          <div className="current-date-badge">
            <FaCalendarAlt />
            <span>{formatDateString(currentTime)}</span>
          </div>
        </div>

        {/* Tab Selection (visible if admin/manager can view all) */}
        {canViewAllAttendance && (
          <div className="attendance-tabs-container">
            <button 
              className={`tab-btn ${activeTab === "my" ? "active" : ""}`}
              onClick={() => setActiveTab("my")}
            >
              <FaClock />
              My Attendance
            </button>
            <button 
              className={`tab-btn ${activeTab === "all" ? "active" : ""}`}
              onClick={() => setActiveTab("all")}
            >
              <FaUsers />
              All Employee Logs
            </button>
          </div>
        )}

        {/* Alerts */}
        {error && (
          <div className="attendance-alert alert-error" role="alert">
            <span>{error}</span>
            <button className="close-btn" onClick={() => setError("")}>&times;</button>
          </div>
        )}
        {successMessage && (
          <div className="attendance-alert alert-success" role="alert">
            <span>{successMessage}</span>
            <button className="close-btn" onClick={() => setSuccessMessage("")}>&times;</button>
          </div>
        )}

        {/* Personal View */}
        {activeTab === "my" && (
          <>
            {/* Main Grid: Live Clock + Status Cards */}
            <div className="attendance-grid">
              {/* Live Action Card */}
              <div className="attendance-card clock-card">
                <div className="clock-icon-wrapper">
                  <FaClock className="pulse-animation" />
                </div>
                
                <h2 className="clock-time">{formatTimeString(currentTime)}</h2>
                <p className="clock-label">Current local time</p>

                <div className="shift-timer">
                  <span className="shift-label">Today's Active Hours:</span>
                  <span className="shift-duration">{workedTimeToday}</span>
                </div>

                <div className="action-buttons">
                  {!todayRecord ? (
                    <div className="shift-not-started-message">
                      <FaClock />
                      <span>Shift not started for today</span>
                    </div>
                  ) : !todayRecord.checkOut ? (
                    <div className="shift-active-message">
                      <FaSignInAlt />
                      <span>Active Shift (Checked In via Login)</span>
                    </div>
                  ) : (
                    <div className="shift-completed-message">
                      <FaCheckCircle />
                      <span>Shift completed today (Checked Out via Logout)</span>
                    </div>
                  )}
                </div>

                {todayRecord && (
                  <div className="today-log-details">
                    {todayRecord.checkIn && (
                      <div className="time-log-row">
                        <span>Checked In:</span>
                        <strong>{formatTimeString(new Date(todayRecord.checkIn))}</strong>
                      </div>
                    )}
                    {todayRecord.checkOut && (
                      <div className="time-log-row">
                        <span>Checked Out:</span>
                        <strong>{formatTimeString(new Date(todayRecord.checkOut))}</strong>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Stats Grid */}
              <div className="stats-subgrid">
                <div className="attendance-card stat-card">
                  <div className="stat-icon-container present-icon">
                    <FaCheckCircle />
                  </div>
                  <div className="stat-content">
                    <h3>Days Present</h3>
                    <p className="stat-number">{personalStats.presentDays}</p>
                    <p className="stat-subtext">This calendar month</p>
                  </div>
                </div>

                <div className="attendance-card stat-card">
                  <div className="stat-icon-container hours-icon">
                    <FaBusinessTime />
                  </div>
                  <div className="stat-content">
                    <h3>Total Hours</h3>
                    <p className="stat-number">{personalStats.totalHours} hrs</p>
                    <p className="stat-subtext">Logged this month</p>
                  </div>
                </div>

                <div className="attendance-card stat-card">
                  <div className="stat-icon-container status-icon">
                    <FaUserClock />
                  </div>
                  <div className="stat-content">
                    <h3>On-Time Rate</h3>
                    <p className="stat-number">{personalStats.onTimeRate}%</p>
                    <p className="stat-subtext">{personalStats.lateDays} Late check-ins</p>
                  </div>
                </div>

                <div className="attendance-card stat-card">
                  <div className="stat-icon-container today-status-icon">
                    <FaClock />
                  </div>
                  <div className="stat-content">
                    <h3>Today's Status</h3>
                    <p className={`stat-number status-text-${todayRecord?.status?.toLowerCase() || "absent"}`}>
                      {!todayRecord ? "Pending" : todayRecord.checkOut ? "Checked Out" : "Present"}
                    </p>
                    <p className="stat-subtext">
                      {!todayRecord ? "Not checked in yet" : todayRecord.checkOut ? "Shift ended" : "Shift in progress"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* History Table */}
            <div className="attendance-card history-card">
              <div className="history-header">
                <h2>
                  <FaHistory />
                  My Attendance Logs & History
                </h2>
              </div>

              {loadingPersonal ? (
                <div className="loading-spinner-wrapper">
                  <div className="spinner"></div>
                  <p>Loading attendance data...</p>
                </div>
              ) : personalHistory.length === 0 ? (
                <div className="no-records-wrapper">
                  <p>No attendance records found. Check in to log your first session!</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="attendance-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Day</th>
                        <th>Check In</th>
                        <th>Check Out</th>
                        <th>Total Hours</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {personalHistory.map((record) => {
                        const recDate = new Date(record.date);
                        const formattedDate = recDate.toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        });
                        const dayOfWeek = recDate.toLocaleDateString("en-US", { weekday: "long" });
                        
                        return (
                          <tr key={record._id}>
                            <td>{formattedDate}</td>
                            <td className="text-secondary-cell">{dayOfWeek}</td>
                            <td>{record.checkIn ? formatTimeString(new Date(record.checkIn)) : "-"}</td>
                            <td>{record.checkOut ? formatTimeString(new Date(record.checkOut)) : "-"}</td>
                            <td>
                              {record.checkIn && record.checkOut 
                                ? calculateDuration(record.checkIn, record.checkOut) 
                                : record.checkIn 
                                  ? <span className="badge-in-progress">In Progress</span> 
                                  : "-"}
                            </td>
                            <td>
                              <span className={`status-badge badge-${record.status.toLowerCase()}`}>
                                {record.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {/* Admin View (All Employees Log) */}
        {activeTab === "all" && canViewAllAttendance && (
          <div className="admin-attendance-wrapper">
            {/* Filter controls */}
            <div className="attendance-card filter-card">
              <div className="filter-header">
                <h2>
                  <FaFilter />
                  Filter Attendance Logs
                </h2>
                {filteredAllLogs.length > 0 && (
                  <button onClick={exportToCSV} className="btn-export-csv">
                    <FaFileExport />
                    Export to CSV
                  </button>
                )}
              </div>
              
              <div className="filter-inputs-grid">
                <div className="input-group">
                  <label htmlFor="employee-search">Search Employee</label>
                  <div className="input-with-icon">
                    <FaSearch />
                    <input 
                      id="employee-search"
                      type="text" 
                      placeholder="Search by name or email..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>

                <div className="input-group">
                  <label htmlFor="status-filter">Status</label>
                  <select 
                    id="status-filter"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                  >
                    <option value="">All Statuses</option>
                    <option value="Present">Present</option>
                    <option value="Late">Late</option>
                    <option value="Absent">Absent</option>
                  </select>
                </div>

                <div className="input-group">
                  <label htmlFor="date-filter">Date</label>
                  <input 
                    id="date-filter"
                    type="date" 
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                  />
                </div>
              </div>

              {(searchQuery || filterStatus || filterDate) && (
                <div className="active-filters-row">
                  <span>Active Filters:</span>
                  <button 
                    onClick={() => {
                      setSearchQuery("");
                      setFilterStatus("");
                      setFilterDate("");
                    }} 
                    className="clear-filters-btn"
                  >
                    Clear All Filters
                    <FaTimes />
                  </button>
                </div>
              )}
            </div>

            {/* Logs Table */}
            <div className="attendance-card history-card">
              <div className="history-header">
                <h2>
                  <FaHistory />
                  Employee Logs Listing ({filteredAllLogs.length} records)
                </h2>
              </div>

              {loadingAll ? (
                <div className="loading-spinner-wrapper">
                  <div className="spinner"></div>
                  <p>Loading all attendance records...</p>
                </div>
              ) : filteredAllLogs.length === 0 ? (
                <div className="no-records-wrapper">
                  <p>No matching attendance records found.</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="attendance-table">
                    <thead>
                      <tr>
                        <th>Employee</th>
                        <th>Designation</th>
                        <th>Date</th>
                        <th>Check In</th>
                        <th>Check Out</th>
                        <th>Duration</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAllLogs.map((record) => {
                        const recDate = new Date(record.date);
                        const formattedDate = recDate.toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        });
                        
                        return (
                          <tr key={record._id}>
                            <td>
                              <div className="employee-cell-details">
                                <strong className="emp-name">{record.employee?.name || "Unknown"}</strong>
                                <span className="emp-email">{record.employee?.email || ""}</span>
                              </div>
                            </td>
                            <td className="text-secondary-cell">{record.employee?.designation || "-"}</td>
                            <td>{formattedDate}</td>
                            <td>{record.checkIn ? formatTimeString(new Date(record.checkIn)) : "-"}</td>
                            <td>{record.checkOut ? formatTimeString(new Date(record.checkOut)) : "-"}</td>
                            <td>
                              {record.checkIn && record.checkOut 
                                ? calculateDuration(record.checkIn, record.checkOut) 
                                : record.checkIn 
                                  ? <span className="badge-in-progress">In Progress</span> 
                                  : "-"}
                            </td>
                            <td>
                              <span className={`status-badge badge-${record.status.toLowerCase()}`}>
                                {record.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Attendance;
