import { useEffect, useState, useMemo } from "react";
import { 
  FaSearch, 
  FaPlus, 
  FaColumns, 
  FaList, 
  FaCalendarAlt, 
  FaUser, 
  FaTrash, 
  FaEdit, 
  FaTimes, 
  FaCheckCircle, 
  FaSpinner, 
  FaTasks,
  FaFilter
} from "react-icons/fa";
import api from "../services/api";
import Layout from "../components/Layout";
import "./Tasks.css";

const Tasks = () => {
  // State variables
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // UI state
  const [viewMode, setViewMode] = useState("board"); // 'board' or 'list'
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [assigneeFilter, setAssigneeFilter] = useState("All");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  // Form states
  const [form, setForm] = useState({
    title: "",
    description: "",
    assignedTo: "",
    leadId: "",
    priority: "Medium",
    dueDate: ""
  });

  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    assignedTo: "",
    leadId: "",
    priority: "Medium",
    status: "Pending",
    dueDate: ""
  });

  const [manualAssignee, setManualAssignee] = useState(false);
  const [manualEditAssignee, setManualEditAssignee] = useState(false);

  const role = localStorage.getItem("role");

  // Get logged-in user's info from JWT token
  const currentUser = useMemo(() => {
    const token = localStorage.getItem("token");
    if (!token) return null;
    try {
      const parts = token.split(".");
      if (parts.length < 2) return null;
      const payload = JSON.parse(atob(parts[1]));
      return {
        _id: payload.id,
        name: localStorage.getItem("name") || "Me",
        email: localStorage.getItem("email") || ""
      };
    } catch (e) {
      console.error("Failed to decode token:", e);
      return null;
    }
  }, []);

  // Fetch initial data
  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");
      
      // Fetch tasks
      const tasksRes = await api.get("/tasks");
      const fetchedTasks = Array.isArray(tasksRes.data) ? tasksRes.data : [];
      setTasks(fetchedTasks);

      // Fetch employees
      try {
        const empRes = await api.get("/employees");
        setEmployees(Array.isArray(empRes.data) ? empRes.data : []);
      } catch (empErr) {
        console.error("Failed to load employees", empErr);
      }

      // Fetch leads for relation
      try {
        const leadsRes = await api.get("/leads");
        setLeads(Array.isArray(leadsRes.data) ? leadsRes.data : []);
      } catch (leadsErr) {
        console.error("Failed to load leads", leadsErr);
      }

    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Compute unique assignees from tasks list for fallback assignment dropdown
  const uniqueAssignees = useMemo(() => {
    const list = [];
    tasks.forEach((task) => {
      if (task.assignedTo && task.assignedTo._id) {
        if (!list.some((u) => u._id === task.assignedTo._id)) {
          list.push(task.assignedTo);
        }
      }
    });
    return list;
  }, [tasks]);

  // Combine current user, employees from state, and unique assignees from tasks for a comprehensive list
  const allAvailableEmployees = useMemo(() => {
    const map = new Map();
    
    // Add current user first
    if (currentUser && currentUser._id) {
      map.set(currentUser._id, currentUser);
    }
    
    // Add employees fetched from API
    employees.forEach(e => map.set(e._id, { _id: e._id, name: e.name, email: e.email }));
    
    // Add unique assignees from loaded tasks
    uniqueAssignees.forEach(u => {
      if (!map.has(u._id)) {
        map.set(u._id, u);
      }
    });
    
    return Array.from(map.values());
  }, [currentUser, employees, uniqueAssignees]);

  // Handlers for form inputs
  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const handleEditChange = (e) => {
    setEditForm({
      ...editForm,
      [e.target.name]: e.target.value
    });
  };

  // Create task handler
  const createTask = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      alert("Task title is required");
      return;
    }
    if (!form.assignedTo) {
      alert("Please assign this task to an employee");
      return;
    }

    try {
      const payload = { ...form };
      if (!payload.leadId) delete payload.leadId; // omit if empty
      
      await api.post("/tasks", payload);
      alert("Task Created successfully!");
      
      setForm({
        title: "",
        description: "",
        assignedTo: "",
        leadId: "",
        priority: "Medium",
        dueDate: ""
      });
      setIsAddModalOpen(false);
      fetchData();
    } catch (err) {
      alert("Task creation failed: " + (err.response?.data?.message || err.message));
    }
  };

  // Update task status directly
  const handleUpdateStatus = async (taskId, newStatus) => {
    try {
      await api.put(`/tasks/${taskId}`, { status: newStatus });
      setTasks((prevTasks) =>
        prevTasks.map((t) => (t._id === taskId ? { ...t, status: newStatus } : t))
      );
    } catch (err) {
      alert("Failed to update status: " + (err.response?.data?.message || err.message));
    }
  };

  // Open Edit Modal
  const openEditModal = (task) => {
    setSelectedTask(task);
    setEditForm({
      title: task.title,
      description: task.description || "",
      assignedTo: task.assignedTo?._id || task.assignedTo || "",
      leadId: task.leadId?._id || task.leadId || "",
      priority: task.priority || "Medium",
      status: task.status || "Pending",
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : ""
    });
    setManualEditAssignee(false);
    setIsEditModalOpen(true);
  };

  // Save Task Changes
  const handleUpdateTask = async (e) => {
    e.preventDefault();
    if (!editForm.title.trim()) {
      alert("Task title is required");
      return;
    }
    if (!editForm.assignedTo) {
      alert("Please assign this task to an employee");
      return;
    }

    try {
      const payload = { ...editForm };
      if (!payload.leadId) payload.leadId = null;

      await api.put(`/tasks/${selectedTask._id}`, payload);
      alert("Task updated successfully!");
      setIsEditModalOpen(false);
      setSelectedTask(null);
      fetchData();
    } catch (err) {
      alert("Update failed: " + (err.response?.data?.message || err.message));
    }
  };

  // Delete Task
  const handleDeleteTask = async (taskId) => {
    if (!window.confirm("Are you sure you want to delete this task?")) {
      return;
    }

    try {
      await api.delete(`/tasks/${taskId}`);
      alert("Task deleted successfully!");
      setIsEditModalOpen(false);
      setSelectedTask(null);
      fetchData();
    } catch (err) {
      alert("Delete failed: " + (err.response?.data?.message || err.message));
    }
  };

  // Filtering & Search logic
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchSearch = 
        task.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchPriority = priorityFilter === "All" || task.priority === priorityFilter;
      
      const matchAssignee = assigneeFilter === "All" || 
        (task.assignedTo?._id === assigneeFilter || task.assignedTo === assigneeFilter);
      
      return matchSearch && matchPriority && matchAssignee;
    });
  }, [tasks, searchQuery, priorityFilter, assigneeFilter]);

  // Status statistics computation
  const stats = useMemo(() => {
    const total = tasks.length;
    const pending = tasks.filter((t) => t.status === "Pending").length;
    const progress = tasks.filter((t) => t.status === "In Progress").length;
    const completed = tasks.filter((t) => t.status === "Completed").length;
    return { total, pending, progress, completed };
  }, [tasks]);

  // Format Date safely
  const formatDate = (dateString) => {
    if (!dateString) return "No due date";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Invalid date";
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  // Initials helper
  const getInitials = (userObj) => {
    if (!userObj) return "?";
    const nameStr = userObj.name || userObj.email || "U";
    return nameStr.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  return (
    <Layout>
      <div className="tasks-page">
        {/* Header Section */}
        <header className="tasks-header">
          <div className="tasks-title-area">
            <p className="tasks-kicker">CRM Workflow</p>
            <h1>Task Management</h1>
          </div>
          {role === "admin" && (
            <button 
              className="tasks-add-btn"
              onClick={() => {
                setManualAssignee(false);
                setIsAddModalOpen(true);
              }}
            >
              <FaPlus /> New Task
            </button>
          )}
        </header>

        {/* Stats Row */}
        <section className="tasks-stats-row">
          <div className="tasks-stat-card">
            <div className="tasks-stat-icon total"><FaTasks /></div>
            <div className="tasks-stat-info">
              <span className="tasks-stat-value">{stats.total}</span>
              <span className="tasks-stat-label">Total Tasks</span>
            </div>
          </div>
          <div className="tasks-stat-card">
            <div className="tasks-stat-icon pending"><FaSpinner /></div>
            <div className="tasks-stat-info">
              <span className="tasks-stat-value">{stats.pending}</span>
              <span className="tasks-stat-label">Pending</span>
            </div>
          </div>
          <div className="tasks-stat-card">
            <div className="tasks-stat-icon progress"><FaSpinner /></div>
            <div className="tasks-stat-info">
              <span className="tasks-stat-value">{stats.progress}</span>
              <span className="tasks-stat-label">In Progress</span>
            </div>
          </div>
          <div className="tasks-stat-card">
            <div className="tasks-stat-icon completed"><FaCheckCircle /></div>
            <div className="tasks-stat-info">
              <span className="tasks-stat-value">{stats.completed}</span>
              <span className="tasks-stat-label">Completed</span>
            </div>
          </div>
        </section>

        {/* Toolbar section */}
        <section className="tasks-toolbar">
          <div className="tasks-toolbar-left">
            <button 
              className={`tasks-view-btn ${viewMode === "board" ? "active" : ""}`}
              onClick={() => setViewMode("board")}
            >
              <FaColumns /> Board
            </button>
            <button 
              className={`tasks-view-btn ${viewMode === "list" ? "active" : ""}`}
              onClick={() => setViewMode("list")}
            >
              <FaList /> List
            </button>
          </div>

          <div className="tasks-toolbar-right">
            <div className="tasks-search-box">
              <FaSearch />
              <input 
                type="text" 
                placeholder="Search tasks..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <select 
              className="tasks-filter-select"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
            >
              <option value="All">All Priorities</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>

            <select 
              className="tasks-filter-select"
              value={assigneeFilter}
              onChange={(e) => setAssigneeFilter(e.target.value)}
            >
              <option value="All">All Assignees</option>
              {allAvailableEmployees.map((emp) => (
                <option key={emp._id} value={emp._id}>
                  {emp.name || emp.email}
                </option>
              ))}
            </select>
          </div>
        </section>

        {/* Loading and Error states */}
        {loading ? (
          <div className="tasks-loading">
            <div className="tasks-spinner" />
            <p>Loading tasks...</p>
          </div>
        ) : error ? (
          <div className="tasks-empty-state">
            <h3>Something went wrong</h3>
            <p>{error}</p>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="tasks-empty-state">
            <FaTasks />
            <h3>No tasks found</h3>
            <p>Try resetting your search query or filters, or create a new task.</p>
          </div>
        ) : viewMode === "board" ? (
          /* Kanban Board View */
          <div className="tasks-board">
            {/* Pending Column */}
            <div className="tasks-column">
              <div className="tasks-column-header">
                <span className="tasks-column-title">Pending</span>
                <span className="tasks-column-count">
                  {filteredTasks.filter((t) => t.status === "Pending").length}
                </span>
              </div>
              <div className="tasks-list-container">
                {filteredTasks
                  .filter((t) => t.status === "Pending")
                  .map((task) => (
                    <TaskCard 
                      key={task._id} 
                      task={task} 
                      onEdit={openEditModal} 
                      onStatusChange={handleUpdateStatus}
                      formatDate={formatDate}
                      getInitials={getInitials}
                      currentUser={currentUser}
                      role={role}
                    />
                  ))}
              </div>
            </div>

            {/* In Progress Column */}
            <div className="tasks-column">
              <div className="tasks-column-header">
                <span className="tasks-column-title">In Progress</span>
                <span className="tasks-column-count">
                  {filteredTasks.filter((t) => t.status === "In Progress").length}
                </span>
              </div>
              <div className="tasks-list-container">
                {filteredTasks
                  .filter((t) => t.status === "In Progress")
                  .map((task) => (
                    <TaskCard 
                      key={task._id} 
                      task={task} 
                      onEdit={openEditModal} 
                      onStatusChange={handleUpdateStatus}
                      formatDate={formatDate}
                      getInitials={getInitials}
                      currentUser={currentUser}
                      role={role}
                    />
                  ))}
              </div>
            </div>

            {/* Completed Column */}
            <div className="tasks-column">
              <div className="tasks-column-header">
                <span className="tasks-column-title">Completed</span>
                <span className="tasks-column-count">
                  {filteredTasks.filter((t) => t.status === "Completed").length}
                </span>
              </div>
              <div className="tasks-list-container">
                {filteredTasks
                  .filter((t) => t.status === "Completed")
                  .map((task) => (
                    <TaskCard 
                      key={task._id} 
                      task={task} 
                      onEdit={openEditModal} 
                      onStatusChange={handleUpdateStatus}
                      formatDate={formatDate}
                      getInitials={getInitials}
                      currentUser={currentUser}
                      role={role}
                    />
                  ))}
              </div>
            </div>
          </div>
        ) : (
          /* List Table View */
          <div className="tasks-list-table-wrapper">
            <table className="tasks-list-table">
              <thead>
                <tr>
                  <th>Task Title</th>
                  <th>Description</th>
                  <th>Assignee</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Due Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTasks.map((task) => (
                  <tr key={task._id}>
                    <td className="tasks-list-title-cell">{task.title}</td>
                    <td className="tasks-list-desc-cell" title={task.description}>
                      {task.description || <span style={{ color: "#cbd5e1" }}>No description</span>}
                    </td>
                    <td>
                      <div className="task-card-assignee">
                        <div className="task-assignee-avatar">{getInitials(task.assignedTo)}</div>
                        <span>{task.assignedTo?.name || task.assignedTo?.email || "Unassigned"}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`task-priority-badge ${task.priority?.toLowerCase()}`}>
                        {task.priority}
                      </span>
                    </td>
                    <td>
                      {role === "admin" || task.assignedTo?._id === currentUser?._id || task.assignedTo === currentUser?._id ? (
                        <select
                          className="tasks-filter-select"
                          style={{ height: "30px", padding: "0 8px" }}
                          value={task.status}
                          onChange={(e) => handleUpdateStatus(task._id, e.target.value)}
                        >
                          <option value="Pending">Pending</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Completed">Completed</option>
                        </select>
                      ) : (
                        <span className={`task-status-badge ${task.status?.toLowerCase().replace(" ", "-")}`}>
                          {task.status}
                        </span>
                      )}
                    </td>
                    <td>
                      <div className="task-card-date">
                        <FaCalendarAlt />
                        <span>{formatDate(task.dueDate)}</span>
                      </div>
                    </td>
                    <td>
                      <div className="task-card-actions">
                        {role === "admin" ? (
                          <>
                            <button 
                              className="task-card-action-btn"
                              title="Edit Task"
                              onClick={() => openEditModal(task)}
                            >
                              <FaEdit />
                            </button>
                            <button 
                              className="task-card-action-btn" 
                              title="Delete Task"
                              onClick={() => handleDeleteTask(task._id)}
                            >
                              <FaTrash />
                            </button>
                          </>
                        ) : (
                          <span style={{ fontSize: "12px", color: "#94a3b8" }}>-</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Add Task Modal */}
        {isAddModalOpen && (
          <div className="task-modal-backdrop" onClick={() => setIsAddModalOpen(false)}>
            <div className="task-modal" onClick={(e) => e.stopPropagation()}>
              <div className="task-modal-header">
                <h2>Create New Task</h2>
                <button className="task-modal-close" onClick={() => setIsAddModalOpen(false)}>
                  <FaTimes />
                </button>
              </div>
              <form onSubmit={createTask} className="task-modal-form">
                <div className="task-form-group">
                  <label htmlFor="title">Task Title *</label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    className="task-form-input"
                    placeholder="e.g. Follow up on Leads proposal"
                    value={form.title}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="task-form-group">
                  <label htmlFor="description">Description</label>
                  <textarea
                    id="description"
                    name="description"
                    className="task-form-textarea"
                    placeholder="Describe the objective, steps, or notes..."
                    value={form.description}
                    onChange={handleChange}
                  />
                </div>

                <div className="task-form-group">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <label htmlFor="assignedTo">Assignee *</label>
                    <button 
                      type="button" 
                      style={{ background: "none", border: "none", color: "#2563eb", fontSize: "11px", fontWeight: "600", cursor: "pointer" }}
                      onClick={() => {
                        setManualAssignee(!manualAssignee);
                        setForm(f => ({ ...f, assignedTo: "" }));
                      }}
                    >
                      {manualAssignee ? "Choose from Dropdown" : "Enter raw User ID"}
                    </button>
                  </div>
                  {manualAssignee ? (
                    <input
                      type="text"
                      id="assignedTo"
                      name="assignedTo"
                      className="task-form-input"
                      placeholder="Enter 24-character Mongo User ID"
                      value={form.assignedTo}
                      onChange={handleChange}
                      required
                    />
                  ) : (
                    <select
                      id="assignedTo"
                      name="assignedTo"
                      className="task-form-select"
                      value={form.assignedTo}
                      onChange={handleChange}
                      required
                    >
                      <option value="">-- Select Employee --</option>
                      {allAvailableEmployees.map((emp) => (
                        <option key={emp._id} value={emp._id}>
                          {emp.name ? `${emp.name} (${emp.email})` : emp.email}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="task-form-row">
                  <div className="task-form-group">
                    <label htmlFor="priority">Priority</label>
                    <select
                      id="priority"
                      name="priority"
                      className="task-form-select"
                      value={form.priority}
                      onChange={handleChange}
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>

                  <div className="task-form-group">
                    <label htmlFor="dueDate">Due Date</label>
                    <input
                      type="date"
                      id="dueDate"
                      name="dueDate"
                      className="task-form-input"
                      value={form.dueDate}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="task-form-group">
                  <label htmlFor="leadId">Related Lead (Optional)</label>
                  <select
                    id="leadId"
                    name="leadId"
                    className="task-form-select"
                    value={form.leadId}
                    onChange={handleChange}
                  >
                    <option value="">-- No Related Lead --</option>
                    {leads.map((lead) => (
                      <option key={lead._id} value={lead._id}>
                        {lead.name} {lead.company ? `(${lead.company})` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="task-modal-footer">
                  <button type="button" className="task-btn-secondary" onClick={() => setIsAddModalOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="task-btn-primary">
                    Create Task
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit/Detail Task Modal */}
        {isEditModalOpen && selectedTask && (
          <div className="task-modal-backdrop" onClick={() => setIsEditModalOpen(false)}>
            <div className="task-modal" onClick={(e) => e.stopPropagation()}>
              <div className="task-modal-header">
                <h2>{role === "admin" ? "Edit Task Details" : "Task Details"}</h2>
                <button className="task-modal-close" onClick={() => setIsEditModalOpen(false)}>
                  <FaTimes />
                </button>
              </div>
              <form onSubmit={handleUpdateTask} className="task-modal-form">
                <div className="task-form-group">
                  <label htmlFor="edit-title">Task Title *</label>
                  <input
                    type="text"
                    id="edit-title"
                    name="title"
                    className="task-form-input"
                    value={editForm.title}
                    onChange={handleEditChange}
                    required
                    disabled={role !== "admin"}
                  />
                </div>

                <div className="task-form-group">
                  <label htmlFor="edit-description">Description</label>
                  <textarea
                    id="edit-description"
                    name="description"
                    className="task-form-textarea"
                    value={editForm.description}
                    onChange={handleEditChange}
                    disabled={role !== "admin"}
                  />
                </div>

                <div className="task-form-group">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <label htmlFor="edit-assignedTo">Assignee *</label>
                    {role === "admin" && (
                      <button 
                        type="button" 
                        style={{ background: "none", border: "none", color: "#2563eb", fontSize: "11px", fontWeight: "600", cursor: "pointer" }}
                        onClick={() => {
                          setManualEditAssignee(!manualEditAssignee);
                        }}
                      >
                        {manualEditAssignee ? "Choose from Dropdown" : "Enter raw User ID"}
                      </button>
                    )}
                  </div>
                  {manualEditAssignee ? (
                    <input
                      type="text"
                      id="edit-assignedTo"
                      name="assignedTo"
                      className="task-form-input"
                      value={editForm.assignedTo}
                      onChange={handleEditChange}
                      required
                      disabled={role !== "admin"}
                    />
                  ) : (
                    <select
                      id="edit-assignedTo"
                      name="assignedTo"
                      className="task-form-select"
                      value={editForm.assignedTo}
                      onChange={handleEditChange}
                      required
                      disabled={role !== "admin"}
                    >
                      <option value="">-- Select Employee --</option>
                      {allAvailableEmployees.map((emp) => (
                        <option key={emp._id} value={emp._id}>
                          {emp.name ? `${emp.name} (${emp.email})` : emp.email}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="task-form-row">
                  <div className="task-form-group">
                    <label htmlFor="edit-priority">Priority</label>
                    <select
                      id="edit-priority"
                      name="priority"
                      className="task-form-select"
                      value={editForm.priority}
                      onChange={handleEditChange}
                      disabled={role !== "admin"}
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>

                  <div className="task-form-group">
                    <label htmlFor="edit-status">Status</label>
                    <select
                      id="edit-status"
                      name="status"
                      className="task-form-select"
                      value={editForm.status}
                      onChange={handleEditChange}
                      disabled={role !== "admin" && selectedTask.assignedTo?._id !== currentUser?._id && selectedTask.assignedTo !== currentUser?._id}
                    >
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>
                </div>

                <div className="task-form-row">
                  <div className="task-form-group">
                    <label htmlFor="edit-dueDate">Due Date</label>
                    <input
                      type="date"
                      id="edit-dueDate"
                      name="dueDate"
                      className="task-form-input"
                      value={editForm.dueDate}
                      onChange={handleEditChange}
                      disabled={role !== "admin"}
                    />
                  </div>

                  <div className="task-form-group">
                    <label htmlFor="edit-leadId">Related Lead</label>
                    <select
                      id="edit-leadId"
                      name="leadId"
                      className="task-form-select"
                      value={editForm.leadId}
                      onChange={handleEditChange}
                      disabled={role !== "admin"}
                    >
                      <option value="">-- No Related Lead --</option>
                      {leads.map((lead) => (
                        <option key={lead._id} value={lead._id}>
                          {lead.name} {lead.company ? `(${lead.company})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="task-modal-footer">
                  {role === "admin" && (
                    <button 
                      type="button" 
                      className="task-btn-danger" 
                      onClick={() => handleDeleteTask(selectedTask._id)}
                    >
                      Delete Task
                    </button>
                  )}
                  <button type="button" className="task-btn-secondary" onClick={() => setIsEditModalOpen(false)}>
                    {role === "admin" ? "Cancel" : "Close"}
                  </button>
                  {(role === "admin" || selectedTask.assignedTo?._id === currentUser?._id || selectedTask.assignedTo === currentUser?._id) && (
                    <button type="submit" className="task-btn-primary">
                      Save Changes
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

// Child component for Task card
const TaskCard = ({ task, onEdit, onStatusChange, formatDate, getInitials, currentUser, role }) => {
  const isAssignee = task.assignedTo && (task.assignedTo._id === currentUser?._id || task.assignedTo === currentUser?._id);
  const canUpdateStatus = role === "admin" || isAssignee;

  return (
    <div className="task-card" onClick={() => onEdit(task)}>
      <div className="task-card-header">
        <h4 className="task-card-title">{task.title}</h4>
      </div>
      
      {task.description && (
        <p className="task-card-desc">{task.description}</p>
      )}

      {task.leadId && (
        <div style={{ fontSize: "11px", color: "#2563eb", fontWeight: "600", marginTop: "-4px" }}>
          Lead: {task.leadId.name || task.leadId.email}
        </div>
      )}

      <div className="task-card-meta">
        <div className="task-card-assignee" title={task.assignedTo?.email || "Unassigned"}>
          <div className="task-assignee-avatar">
            {getInitials(task.assignedTo)}
          </div>
          <span>{task.assignedTo?.name || task.assignedTo?.email?.split("@")[0] || "Unassigned"}</span>
        </div>

        <div className="task-card-date">
          <FaCalendarAlt />
          <span>{formatDate(task.dueDate)}</span>
        </div>
      </div>

      <div className="task-card-footer" onClick={(e) => e.stopPropagation()}>
        <span className={`task-priority-badge ${task.priority?.toLowerCase()}`}>
          {task.priority}
        </span>

        <div className="task-card-actions">
          {canUpdateStatus && task.status === "Pending" && (
            <button
              className="task-card-action-btn move-btn"
              title="Start Task"
              onClick={() => onStatusChange(task._id, "In Progress")}
            >
              Start →
            </button>
          )}
          {canUpdateStatus && task.status === "In Progress" && (
            <button
              className="task-card-action-btn move-btn"
              title="Complete Task"
              style={{ color: "#16a34a" }}
              onClick={() => onStatusChange(task._id, "Completed")}
            >
              Complete ✓
            </button>
          )}
          {canUpdateStatus && task.status === "Completed" && (
            <button
              className="task-card-action-btn move-btn"
              title="Reopen Task"
              style={{ color: "#d97706" }}
              onClick={() => onStatusChange(task._id, "Pending")}
            >
              Reopen ⟲
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Tasks;