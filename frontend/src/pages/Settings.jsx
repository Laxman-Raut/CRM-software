import { useState, useEffect } from "react";
import { useSettings } from "../context/SettingsContext";
import Layout from "../components/Layout";
import { FaBuilding, FaEnvelope, FaPhone, FaCog, FaLock, FaUser, FaPiggyBank, FaKey } from "react-icons/fa";
import api from "../services/api";
import "./Settings.css";

const Settings = () => {
  const { settings, updateSettingsData } = useSettings();

  // Tab State
  const role = localStorage.getItem("role") || "employee";
  const isAdmin = role.toLowerCase() === "admin";
  const [activeTab, setActiveTab] = useState("profile"); // "profile" or "crm"

  // User Profile Form State
  const [profileName, setProfileName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [profileDesignation, setProfileDesignation] = useState("");
  const [profileRole, setProfileRole] = useState("");
  const [profilePassword, setProfilePassword] = useState("");
  const [bankDetails, setBankDetails] = useState({
    bankName: "",
    accountNumber: "",
    accountHolderName: "",
    ifscCode: "",
    branchName: "",
  });

  const [loadingProfile, setLoadingProfile] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState("");

  // CRM Config Form State
  const [crmName, setCrmName] = useState(settings.crmName || "Sales CRM");
  const [currency, setCurrency] = useState(settings.currency || "INR");
  const [companyName, setCompanyName] = useState(settings.companyName || "");
  const [supportEmail, setSupportEmail] = useState(settings.supportEmail || "");
  const [supportPhone, setSupportPhone] = useState(settings.supportPhone || "");
  const [allowEmployeeViewCustomers, setAllowEmployeeViewCustomers] = useState(
    settings.allowEmployeeViewCustomers !== false
  );
  const [emailUser, setEmailUser] = useState(settings.emailUser || "");
  const [emailPasskey, setEmailPasskey] = useState(settings.emailPasskey || "");

  const [savingCrm, setSavingCrm] = useState(false);
  const [crmSuccess, setCrmSuccess] = useState(false);
  const [crmError, setCrmError] = useState("");

  // Load User Profile on Mount
  const fetchProfile = async () => {
    try {
      setLoadingProfile(true);
      setProfileError("");
      const res = await api.get("/auth/profile");
      const user = res.data;
      setProfileName(user.name || "");
      setProfileEmail(user.email || "");
      setProfileDesignation(user.designation || "");
      setProfileRole(user.role || "");
      if (user.bankDetails) {
        setBankDetails({
          bankName: user.bankDetails.bankName || "",
          accountNumber: user.bankDetails.accountNumber || "",
          accountHolderName: user.bankDetails.accountHolderName || "",
          ifscCode: user.bankDetails.ifscCode || "",
          branchName: user.bankDetails.branchName || "",
        });
      }
    } catch (err) {
      setProfileError(err.response?.data?.message || err.message || "Failed to load profile details.");
    } finally {
      setLoadingProfile(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // Update CRM Form fields if settings change
  useEffect(() => {
    if (settings) {
      setCrmName(settings.crmName || "Sales CRM");
      setCurrency(settings.currency || "INR");
      setCompanyName(settings.companyName || "");
      setSupportEmail(settings.supportEmail || "");
      setSupportPhone(settings.supportPhone || "");
      setAllowEmployeeViewCustomers(settings.allowEmployeeViewCustomers !== false);
      setEmailUser(settings.emailUser || "");
      setEmailPasskey(settings.emailPasskey || "");
    }
  }, [settings]);

  // Handle Profile Update Submission
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    try {
      setProfileSaving(true);
      setProfileError("");
      setProfileSuccess(false);

      const payload = {
        name: profileName,
        bankDetails,
      };

      if (profilePassword) {
        payload.password = profilePassword;
      }

      const res = await api.put("/auth/profile", payload);
      
      // Update name in localstorage
      localStorage.setItem("name", res.data.name);
      
      setProfileSuccess(true);
      setProfilePassword("");
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (err) {
      setProfileError(err.response?.data?.message || err.message || "Failed to update profile.");
    } finally {
      setProfileSaving(false);
    }
  };

  // Handle CRM Config Submission
  const handleCrmSubmit = async (e) => {
    e.preventDefault();
    if (!isAdmin) {
      alert("Access Denied: Only Admins can modify CRM configurations.");
      return;
    }

    try {
      setSavingCrm(true);
      setCrmError("");
      setCrmSuccess(false);

      const payload = {
        crmName,
        currency,
        companyName,
        supportEmail,
        supportPhone,
        allowEmployeeViewCustomers,
        emailUser,
        emailPasskey,
      };

      await updateSettingsData(payload);
      setCrmSuccess(true);
      setTimeout(() => setCrmSuccess(false), 3000);
    } catch (err) {
      setCrmError(err.response?.data?.message || err.message || "Failed to update configurations");
    } finally {
      setSavingCrm(false);
    }
  };

  // Handle Bank Details change
  const handleBankInputChange = (e) => {
    const { name, value } = e.target;
    setBankDetails((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <Layout>
      <section className="settings-page">
        <header className="settings-header">
          <div>
            <p className="settings-kicker">Preferences & Accounts</p>
            <h1>Settings & Profile</h1>
          </div>
          <div className="settings-header-icon">
            <FaCog />
          </div>
        </header>

        {/* Tab Headers */}
        <div className="settings-tabs-header">
          <button
            type="button"
            className={`settings-tab-btn ${activeTab === "profile" ? "active" : ""}`}
            onClick={() => setActiveTab("profile")}
          >
            My Profile
          </button>
          {isAdmin && (
            <button
              type="button"
              className={`settings-tab-btn ${activeTab === "crm" ? "active" : ""}`}
              onClick={() => setActiveTab("crm")}
            >
              CRM Global Settings
            </button>
          )}
        </div>

        {/* PROFILE TAB */}
        {activeTab === "profile" && (
          <div className="settings-tab-content">
            {loadingProfile ? (
              <div style={{ textAlign: "center", padding: "40px" }}>Loading Profile...</div>
            ) : (
              <form onSubmit={handleProfileSubmit} className="settings-form-container">
                {profileSuccess && (
                  <div className="settings-success-alert">
                    ✓ Profile and Banking details updated successfully!
                  </div>
                )}
                {profileError && (
                  <div className="settings-error-alert">
                    ✗ {profileError}
                  </div>
                )}

                {/* Section 1: Basic Profile Info */}
                <fieldset className="settings-section">
                  <legend>
                    <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <FaUser /> Personal Details
                    </span>
                  </legend>
                  <div className="settings-grid">
                    <div className="settings-group">
                      <label htmlFor="profile-name">Full Name *</label>
                      <input
                        type="text"
                        id="profile-name"
                        value={profileName}
                        onChange={(e) => setProfileName(e.target.value)}
                        required
                      />
                    </div>

                    <div className="settings-group">
                      <label htmlFor="profile-email">Email Address</label>
                      <input
                        type="email"
                        id="profile-email"
                        value={profileEmail}
                        readOnly
                        className="profile-read-only"
                        title="Contact Administrator to change your login email address"
                      />
                    </div>

                    <div className="settings-group">
                      <label htmlFor="profile-designation">Designation</label>
                      <input
                        type="text"
                        id="profile-designation"
                        value={profileDesignation || "Not specified"}
                        readOnly
                        className="profile-read-only"
                      />
                    </div>

                    <div className="settings-group">
                      <label htmlFor="profile-role">User Role</label>
                      <input
                        type="text"
                        id="profile-role"
                        value={profileRole}
                        readOnly
                        className="profile-read-only"
                        style={{ textTransform: "capitalize" }}
                      />
                    </div>
                  </div>
                </fieldset>

                {/* Section 2: Personal Banking Details */}
                <fieldset className="settings-section">
                  <legend>
                    <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <FaPiggyBank /> Banking details
                    </span>
                  </legend>
                  <div className="settings-grid">
                    <div className="settings-group">
                      <label htmlFor="bank-holder">Account Holder Name</label>
                      <input
                        type="text"
                        id="bank-holder"
                        name="accountHolderName"
                        value={bankDetails.accountHolderName}
                        onChange={handleBankInputChange}
                        placeholder="Enter account holder name"
                      />
                    </div>

                    <div className="settings-group">
                      <label htmlFor="bank-name">Bank Name</label>
                      <input
                        type="text"
                        id="bank-name"
                        name="bankName"
                        value={bankDetails.bankName}
                        onChange={handleBankInputChange}
                        placeholder="e.g. Chase Bank, HDFC Bank"
                      />
                    </div>

                    <div className="settings-group">
                      <label htmlFor="bank-account">Account Number</label>
                      <input
                        type="text"
                        id="bank-account"
                        name="accountNumber"
                        value={bankDetails.accountNumber}
                        onChange={handleBankInputChange}
                        placeholder="Enter account number"
                      />
                    </div>

                    <div className="settings-group">
                      <label htmlFor="bank-ifsc">IFSC / Routing / SWIFT Code</label>
                      <input
                        type="text"
                        id="bank-ifsc"
                        name="ifscCode"
                        value={bankDetails.ifscCode}
                        onChange={handleBankInputChange}
                        placeholder="Enter bank code"
                      />
                    </div>

                    <div className="settings-group">
                      <label htmlFor="bank-branch">Branch Name</label>
                      <input
                        type="text"
                        id="bank-branch"
                        name="branchName"
                        value={bankDetails.branchName}
                        onChange={handleBankInputChange}
                        placeholder="Enter bank branch location"
                      />
                    </div>
                  </div>
                </fieldset>

                {/* Section 3: Reset Password */}
                <fieldset className="settings-section">
                  <legend>
                    <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <FaKey /> Change Password
                    </span>
                  </legend>
                  <div className="settings-grid" style={{ marginTop: "8px" }}>
                    <div className="settings-group">
                      <label htmlFor="profile-pass">New Password</label>
                      <input
                        type="password"
                        id="profile-pass"
                        value={profilePassword}
                        onChange={(e) => setProfilePassword(e.target.value)}
                        placeholder="Leave blank to keep current password"
                        minLength="6"
                      />
                    </div>
                  </div>
                </fieldset>

                <div className="settings-submit-bar">
                  <button type="submit" className="settings-save-btn" disabled={profileSaving}>
                    {profileSaving ? "Saving Profile..." : "Save Profile Details"}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* CRM GLOBAL SETTINGS TAB (Only Admin) */}
        {activeTab === "crm" && isAdmin && (
          <div className="settings-tab-content">
            <form onSubmit={handleCrmSubmit} className="settings-form-container">
              {crmSuccess && (
                <div className="settings-success-alert">
                  ✓ Configurations saved and applied successfully!
                </div>
              )}
              {crmError && (
                <div className="settings-error-alert">
                  ✗ {crmError}
                </div>
              )}

              {/* Section 1: Branding & Appearance */}
              <fieldset className="settings-section">
                <legend>Branding & Appearance</legend>
                <div className="settings-grid">
                  <div className="settings-group">
                    <label htmlFor="crm-name">CRM Brand Name *</label>
                    <input
                      type="text"
                      id="crm-name"
                      value={crmName}
                      onChange={(e) => setCrmName(e.target.value)}
                      required
                    />
                    <span className="settings-tip">This changes the sidebar brand title dynamically.</span>
                  </div>

                  <div className="settings-group">
                    <label htmlFor="currency">Base Currency Symbol *</label>
                    <select
                      id="currency"
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      required
                    >
                      <option value="INR">INR (₹) Rupees</option>
                      <option value="USD">USD ($) Dollars</option>
                      <option value="EUR">EUR (€) Euros</option>
                      <option value="GBP">GBP (£) Pounds</option>
                    </select>
                    <span className="settings-tip">Updates pricing format across stats, leads, deals, and reports.</span>
                  </div>
                </div>
              </fieldset>

              {/* Section 2: Company Details */}
              <fieldset className="settings-section">
                <legend>Company Profile & Support</legend>
                <div className="settings-grid">
                  <div className="settings-group">
                    <label htmlFor="company-name">Company Name</label>
                    <div className="input-with-icon">
                      <FaBuilding />
                      <input
                        type="text"
                        id="company-name"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="e.g. Acme Corp"
                      />
                    </div>
                  </div>

                  <div className="settings-group">
                    <label htmlFor="support-email">Support Contact Email</label>
                    <div className="input-with-icon">
                      <FaEnvelope />
                      <input
                        type="email"
                        id="support-email"
                        value={supportEmail}
                        onChange={(e) => setSupportEmail(e.target.value)}
                        placeholder="support@company.com"
                      />
                    </div>
                  </div>

                  <div className="settings-group">
                    <label htmlFor="support-phone">Support Helpline</label>
                    <div className="input-with-icon">
                      <FaPhone />
                      <input
                        type="tel"
                        id="support-phone"
                        value={supportPhone}
                        onChange={(e) => setSupportPhone(e.target.value)}
                        placeholder="+91 XXXXX XXXXX"
                      />
                    </div>
                  </div>
                </div>
              </fieldset>

              {/* Section 3: Functional Security Toggles */}
              <fieldset className="settings-section">
                <legend>Employee Permissions & Policies</legend>
                <div className="toggle-group-wrapper">
                  <div className="toggle-label-desc">
                    <strong>Allow Employees to View Customer Accounts</strong>
                    <p>When disabled, only Admin role can access the "Customers Base" page and drawer details.</p>
                  </div>
                  <label className="switch-toggle" htmlFor="toggle-employee-customers">
                    <input
                      type="checkbox"
                      id="toggle-employee-customers"
                      checked={allowEmployeeViewCustomers}
                      onChange={(e) => setAllowEmployeeViewCustomers(e.target.checked)}
                    />
                    <span className="slider-toggle-round"></span>
                  </label>
                </div>
              </fieldset>

              {/* Section 4: Email SMTP Configuration */}
              <fieldset className="settings-section">
                <legend>Email SMTP Configuration (Gmail Transporter)</legend>
                <p className="settings-tip" style={{ marginBottom: "16px", display: "block" }}>
                  Configure the SMTP credentials used by the CRM to send emails (such as OTP password resets, reminders, and employee alerts). 
                  Saving credentials here will dynamically override the default <code>EMAIL_USER</code> and <code>EMAIL_PASS</code> variables defined in the server's <code>.env</code> file.
                </p>
                
                <div className="settings-grid">
                  <div className="settings-group">
                    <label htmlFor="email-user">SMTP Email Address</label>
                    <div className="input-with-icon">
                      <FaEnvelope />
                      <input
                        type="email"
                        id="email-user"
                        value={emailUser}
                        onChange={(e) => setEmailUser(e.target.value)}
                        placeholder="your-email@gmail.com"
                      />
                    </div>
                    <span className="settings-tip">Sender address used to dispatch outbound emails.</span>
                  </div>

                  <div className="settings-group">
                    <label htmlFor="email-passkey">SMTP App Passkey / Password</label>
                    <div className="input-with-icon">
                      <FaLock />
                      <input
                        type="password"
                        id="email-passkey"
                        value={emailPasskey}
                        onChange={(e) => setEmailPasskey(e.target.value)}
                        placeholder="•••• •••• •••• ••••"
                      />
                    </div>
                    <span className="settings-tip">For Gmail accounts, generate a 16-character App Password.</span>
                  </div>
                </div>
              </fieldset>

              {/* Submit Bar */}
              <div className="settings-submit-bar">
                <button type="submit" className="settings-save-btn" disabled={savingCrm}>
                  {savingCrm ? "Saving Changes..." : "Save Settings"}
                </button>
              </div>
            </form>
          </div>
        )}
      </section>
    </Layout>
  );
};

export default Settings;
