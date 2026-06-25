import { createContext, useContext, useState, useEffect } from "react";
import api from "../services/api";

const SettingsContext = createContext();

const localeMap = {
  INR: "en-IN",
  USD: "en-US",
  EUR: "en-IE",
  GBP: "en-GB"
};

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState({
    crmName: "Sales CRM",
    currency: "INR",
    companyName: "",
    supportEmail: "",
    supportPhone: "",
    allowEmployeeViewCustomers: true,
    emailUser: "",
    emailPasskey: ""
  });
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem("token");
      if (token) {
        const response = await api.get("/settings");
        if (response.data) {
          setSettings(response.data);
        }
      }
    } catch (err) {
      console.error("Failed to load CRM settings:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const updateSettingsData = async (updatedFields) => {
    try {
      const response = await api.put("/settings", updatedFields);
      if (response.data) {
        setSettings(response.data);
        return { success: true, data: response.data };
      }
    } catch (err) {
      console.error("Failed to save CRM settings:", err);
      throw err;
    }
  };

  // Dynamic currency formatting function based on currency settings
  const formatCurrency = (value) => {
    const currencyCode = settings.currency || "INR";
    const locale = localeMap[currencyCode] || "en-IN";
    
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currencyCode,
      maximumFractionDigits: 0,
    }).format(value || 0);
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        loading,
        updateSettingsData,
        formatCurrency,
        reloadSettings: fetchSettings
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext);
export default SettingsContext;
