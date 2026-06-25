import Task from "../models/Task.js";
import Notification from "../models/Notification.js";
import User from "../models/User.js";
import sendEmail from "../utils/sendEmail.js";

// CREATE TASK (Admin Only)
export const createTask = async (req, res) => {
  try {
    if (!req.user.resolvedPermissions.includes("tasks:create")) {
      return res.status(403).json({
        message: "Access Denied: You do not have permission to create tasks."
      });
    }

    const task = await Task.create({
      title: req.body.title,
      description: req.body.description,
      assignedTo: req.body.assignedTo,
      leadId: req.body.leadId,
      priority: req.body.priority,
      dueDate: req.body.dueDate,
      createdBy: req.user.id
    });

    // Notify employee of assignment
    try {
      await Notification.create({
        recipient: req.body.assignedTo,
        sender: req.user.id,
        type: "task_assigned",
        title: "New Task Assigned",
        message: `${req.user.name || req.user.email} assigned you a task: "${task.title}".`,
        link: "/dashboard/tasks"
      });

      const assigneeUser = await User.findById(req.body.assignedTo);
      if (assigneeUser && assigneeUser.email) {
        await sendEmail({
          to: assigneeUser.email,
          subject: `New CRM Task Assigned: ${task.title}`,
          text: `Hello ${assigneeUser.name || "Employee"},\n\nYou have been assigned a new task: "${task.title}".\n\nPriority: ${task.priority}\nDue Date: ${task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "No due date"}\nDescription: ${task.description || "No description provided."}\n\nLink to Tasks Board: http://localhost:5173/dashboard/tasks`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
              <h2 style="color: #2563eb; text-align: center;">New Task Assigned</h2>
              <p>Hello <strong>${assigneeUser.name || "Employee"}</strong>,</p>
              <p>You have been assigned a new task in the CRM system by <strong>${req.user.name || req.user.email}</strong>:</p>
              <div style="background: #f8fafc; padding: 16px; border-radius: 6px; margin: 20px 0; border: 1px solid #e2e8f0;">
                <p style="margin: 4px 0;"><strong>Task Title:</strong> ${task.title}</p>
                <p style="margin: 4px 0;"><strong>Priority:</strong> <span style="font-weight: bold; color: ${task.priority === "High" ? "#ef4444" : task.priority === "Medium" ? "#d97706" : "#16a34a"};">${task.priority}</span></p>
                <p style="margin: 4px 0;"><strong>Due Date:</strong> ${task.dueDate ? new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "No due date"}</p>
                <p style="margin: 8px 0 0 0;"><strong>Description:</strong></p>
                <p style="margin: 4px 0; color: #475569; font-style: italic;">${task.description || "No description provided."}</p>
              </div>
              <p style="text-align: center; margin: 24px 0 10px;">
                <a href="http://localhost:5173/dashboard/tasks" style="background: #2563eb; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">View Tasks Board</a>
              </p>
              <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
              <p style="font-size: 12px; color: #64748b; text-align: center;">CRM System Alerts</p>
            </div>
          `
        });
      }
    } catch (notifErr) {
      console.error("Failed to create task_assigned notification/email:", notifErr);
    }

    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

// GET ALL TASKS
export const getTasks = async (req, res) => {
  try {
    const tasks = await Task.find()
      .populate("assignedTo", "name email")
      .populate("leadId");

    res.json(tasks);
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

// UPDATE TASK (Admin full edit, Employee status-only for assigned tasks)
export const updateTask = async (req, res) => {
  try {
    const existingTask = await Task.findById(req.params.id);
    if (!existingTask) {
      return res.status(404).json({ message: "Task not found." });
    }

    let updateData = {};

    if (req.user.resolvedPermissions.includes("tasks:update")) {
      updateData = req.body;
    } else {
      // Check if task is assigned to this employee
      if (existingTask.assignedTo.toString() !== req.user.id) {
        return res.status(403).json({
          message: "Access Denied: You can only update tasks assigned to you."
        });
      }

      // Employees can only update the status field
      if (req.body.status) {
        updateData = { status: req.body.status };
      } else {
        return res.status(403).json({
          message: "Access Denied: Employees can only update task status."
        });
      }
    }

    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate("assignedTo", "name email").populate("leadId");

    // Send notifications based on who performed the update
    try {
      if (!req.user.resolvedPermissions.includes("tasks:update")) {
        // Employee updated status: notify task creator (Admin)
        if (existingTask.createdBy && existingTask.createdBy.toString() !== req.user.id) {
          await Notification.create({
            recipient: existingTask.createdBy,
            sender: req.user.id,
            type: "task_updated",
            title: "Task Status Updated",
            message: `${req.user.name || req.user.email} updated task "${existingTask.title}" status to "${req.body.status}".`,
            link: "/dashboard/tasks"
          });
        }
      } else {
        // Admin updated the task: notify the assignee
        if (existingTask.assignedTo && existingTask.assignedTo.toString() !== req.user.id) {
          await Notification.create({
            recipient: existingTask.assignedTo,
            sender: req.user.id,
            type: "task_updated",
            title: "Task Details Updated",
            message: `${req.user.name || req.user.email} updated details for your task: "${existingTask.title}".`,
            link: "/dashboard/tasks"
          });
        }
      }

      // Check if status changed to Completed -> send email to creator
      if (req.body.status === "Completed" && existingTask.status !== "Completed") {
        const creatorUser = await User.findById(existingTask.createdBy);
        if (creatorUser && creatorUser.email) {
          await sendEmail({
            to: creatorUser.email,
            subject: `CRM Task Completed: ${existingTask.title}`,
            text: `Hello ${creatorUser.name || "Admin"},\n\nThe task "${existingTask.title}" has been marked as Completed.\n\nCompleted By: ${req.user.name || req.user.email}\nDescription: ${existingTask.description || "No description provided."}\n\nLink to Tasks Board: http://localhost:5173/dashboard/tasks`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
                <h2 style="color: #16a34a; text-align: center;">Task Completed</h2>
                <p>Hello <strong>${creatorUser.name || "Admin"}</strong>,</p>
                <p>The task you created has been marked as <strong>Completed</strong> by <strong>${req.user.name || req.user.email}</strong>:</p>
                <div style="background: #f8fafc; padding: 16px; border-radius: 6px; margin: 20px 0; border: 1px solid #e2e8f0;">
                  <p style="margin: 4px 0;"><strong>Task Title:</strong> ${existingTask.title}</p>
                  <p style="margin: 4px 0;"><strong>Status:</strong> <span style="font-weight: bold; color: #16a34a;">Completed</span></p>
                  <p style="margin: 4px 0;"><strong>Completed Date:</strong> ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                </div>
                <p style="text-align: center; margin: 24px 0 10px;">
                  <a href="http://localhost:5173/dashboard/tasks" style="background: #16a34a; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">View Tasks Board</a>
                </p>
                <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
                <p style="font-size: 12px; color: #64748b; text-align: center;">CRM System Alerts</p>
              </div>
            `
          });
        }
      }
    } catch (notifErr) {
      console.error("Failed to create task_updated notification/email:", notifErr);
    }

    res.json(updatedTask);
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

// DELETE TASK (Admin Only)
export const deleteTask = async (req, res) => {
  try {
    if (!req.user.resolvedPermissions.includes("tasks:delete")) {
      return res.status(403).json({
        message: "Access Denied: You do not have permission to delete tasks."
      });
    }

    await Task.findByIdAndDelete(req.params.id);
    res.json({
      message: "Task deleted"
    });
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};