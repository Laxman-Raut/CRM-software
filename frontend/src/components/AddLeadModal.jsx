import { useState, useEffect } from "react";

const AddLeadModal = ({
  isOpen,
  onClose,
  onAddLead,
  editingLead,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    company: "",
    email: "",
    phone: "",
    status: "New",
    value: 0,
  });

  useEffect(() => {
    if (editingLead) {
      setFormData({
        name: editingLead.name || "",
        company: editingLead.company || "",
        email: editingLead.email || "",
        phone: editingLead.phone || "",
        status: editingLead.status || "New",
        value: editingLead.value || 0,
      });
    } else {
      setFormData({
        name: "",
        company: "",
        email: "",
        phone: "",
        status: "New",
        value: 0,
      });
    }
  }, [editingLead]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "value" ? Number(value) : value,
    }));
  };

  const handleSave = () => {
    if (
      !formData.name.trim() ||
      !formData.email.trim() ||
      !formData.phone.trim()
    ) {
      alert("Please fill all required fields");
      return;
    }

    onAddLead(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50" style={{ fontFamily: "Inter, sans-serif" }}>
      <div className="bg-white border border-[#e2e8f0] text-slate-900 w-[500px] rounded-xl p-6 shadow-2xl">
        <h2 className="text-xl font-bold mb-5 border-b border-[#e2e8f0] pb-3">
          {editingLead ? "Edit Lead Details" : "Add New Sales Lead"}
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter Name"
              className="w-full bg-[#f8fafc] border border-[#cbd5e1] text-slate-900 p-2.5 rounded-lg outline-none focus:border-[#2563eb] transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Company Name</label>
            <input
              type="text"
              name="company"
              value={formData.company}
              onChange={handleChange}
              placeholder="Enter Company Name"
              className="w-full bg-[#f8fafc] border border-[#cbd5e1] text-slate-900 p-2.5 rounded-lg outline-none focus:border-[#2563eb] transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Email Address *</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter Email"
              className="w-full bg-[#f8fafc] border border-[#cbd5e1] text-slate-900 p-2.5 rounded-lg outline-none focus:border-[#2563eb] transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Phone Number *</label>
            <input
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Enter Phone"
              className="w-full bg-[#f8fafc] border border-[#cbd5e1] text-slate-900 p-2.5 rounded-lg outline-none focus:border-[#2563eb] transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Deal Value (INR) *</label>
            <input
              type="number"
              name="value"
              value={formData.value}
              onChange={handleChange}
              placeholder="Enter Deal Value"
              className="w-full bg-[#f8fafc] border border-[#cbd5e1] text-slate-900 p-2.5 rounded-lg outline-none focus:border-[#2563eb] transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Lead Status</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full bg-[#f8fafc] border border-[#cbd5e1] text-slate-900 p-2.5 rounded-lg outline-none focus:border-[#2563eb] transition-colors"
            >
              <option value="New">New</option>
              <option value="Contacted">Contacted</option>
              <option value="Qualified">Qualified</option>
              <option value="Won">Won</option>
              <option value="Lost">Lost</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-[#e2e8f0]">
          <button
            onClick={onClose}
            className="border border-[#cbd5e1] text-slate-500 hover:text-slate-800 px-4 py-2 rounded-lg transition-colors"
          >
            Cancel
          </button>

          <button
            onClick={handleSave}
            className="bg-[#2563eb] text-white hover:bg-[#1d4ed8] px-5 py-2 rounded-lg font-medium transition-colors"
          >
            {editingLead ? "Update Lead" : "Save Lead"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddLeadModal;
