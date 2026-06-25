import Setting from "../models/Setting.js";

// GET SETTINGS
export const getSettings = async (req, res) => {
  try {
    let settings = await Setting.findOne();
    if (!settings) {
      // Create defaults if not present
      settings = await Setting.create({
        crmName: "Sales CRM",
        currency: "INR",
        companyName: "",
        supportEmail: "",
        supportPhone: "",
        allowEmployeeViewCustomers: true
      });
    }
    res.status(200).json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// UPDATE SETTINGS
export const updateSettings = async (req, res) => {
  try {
    if (!req.user.resolvedPermissions.includes("settings:manage")) {
      return res.status(403).json({
        message: "Access Denied: You do not have permission to edit CRM settings.",
      });
    }

    let settings = await Setting.findOne();
    if (!settings) {
      settings = await Setting.create(req.body);
    } else {
      settings = await Setting.findByIdAndUpdate(
        settings._id,
        req.body,
        { new: true }
      );
    }
    res.status(200).json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
