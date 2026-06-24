import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FaLock, FaEnvelope, FaChevronRight } from "react-icons/fa";
import api from "../services/api";
import "./Login.css";
const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      alert("Please enter both email and password.");
      return;
    }

    try {
      setLoading(true);
      const response = await api.post(
        "/auth/login",
        { email, password }
      );

      localStorage.setItem("token", response.data.token);
      localStorage.setItem("email", response.data.email);
      localStorage.setItem("name", response.data.name || "");
      localStorage.setItem("role", response.data.role);
      localStorage.setItem("permissions", JSON.stringify(response.data.permissions || {}));

      navigate("/dashboard/leads");
    } catch (error) {
      alert(error.response?.data?.message || "Login Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        {/* Logo and title */}
        <header className="login-logo-header">
          <div className="logo-icon-box">C</div>
          <span className="logo-brand-text">CRM</span>
        </header>

        <div className="login-intro-text">
          <h1>Sign In</h1>
          <p>Enter your credentials to access the CRM platform.</p>
        </div>

        <form onSubmit={handleLogin} className="login-form-fields">
          <div className="form-input-group">
            <label htmlFor="login-email">Email Address</label>
            <div className="input-icon-wrapper">
              <FaEnvelope className="icon-field" />
              <input
                id="login-email"
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>
          
          <div className="form-input-group">
            <div className="password-label-wrapper">
              <label htmlFor="login-pass">Password</label>
              <Link to="/forgot-password" style={{ fontSize: "12px", fontWeight: "600", color: "#2563eb", textDecoration: "none" }}>
                Forgot Password?
              </Link>
            </div>
            <div className="input-icon-wrapper">
              <FaLock className="icon-field" />
              <input
                id="login-pass"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-login-submit">
            {loading ? "Authenticating..." : "Sign In"}
            {!loading && <FaChevronRight className="chevron-icon" />}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
