import Deal from "../models/Deal.js";
import Customer from "../models/Customer.js";
import sendEmail from "../utils/sendEmail.js";

const sendCongratulationsEmail = async (deal) => {
  const to = deal.email;
  const subject = `Congratulations, ${deal.dealName}! Welcome to Our Family`;

  let itemsHtml = "";
  if (deal.products && deal.products.length > 0) {
    itemsHtml = `
      <div style="margin: 24px 0; padding: 16px; background-color: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0;">
        <h4 style="margin: 0 0 12px; color: #0f172a; font-size: 14px;">Your Purchase Summary</h4>
        <table style="width: 100%; border-collapse: collapse; font-size: 13px; text-align: left;">
          <thead>
            <tr style="border-bottom: 1px solid #e2e8f0; color: #475569;">
              <th style="padding: 6px 0; text-align: left;">Product/Service</th>
              <th style="padding: 6px 0; text-align: center;">Qty</th>
              <th style="padding: 6px 0; text-align: right;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${deal.products.map(p => `
              <tr style="border-bottom: 1px solid #f1f5f9; color: #0f172a;">
                <td style="padding: 8px 0; text-align: left; font-weight: 500;">${p.name}</td>
                <td style="padding: 8px 0; text-align: center;">${p.quantity}</td>
                <td style="padding: 8px 0; text-align: right;">INR ${(p.price || 0).toLocaleString("en-IN")}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
        <div style="text-align: right; margin-top: 12px; font-weight: bold; color: #10b981;">
          Total Portfolio Value: INR ${(deal.value || 0).toLocaleString("en-IN")}
        </div>
      </div>
    `;
  }

  const html = `
    <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: auto; padding: 40px 30px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
      <div style="text-align: center; margin-bottom: 24px;">
        <span style="font-size: 40px;">🎉</span>
      </div>
      <h2 style="color: #10b981; text-align: center; font-size: 24px; font-weight: 800; margin-top: 0;">Deal Successfully Won!</h2>
      <p style="color: #0f172a; font-size: 16px; font-weight: 600; text-align: center; margin-bottom: 8px;">Welcome aboard, ${deal.dealName}!</p>
      <p style="color: #475569; font-size: 14px; line-height: 1.6; text-align: center; margin-top: 0;">
        We are thrilled to officially welcome you as our customer. Our team is fully committed to delivering the best value and supporting your business goals.
      </p>

      ${itemsHtml}

      <div style="text-align: center; margin: 30px 0;">
        <a href="http://localhost:5174" style="background-color: #10b981; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px; display: inline-block;">
          Visit Portal
        </a>
      </div>

      <p style="color: #475569; font-size: 13px; line-height: 1.5; text-align: center;">
        If you have any questions or require immediate assistance, feel free to reply directly to this email.
      </p>

      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
      <p style="font-size: 11px; color: #94a3b8; text-align: center; margin: 0;">
        This email was sent automatically by the CRM system to celebrate our new partnership.
      </p>
    </div>
  `;

  const text = `Congratulations, ${deal.dealName}! Your deal has been successfully won. Welcome aboard!`;

  await sendEmail({ to, subject, text, html });
};

// Helper to sync or create Customer
const checkAndCreateCustomer = async (deal) => {
  if (deal.stage === "Won" || deal.status === "Won") {
    try {
      let existingCustomer = await Customer.findOne({
        $or: [
          { sourceDeal: deal._id },
          { sourceLead: deal.sourceLead }
        ].filter(cond => cond.sourceLead || cond.sourceDeal)
      });

      const customerPurchases = deal.products?.map(p => ({
        name: p.name,
        quantity: p.quantity,
        price: p.price,
        purchaseDate: new Date()
      })) || [];

      if (!existingCustomer) {
        existingCustomer = await Customer.create({
          customerName: deal.dealName,
          company: deal.company || "",
          email: deal.email,
          phone: deal.phone,
          sourceLead: deal.sourceLead,
          sourceDeal: deal._id,
          value: deal.value || 0,
          notes: deal.notes || [],
          purchases: customerPurchases,
          status: "Active"
        });

        // Send beautiful congratulations email to customer
        try {
          await sendCongratulationsEmail(deal);
        } catch (emailErr) {
          console.error("Failed to send congratulations email:", emailErr);
        }
      } else {
        // Sync
        existingCustomer.customerName = deal.dealName;
        existingCustomer.company = deal.company || "";
        existingCustomer.email = deal.email;
        existingCustomer.phone = deal.phone;
        existingCustomer.value = deal.value || 0;
        existingCustomer.sourceDeal = deal._id;
        existingCustomer.purchases = customerPurchases;
        await existingCustomer.save();
      }
    } catch (err) {
      console.error("Failed to auto-create or sync customer from Deal:", err);
    }
  }
};

// GET ALL DEALS
export const getDeals = async (req, res) => {
  try {
    if (!req.user.resolvedPermissions.includes("deals:read")) {
      return res.status(403).json({
        message: "Access Denied: You do not have permission to view deals.",
      });
    }

    const deals = await Deal.find().populate("sourceLead");
    res.status(200).json(deals);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET DEAL BY ID
export const getDealById = async (req, res) => {
  try {
    if (!req.user.resolvedPermissions.includes("deals:read")) {
      return res.status(403).json({
        message: "Access Denied: You do not have permission to view deals.",
      });
    }

    const deal = await Deal.findById(req.params.id).populate("sourceLead");
    if (!deal) {
      return res.status(404).json({ message: "Deal not found" });
    }

    res.status(200).json(deal);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// CREATE DEAL
export const createDeal = async (req, res) => {
  try {
    if (!req.user.resolvedPermissions.includes("deals:create")) {
      return res.status(403).json({
        message: "Access Denied: You do not have permission to create deals.",
      });
    }

    const payload = { ...req.body };
    if (payload.products && Array.isArray(payload.products)) {
      payload.value = payload.products.reduce((sum, p) => sum + (Number(p.quantity || 1) * Number(p.price || 0)), 0);
    }

    const deal = await Deal.create(payload);
    await checkAndCreateCustomer(deal);

    res.status(201).json(deal);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// UPDATE DEAL
export const updateDeal = async (req, res) => {
  try {
    if (!req.user.resolvedPermissions.includes("deals:update")) {
      return res.status(403).json({
        message: "Access Denied: You do not have permission to update deals.",
      });
    }

    const existingDeal = await Deal.findById(req.params.id);
    if (!existingDeal) {
      return res.status(404).json({ message: "Deal not found" });
    }

    const payload = { ...req.body };
    if (payload.products && Array.isArray(payload.products)) {
      payload.value = payload.products.reduce((sum, p) => sum + (Number(p.quantity || 1) * Number(p.price || 0)), 0);
    }

    const deal = await Deal.findByIdAndUpdate(
      req.params.id,
      payload,
      { new: true }
    ).populate("sourceLead");

    await checkAndCreateCustomer(deal);

    res.status(200).json(deal);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE DEAL
export const deleteDeal = async (req, res) => {
  try {
    if (!req.user.resolvedPermissions.includes("deals:delete")) {
      return res.status(403).json({
        message: "Access Denied: You do not have permission to delete deals.",
      });
    }

    const deal = await Deal.findByIdAndDelete(req.params.id);
    if (!deal) {
      return res.status(404).json({ message: "Deal not found" });
    }

    res.status(200).json({ message: "Deal deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ADD NOTE TO DEAL
export const addDealNote = async (req, res) => {
  try {
    if (!req.user.resolvedPermissions.includes("deals:update")) {
      return res.status(403).json({
        message: "Access Denied: You do not have permission to modify deals.",
      });
    }

    const { text, type } = req.body;
    if (!text) {
      return res.status(400).json({ message: "Note text is required." });
    }

    const deal = await Deal.findById(req.params.id);
    if (!deal) {
      return res.status(404).json({ message: "Deal not found." });
    }

    const authorName = req.user.name || req.user.email;
    deal.notes.push({ text, type, authorName });
    await deal.save();

    // Populate source lead to match standard outputs
    await deal.populate("sourceLead");

    res.status(200).json(deal);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
