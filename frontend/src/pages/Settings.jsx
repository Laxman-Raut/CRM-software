import { useState, useEffect } from "react";
import { useSettings } from "../context/SettingsContext";
import Layout from "../components/Layout";
import { FaBuilding, FaEnvelope, FaPhone, FaCog, FaLock } from "react-icons/fa";
import "./Settings.css";

const Settings = () => {
  const { settings, updateSettingsData } = useSettings();

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

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const role = localStorage.getItem("role");
  const isAdmin = role === "admin";

  useEffect(() => {
    let active = true;
    if (settings) {
      const timer = setTimeout(() => {
        if (active) {
          setCrmName(settings.crmName || "Sales CRM");
          setCurrency(settings.currency || "INR");
          setCompanyName(settings.companyName || "");
          setSupportEmail(settings.supportEmail || "");
          setSupportPhone(settings.supportPhone || "");
          setAllowEmployeeViewCustomers(settings.allowEmployeeViewCustomers !== false);
          setEmailUser(settings.emailUser || "");
          setEmailPasskey(settings.emailPasskey || "");
        }
      }, 0);
      return () => {
        active = false;
        clearTimeout(timer);
      };
    }
  }, [settings]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAdmin) {
      alert("Access Denied: Only Admins can modify CRM configurations.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess(false);

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
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to update configurations");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
      <section className="settings-page">
        <header className="settings-header">
          <div>
            <p className="settings-kicker">System Configuration</p>
            <h1>CRM Global Settings</h1>
          </div>
          <div className="settings-header-icon">
            <FaCog />
          </div>
        </header>

        {!isAdmin ? (
          <div className="settings-lock-screen">
            <FaLock size={48} />
            <h2>Access Restricted</h2>
            <p>Only system administrators can modify CRM name, currency rules, and user roles.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="settings-form-container">
            {success && (
              <div className="settings-success-alert">
                ✓ Configurations saved and applied successfully!
              </div>
            )}
            {error && (
              <div className="settings-error-alert">
                ✗ {error}
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
              <button type="submit" className="settings-save-btn" disabled={saving}>
                {saving ? "Saving Changes..." : "Save Settings"}
              </button>
            </div>
          </form>
        )}
      </section>
    </Layout>
  );
};

export default Settings;
