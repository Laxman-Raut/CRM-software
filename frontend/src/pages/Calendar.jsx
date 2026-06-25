import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import { getEvents, createEvent, deleteEvent } from "../services/eventServices";
import {
  FaChevronLeft,
  FaChevronRight,
  FaPlus,
  FaCalendarDay,
  FaTrashAlt,
  FaPhoneAlt,
  FaHandshake,
  FaTasks,
  FaCalendarAlt,
  FaFilter,
  FaListUl,
  FaCalendar
} from "react-icons/fa";
import "./Calendar.css";

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [time, setTime] = useState("12:00");
  const [eventType, setEventType] = useState("meeting");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeView, setActiveView] = useState("month"); // 'month' or 'agenda'
  const [visibleTypes, setVisibleTypes] = useState({
    meeting: true,
    call: true,
    task: true,
    other: true,
  });

  const email = localStorage.getItem("email") || "";
  const name = localStorage.getItem("name") || "";
  const role = localStorage.getItem("role") || "employee";

  // Fetch events on mount
  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await getEvents();
      setEvents(Array.isArray(res.data) ? res.data : []);
      setError("");
    } catch (error) {
      console.error("Failed to load events", error);
      setError("Failed to load calendar events.");
    } finally {
      setLoading(false);
    }
  };

  // Navigating months
  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  // Month stats calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Days in month logic
  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();
  const prevTotalDays = new Date(year, month, 0).getDate();

  const daysGrid = [];

  // Padding days from previous month
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    daysGrid.push({
      day: prevTotalDays - i,
      month: month === 0 ? 11 : month - 1,
      year: month === 0 ? year - 1 : year,
      isCurrentMonth: false,
    });
  }

  // Current month days
  for (let i = 1; i <= totalDays; i++) {
    daysGrid.push({
      day: i,
      month: month,
      year: year,
      isCurrentMonth: true,
    });
  }

  // Padding days for next month to complete 42 cells (7x6 grid)
  const remainingCells = 42 - daysGrid.length;
  for (let i = 1; i <= remainingCells; i++) {
    daysGrid.push({
      day: i,
      month: month === 11 ? 0 : month + 1,
      year: month === 11 ? year + 1 : year,
      isCurrentMonth: false,
    });
  }

  // Filter events for a specific cell date, checking type visibility filters
  const getEventsForDate = (day, m, y) => {
    return events.filter((event) => {
      const eDate = new Date(event.date);
      const matchesDate = (
        eDate.getDate() === day &&
        eDate.getMonth() === m &&
        eDate.getFullYear() === y
      );
      const type = event.type || "meeting";
      const matchesFilter = visibleTypes[type];
      return matchesDate && matchesFilter;
    });
  };

  // Check if a day is today
  const isToday = (day, m, y) => {
    const today = new Date();
    return (
      today.getDate() === day &&
      today.getMonth() === m &&
      today.getFullYear() === y
    );
  };

  // Check if a day is selected
  const isSelected = (day, m, y) => {
    return (
      selectedDate.getDate() === day &&
      selectedDate.getMonth() === m &&
      selectedDate.getFullYear() === y
    );
  };

  // Select day handler
  const handleSelectDay = (dayObj) => {
    setSelectedDate(new Date(dayObj.year, dayObj.month, dayObj.day));
  };

  // Submit Event Form handler
  const handleSaveEvent = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      alert("Please enter a meeting title.");
      return;
    }

    const scheduledDate = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      selectedDate.getDate()
    );

    if (time) {
      const [hours, minutes] = time.split(":");
      scheduledDate.setHours(parseInt(hours, 10) || 0);
      scheduledDate.setMinutes(parseInt(minutes, 10) || 0);
    }

    const eventPayload = {
      title: title.trim(),
      description: description.trim(),
      type: eventType,
      date: scheduledDate.toISOString(),
      createdby: name || email || "System User",
      role: role,
    };

    try {
      await createEvent(eventPayload);
      setTitle("");
      setDescription("");
      setTime("12:00");
      setEventType("meeting");
      fetchEvents(); // Refresh items
    } catch (err) {
      console.error("Failed to create event", err);
      alert("Failed to schedule the meeting. Please try again.");
    }
  };

  // Delete event handler
  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm("Are you sure you want to delete this event?")) {
      return;
    }
    try {
      await deleteEvent(eventId);
      fetchEvents(); // Refresh items
    } catch (err) {
      console.error("Failed to delete event", err);
      alert("Failed to delete event. Please try again.");
    }
  };

  const selectedDayEvents = getEventsForDate(
    selectedDate.getDate(),
    selectedDate.getMonth(),
    selectedDate.getFullYear()
  );

  // Group events for the current month (for Agenda view)
  const currentMonthEvents = events.filter((event) => {
    const eDate = new Date(event.date);
    const matchesMonth = eDate.getMonth() === month && eDate.getFullYear() === year;
    const type = event.type || "meeting";
    const matchesFilter = visibleTypes[type];
    return matchesMonth && matchesFilter;
  });

  const sortedMonthEvents = [...currentMonthEvents].sort(
    (a, b) => new Date(a.date) - new Date(b.date)
  );

  const groupedAgendaEvents = sortedMonthEvents.reduce((groups, event) => {
    const dateStr = new Date(event.date).toLocaleDateString(undefined, {
      weekday: "long",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    if (!groups[dateStr]) {
      groups[dateStr] = [];
    }
    groups[dateStr].push(event);
    return groups;
  }, {});

  const getEventIcon = (type) => {
    switch (type) {
      case "call":
        return <FaPhoneAlt />;
      case "task":
        return <FaTasks />;
      case "other":
        return <FaCalendarAlt />;
      case "meeting":
      default:
        return <FaHandshake />;
    }
  };

  const getEventTypeName = (type) => {
    switch (type) {
      case "call": return "Call";
      case "task": return "Task";
      case "other": return "Other";
      case "meeting":
      default:
        return "Meeting";
    }
  };

  const handleToggleTypeFilter = (type) => {
    setVisibleTypes((prev) => ({
      ...prev,
      [type]: !prev[type],
    }));
  };

  return (
    <Layout>
      <div className="calendar-page">
        <header className="calendar-header">
          <div className="calendar-title-area">
            <h1 id="calendar-main-title">Calendar Schedule</h1>
            <p className="calendar-kicker">Meetings & Corporate Events</p>
          </div>
          <div className="calendar-views-toggle">
            <button
              className={`view-toggle-btn ${activeView === "month" ? "active" : ""}`}
              onClick={() => setActiveView("month")}
            >
              <FaCalendar className="view-toggle-icon" /> Month
            </button>
            <button
              className={`view-toggle-btn ${activeView === "agenda" ? "active" : ""}`}
              onClick={() => setActiveView("agenda")}
            >
              <FaListUl className="view-toggle-icon" /> Agenda
            </button>
          </div>
        </header>

        {/* Global Event Type Filters */}
        <div className="calendar-filters-card">
          <span className="filter-title">
            <FaFilter /> Filter Schedule:
          </span>
          <div className="filter-checkboxes">
            <label className={`filter-chip badge-meeting ${visibleTypes.meeting ? "active" : "inactive-chip"}`}>
              <input
                type="checkbox"
                checked={visibleTypes.meeting}
                onChange={() => handleToggleTypeFilter("meeting")}
              />
              <FaHandshake /> Meetings
            </label>
            <label className={`filter-chip badge-call ${visibleTypes.call ? "active" : "inactive-chip"}`}>
              <input
                type="checkbox"
                checked={visibleTypes.call}
                onChange={() => handleToggleTypeFilter("call")}
              />
              <FaPhoneAlt /> Calls
            </label>
            <label className={`filter-chip badge-task ${visibleTypes.task ? "active" : "inactive-chip"}`}>
              <input
                type="checkbox"
                checked={visibleTypes.task}
                onChange={() => handleToggleTypeFilter("task")}
              />
              <FaTasks /> Tasks
            </label>
            <label className={`filter-chip badge-other ${visibleTypes.other ? "active" : "inactive-chip"}`}>
              <input
                type="checkbox"
                checked={visibleTypes.other}
                onChange={() => handleToggleTypeFilter("other")}
              />
              <FaCalendarAlt /> Other
            </label>
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="calendar-layout">
          {/* Main Month Calendar grid or Agenda list */}
          <div className="calendar-main-view">
            {activeView === "month" ? (
              <div className="calendar-card">
                <div className="calendar-nav-bar">
                  <button className="calendar-nav-btn" onClick={handlePrevMonth}>
                    <FaChevronLeft /> Prev
                  </button>
                  <span className="calendar-nav-title">
                    {monthNames[month]} {year}
                  </span>
                  <button className="calendar-nav-btn" onClick={handleNextMonth}>
                    Next <FaChevronRight />
                  </button>
                </div>

                <div className="calendar-weekdays">
                  {weekdays.map((day) => (
                    <div key={day}>{day}</div>
                  ))}
                </div>

                <div className="calendar-grid">
                  {daysGrid.map((dayObj, index) => {
                    const cellEvents = getEventsForDate(dayObj.day, dayObj.month, dayObj.year);
                    const cellIsToday = isToday(dayObj.day, dayObj.month, dayObj.year);
                    const cellIsSelected = isSelected(dayObj.day, dayObj.month, dayObj.year);

                    return (
                      <div
                        key={index}
                        className={`calendar-day-cell ${!dayObj.isCurrentMonth ? "inactive" : ""} ${
                          cellIsToday ? "today" : ""
                        } ${cellIsSelected ? "selected" : ""}`}
                        onClick={() => handleSelectDay(dayObj)}
                      >
                        <span className="calendar-day-number">{dayObj.day}</span>
                        {cellEvents.length > 0 && (
                          <div className="calendar-day-badges">
                            {cellEvents.slice(0, 2).map((event, eIdx) => {
                              const type = event.type || "meeting";
                              return (
                                <div
                                  key={event._id || eIdx}
                                  className={`calendar-day-badge badge-${type}`}
                                  title={`${getEventTypeName(type)}: ${event.title}`}
                                >
                                  {getEventIcon(type)}
                                  <span className="badge-text">{event.title}</span>
                                </div>
                              );
                            })}
                            {cellEvents.length > 2 && (
                              <div className="calendar-day-badge-more">
                                +{cellEvents.length - 2} more
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              // Agenda View
              <div className="calendar-card agenda-view-card">
                <div className="calendar-nav-bar">
                  <button className="calendar-nav-btn" onClick={handlePrevMonth}>
                    <FaChevronLeft /> Prev
                  </button>
                  <span className="calendar-nav-title">
                    {monthNames[month]} {year} Agenda
                  </span>
                  <button className="calendar-nav-btn" onClick={handleNextMonth}>
                    Next <FaChevronRight />
                  </button>
                </div>

                <div className="calendar-agenda-container">
                  {loading ? (
                    <div className="calendar-empty-state">Loading agenda events...</div>
                  ) : Object.keys(groupedAgendaEvents).length === 0 ? (
                    <div className="calendar-empty-state">
                      <FaCalendarDay className="empty-state-icon" />
                      <p>No scheduled events found for {monthNames[month]} {year} matching the filters.</p>
                    </div>
                  ) : (
                    Object.keys(groupedAgendaEvents).map((dateHeader) => (
                      <div key={dateHeader} className="agenda-group">
                        <h3 className="agenda-date-header">{dateHeader}</h3>
                        <div className="agenda-items-list">
                          {groupedAgendaEvents[dateHeader].map((event) => {
                            const type = event.type || "meeting";
                            return (
                              <div key={event._id} className={`agenda-item-card border-${type}`}>
                                <div className="agenda-item-meta">
                                  <div className={`agenda-type-indicator text-${type}`}>
                                    {getEventIcon(type)}
                                    <span>{getEventTypeName(type)}</span>
                                  </div>
                                  <span className="agenda-item-time">
                                    {new Date(event.date).toLocaleTimeString(undefined, {
                                      timeStyle: "short",
                                    })}
                                  </span>
                                </div>
                                <div className="agenda-item-content">
                                  <h4 className="agenda-item-title">{event.title}</h4>
                                  {event.description && <p className="agenda-item-desc">{event.description}</p>}
                                  <span className="agenda-item-author">
                                    Created by: {event.createdby} ({event.role})
                                  </span>
                                </div>
                                <button
                                  className="agenda-delete-btn"
                                  title="Delete Event"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteEvent(event._id);
                                  }}
                                >
                                  <FaTrashAlt />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Panel details & Creation Form */}
          <div className="calendar-side-panel">
            {/* Event List Section */}
            <div className="calendar-panel-section">
              <h2>Events on {selectedDate.toLocaleDateString(undefined, { dateStyle: "medium" })}</h2>
              <div className="calendar-events-list">
                {loading ? (
                  <p className="calendar-empty-state">Loading calendar events...</p>
                ) : selectedDayEvents.length === 0 ? (
                  <p className="calendar-empty-state">No meetings scheduled for this day.</p>
                ) : (
                  selectedDayEvents.map((event) => {
                    const type = event.type || "meeting";
                    return (
                      <div key={event._id} className={`calendar-event-card border-${type}`}>
                        <div className="calendar-event-header-row">
                          <span className={`calendar-event-type-badge badge-${type}`}>
                            {getEventIcon(type)} {getEventTypeName(type)}
                          </span>
                          <button
                            className="calendar-event-delete-btn"
                            title="Delete Event"
                            onClick={() => handleDeleteEvent(event._id)}
                          >
                            <FaTrashAlt />
                          </button>
                        </div>
                        <span className="calendar-event-title">{event.title}</span>
                        {event.description && <p className="calendar-event-desc">{event.description}</p>}
                        <div className="calendar-event-meta">
                          <span className="calendar-event-time">
                            {new Date(event.date).toLocaleTimeString(undefined, {
                              timeStyle: "short",
                            })}
                          </span>
                          <span className="calendar-event-creator">
                            By: {event.createdby} ({event.role})
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Event Creation Form */}
            <div className="calendar-panel-section">
              <h2>Schedule Event</h2>
              <form className="calendar-form" onSubmit={handleSaveEvent}>
                <div className="calendar-form-group">
                  <label htmlFor="meeting-title">Event Title</label>
                  <input
                    id="meeting-title"
                    className="calendar-form-input"
                    type="text"
                    placeholder="Enter title..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="calendar-form-group">
                  <label htmlFor="meeting-type">Event Type</label>
                  <select
                    id="meeting-type"
                    className="calendar-form-input"
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value)}
                  >
                    <option value="meeting">Meeting 🤝</option>
                    <option value="call">Call 📞</option>
                    <option value="task">Task 📝</option>
                    <option value="other">Other 📅</option>
                  </select>
                </div>

                <div className="calendar-form-group">
                  <label htmlFor="meeting-desc">Description</label>
                  <textarea
                    id="meeting-desc"
                    className="calendar-form-textarea"
                    placeholder="Enter details..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                <div className="calendar-form-group">
                  <label htmlFor="meeting-time">Time</label>
                  <input
                    id="meeting-time"
                    className="calendar-form-input"
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                  />
                </div>

                <button className="calendar-submit-btn" type="submit">
                  <FaPlus /> Schedule
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Calendar;