import Customer from "../models/Customer.js";

// GET ALL CUSTOMERS
export const getCustomers = async (req, res) => {
  try {
    if (!req.user.resolvedPermissions.includes("customers:read")) {
      return res.status(403).json({
        message: "Access Denied: You do not have permission to view customers.",
      });
    }

    const customers = await Customer.find().populate("sourceLead");
    res.status(200).json(customers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET CUSTOMER BY ID
export const getCustomerById = async (req, res) => {
  try {
    if (!req.user.resolvedPermissions.includes("customers:read")) {
      return res.status(403).json({
        message: "Access Denied: You do not have permission to view customers.",
      });
    }

    const customer = await Customer.findById(req.params.id).populate("sourceLead");
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    res.status(200).json(customer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// UPDATE CUSTOMER
export const updateCustomer = async (req, res) => {
  try {
    if (!req.user.resolvedPermissions.includes("customers:update")) {
      return res.status(403).json({
        message: "Access Denied: You do not have permission to update customers.",
      });
    }

    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    ).populate("sourceLead");

    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    res.status(200).json(customer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE CUSTOMER
export const deleteCustomer = async (req, res) => {
  try {
    if (!req.user.resolvedPermissions.includes("customers:delete")) {
      return res.status(403).json({
        message: "Access Denied: You do not have permission to delete customers.",
      });
    }

    const customer = await Customer.findByIdAndDelete(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    res.status(200).json({ message: "Customer deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ADD NOTE TO CUSTOMER
export const addCustomerNote = async (req, res) => {
  try {
    if (!req.user.resolvedPermissions.includes("customers:update")) {
      return res.status(403).json({
        message: "Access Denied: You do not have permission to modify customers.",
      });
    }

    const { text, type } = req.body;
    if (!text) {
      return res.status(400).json({ message: "Note text is required." });
    }

    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found." });
    }

    const authorName = req.user.name || req.user.email;
    customer.notes.push({ text, type, authorName, createdAt: new Date() });
    await customer.save();

    res.status(200).json(customer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
