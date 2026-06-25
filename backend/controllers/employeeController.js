import bcrypt from "bcryptjs";
import User from "../models/User.js";
import sendEmail from "../utils/sendEmail.js";

// GET ALL EMPLOYEES
export const getEmployees = async (req, res) => {
  try {
    // Allow any authenticated user to list team members (admins + employees)
    const employees = await User.find({}).select("-password");
    res.status(200).json(employees);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// CREATE EMPLOYEE
export const createEmployee = async (req, res) => {
  try {
    if (!req.user.resolvedPermissions.includes("employees:manage")) {
      return res.status(403).json({ message: "Access Denied: Manage employees permission required." });
    }

    const { name, email, password, designation, role, permissions } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Please provide name, email, and password." });
    }

    const normalizedEmail = email.toLowerCase();

    // Check if user already exists
    const userExists = await User.findOne({ email: normalizedEmail });
    if (userExists) {
      return res.status(400).json({ message: "User already exists with this email." });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const newEmployee = await User.create({
      name,
      email: normalizedEmail,
      password: hashedPassword,
      role: role || "Employee",
      designation: designation || "",
      permissions: {
        canViewLeads: permissions?.canViewLeads || false,
        canUpdateLeads: permissions?.canUpdateLeads || false,
        canDeleteLeads: permissions?.canDeleteLeads || false,
      },
    });

    const responseData = newEmployee.toObject();
    delete responseData.password;

    // Send onboarding welcome email
    try {
      await sendEmail({
        to: normalizedEmail,
        subject: "Welcome to mini-CRM - Account Created",
        text: `Hello ${name},\n\nAn employee account has been created for you on the CRM platform.\n\nDesignation: ${designation || "Not specified"}\nLogin Portal: http://localhost:5173/login\nEmail: ${normalizedEmail}\nPassword: ${password}\n\nPlease update your password after logging in.\n\nBest regards,\nCRM Admin Team`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
            <h2 style="color: #2563eb; text-align: center;">Welcome to mini-CRM!</h2>
            <p>Hello <strong>${name}</strong>,</p>
            <p>Your employee account has been successfully created. Here are your credentials to log in to the platform:</p>
            <div style="background: #f8fafc; padding: 16px; border-radius: 6px; margin: 20px 0; border: 1px solid #e2e8f0;">
              <p style="margin: 4px 0;"><strong>Designation:</strong> ${designation || "Not specified"}</p>
              <p style="margin: 4px 0;"><strong>Login URL:</strong> <a href="http://localhost:5173/login">http://localhost:5173/login</a></p>
              <p style="margin: 4px 0;"><strong>Username / Email:</strong> ${normalizedEmail}</p>
              <p style="margin: 4px 0;"><strong>Temporary Password:</strong> <code style="background: #e2e8f0; padding: 2px 6px; border-radius: 4px;">${password}</code></p>
            </div>
            <p>Please log in and update your password as soon as possible.</p>
            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
            <p style="font-size: 12px; color: #64748b; text-align: center;">CRM System Admin Team</p>
          </div>
        `
      });
    } catch (mailErr) {
      console.error("Failed to send onboarding welcome email:", mailErr);
    }

    res.status(201).json(responseData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// UPDATE EMPLOYEE PERMISSIONS
export const updateEmployeePermissions = async (req, res) => {
  try {
    if (!req.user.resolvedPermissions.includes("employees:manage")) {
      return res.status(403).json({ message: "Access Denied: Manage employees permission required." });
    }

    const { id } = req.params;
    const { permissions } = req.body;

    if (!permissions) {
      return res.status(400).json({ message: "Please provide permissions to update." });
    }

    const employee = await User.findById(id);
    if (!employee || (employee.role && employee.role.toLowerCase() === "admin")) {
      return res.status(404).json({ message: "Employee not found or is an Administrator." });
    }

    employee.permissions = {
      canViewLeads: permissions.canViewLeads !== undefined ? permissions.canViewLeads : (employee.permissions?.canViewLeads || false),
      canUpdateLeads: permissions.canUpdateLeads !== undefined ? permissions.canUpdateLeads : (employee.permissions?.canUpdateLeads || false),
      canDeleteLeads: permissions.canDeleteLeads !== undefined ? permissions.canDeleteLeads : (employee.permissions?.canDeleteLeads || false),
    };

    await employee.save();

    res.status(200).json({
      message: "Employee permissions updated successfully.",
      permissions: employee.permissions,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE EMPLOYEE
export const deleteEmployee = async (req, res) => {
  try {
    if (!req.user.resolvedPermissions.includes("employees:manage")) {
      return res.status(403).json({ message: "Access Denied: Manage employees permission required." });
    }

    const { id } = req.params;

    const employee = await User.findById(id);
    if (!employee || (employee.role && employee.role.toLowerCase() === "admin")) {
      return res.status(404).json({ message: "Employee not found or is an Administrator." });
    }

    await User.findByIdAndDelete(id);

    res.status(200).json({
      message: "Employee removed successfully.",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// UPDATE EMPLOYEE DETAILS
export const updateEmployee = async (req, res) => {
  try {
    if (!req.user.resolvedPermissions.includes("employees:manage")) {
      return res.status(403).json({ message: "Access Denied: Manage employees permission required." });
    }

    const { id } = req.params;

    const employee = await User.findById(id);
    if (!employee || (employee.role && employee.role.toLowerCase() === "admin")) {
      return res.status(404).json({ message: "Employee not found or is an Administrator." });
    }

    const { name, email, designation, role } = req.body;
    
    if (email && email.toLowerCase() !== employee.email) {
      // Check if email already exists
      const userExists = await User.findOne({ email: email.toLowerCase() });
      if (userExists) {
        return res.status(400).json({ message: "User already exists with this email." });
      }
      employee.email = email.toLowerCase();
    }

    if (name) employee.name = name;
    if (designation !== undefined) employee.designation = designation;
    if (role) {
      if (role.toLowerCase() === "admin" && req.user.role.toLowerCase() !== "admin") {
        return res.status(403).json({ message: "Access Denied: Only Admins can assign the Admin role." });
      }
      employee.role = role;
    }

    await employee.save();

    const responseData = employee.toObject();
    delete responseData.password;

    res.status(200).json(responseData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
