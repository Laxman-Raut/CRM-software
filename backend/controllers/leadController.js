import Lead from "../models/Lead.js";
import Customer from "../models/Customer.js";
import Deal from "../models/Deal.js";
import { Parser } from "json2csv";
import User from "../models/User.js";
import Notification from "../models/Notification.js";
import multer from "multer";
import csv from "csv-parser";
import fs from "fs";


const upload = multer({
  dest:"uploads/"
});



export const importLeadsCSV = [

upload.single("file"),


async(req,res)=>{

try{


const leads=[];


fs.createReadStream(
 req.file.path
)

.pipe(csv())


.on("data",(row)=>{


leads.push({

name: row.Name,

email: row.Email,

phone: row.Phone,

company: row.Company,

status: row.Status,

source: row.Source

});


})


.on("end",async()=>{


const insertedLeads = await Lead.insertMany(leads);

// Create deals for won leads
const wonLeads = insertedLeads.filter(lead => lead.status === "Won");
if (wonLeads.length > 0) {
  try {
    const dealsToInsert = wonLeads.map(lead => ({
      dealName: lead.name,
      company: lead.company || "",
      email: lead.email,
      phone: lead.phone,
      sourceLead: lead._id,
      value: lead.value || 0,
      notes: lead.notes || [],
      stage: "Proposal",
      status: "Active"
    }));
    await Deal.insertMany(dealsToInsert);
  } catch (dealErr) {
    console.error("Failed to insert deals during CSV import:", dealErr);
  }
}


fs.unlinkSync(
 req.file.path
);


res.json({

message:
`${leads.length} Leads Imported`

});


});


}catch(error){


res.status(500).json({

message:error.message

});


}

}

];
// GET ALL LEADS
export const getLeads = async (req, res) => {
  try {
    if (!req.user.resolvedPermissions.includes("leads:read")) {
      return res.status(403).json({
        message: "Access Denied: You do not have permission to view leads.",
      });
    }

    const leads = await Lead.find();
    res.status(200).json(leads);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// CREATE LEAD
export const createLead = async (req, res) => {
  try {
    if (!req.user.resolvedPermissions.includes("leads:create")) {
      return res.status(403).json({
        message: "Access Denied: You do not have permission to create leads.",
      });
    }

    const lead = await Lead.create(req.body);

    if (lead.status === "Won") {
      try {
        await Deal.create({
          dealName: lead.name,
          company: lead.company || "",
          email: lead.email,
          phone: lead.phone,
          sourceLead: lead._id,
          value: lead.value || 0,
          notes: lead.notes || [],
          stage: "Proposal",
          status: "Active"
        });
      } catch (dealErr) {
        console.error("Failed to auto-create deal on lead creation:", dealErr);
      }
    }

    res.status(201).json(lead);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// UPDATE LEAD
export const updateLead = async (req, res) => {
  try {
    if (!req.user.resolvedPermissions.includes("leads:update")) {
      return res.status(403).json({
        message: "Access Denied: You do not have permission to update leads.",
      });
    }

    const existingLead = await Lead.findById(req.params.id);
    if (!existingLead) {
      return res.status(404).json({ message: "Lead not found" });
    }

    const lead = await Lead.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    // If status is Won, sync/create deal record
    if (lead.status === "Won") {
      try {
        const existingDeal = await Deal.findOne({ sourceLead: lead._id });
        if (!existingDeal) {
          await Deal.create({
            dealName: lead.name,
            company: lead.company || "",
            email: lead.email,
            phone: lead.phone,
            sourceLead: lead._id,
            value: lead.value || 0,
            notes: lead.notes || [],
            stage: "Proposal",
            status: "Active"
          });
        } else {
          existingDeal.dealName = lead.name;
          existingDeal.company = lead.company || "";
          existingDeal.email = lead.email;
          existingDeal.phone = lead.phone;
          existingDeal.value = lead.value || 0;
          await existingDeal.save();
        }
      } catch (dealErr) {
        console.error("Failed to auto-create or sync deal on status update:", dealErr);
      }
    }

    // Notify admins if status changed
    if (req.body.status && existingLead.status !== req.body.status) {
      try {
        const admins = await User.find({ role: "admin" });
        for (const admin of admins) {
          // Don't notify the person who made the change
          if (admin._id.toString() !== req.user.id) {
            await Notification.create({
              recipient: admin._id,
              sender: req.user.id,
              type: "lead_status_changed",
              title: "Lead Status Shifted",
              message: `${req.user.name || req.user.email} updated lead "${lead.name}" status to "${lead.status}".`,
              link: "/dashboard/leads"
            });
          }
        }
      } catch (notifErr) {
        console.error("Failed to create lead_status_changed notification:", notifErr);
      }
    }

    res.status(200).json(lead);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE LEAD
export const deleteLead = async (req, res) => {
  try {
    if (!req.user.resolvedPermissions.includes("leads:delete")) {
      return res.status(403).json({
        message: "Access Denied: You do not have permission to delete leads.",
      });
    }

    await Lead.findByIdAndDelete(req.params.id);

    res.status(200).json({
      message: "Lead deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ADD NOTE TO LEAD
export const addLeadNote = async (req, res) => {
  try {
    if (!req.user.resolvedPermissions.includes("leads:update")) {
      return res.status(403).json({
        message: "Access Denied: You do not have permission to modify leads.",
      });
    }

    const { text, type } = req.body;
    if (!text) {
      return res.status(400).json({ message: "Note text is required." });
    }

    const lead = await Lead.findById(req.params.id);
    if (!lead) {
      return res.status(404).json({ message: "Lead not found." });
    }

    const authorName = req.user.name || req.user.email;
    lead.notes.push({ text, type, authorName });
    await lead.save();

    res.status(200).json(lead);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};