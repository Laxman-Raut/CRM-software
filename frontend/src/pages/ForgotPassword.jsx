import { useState } from "react";
import { Link } from "react-router-dom";
import { FaEnvelope, FaArrowLeft, FaKey, FaLock, FaCheckCircle } from "react-icons/fa";
import api from "../services/api";
import "./ForgotPassword.css";

const ForgotPassword = () => {
  const [step, setStep] = useState(1); // 1: Send OTP, 2: Verify OTP, 3: Reset Password, 4: Success
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    try {
      setLoading(true);
      setError("");
      await api.post("/auth/forgot-password", { email });
      setStep(2);
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to send OTP. Please verify the email and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (!otp.trim()) return;

    try {
      setLoading(true);
      setError("");
      await api.post("/auth/verify-otp", { email, otp });
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.message || "Invalid or expired OTP code.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!password || !confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      await api.post("/auth/reset-password", { email, password });
      setStep(4);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-container">
      <div className="forgot-box">
        {/* Brand Header */}
        <header className="forgot-logo-header">
          <div className="logo-icon-box">C</div>
          <span className="logo-brand-text">CRM</span>
        </header>

        {error && (
          <div style={{
            backgroundColor: "#fef2f2",
            border: "1px solid #fecaca",
            color: "#dc2626",
            padding: "10px 14px",
            borderRadius: "8px",
            fontSize: "13px",
            fontWeight: "500",
            marginBottom: "16px",
            textAlign: "center",
            lineHeight: "1.4"
          }}>
            {error}
          </div>
        )}

        {step === 1 && (
          <>
            <div className="forgot-intro-text">
              <h1>Forgot Password</h1>
              <p>Enter your email address to receive a verification OTP.</p>
            </div>

            <form onSubmit={handleSendOTP} className="forgot-form-fields">
              <div className="form-input-group">
                <label htmlFor="reset-email">Email Address</label>
                <div className="input-icon-wrapper">
                  <FaEnvelope className="icon-field" />
                  <input
                    id="reset-email"
                    type="email"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button type="submit" disabled={loading} className="btn-forgot-submit">
                {loading ? "Sending OTP..." : "Send OTP"}
              </button>

              <Link to="/login" className="lnk-back-to-sign">
                <FaArrowLeft /> Back to Sign In
              </Link>
            </form>
          </>
        )}

        {step === 2 && (
          <>
            <div className="forgot-intro-text">
              <h1>Verify OTP</h1>
              <p>We've sent a 6-digit verification code to <strong>{email}</strong>.</p>
            </div>

            <form onSubmit={handleVerifyOTP} className="forgot-form-fields">
              <div className="form-input-group">
                <label htmlFor="otp-code">One-Time Password</label>
                <div className="input-icon-wrapper">
                  <FaKey className="icon-field" />
                  <input
                    id="otp-code"
                    type="text"
                    placeholder="Enter 6-digit OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    maxLength={6}
                    required
                  />
                </div>
              </div>

              <button type="submit" disabled={loading} className="btn-forgot-submit">
                {loading ? "Verifying..." : "Verify OTP"}
              </button>

              <button
                type="button"
                onClick={() => setStep(1)}
                className="lnk-back-to-sign"
                style={{ background: "none", border: "none", cursor: "pointer", width: "100%" }}
              >
                <FaArrowLeft /> Back to Email
              </button>
            </form>
          </>
        )}

        {step === 3 && (
          <>
            <div className="forgot-intro-text">
              <h1>Reset Password</h1>
              <p>Create a secure new password for your account.</p>
            </div>

            <form onSubmit={handleResetPassword} className="forgot-form-fields">
              <div className="form-input-group">
                <label htmlFor="new-password">New Password</label>
                <div className="input-icon-wrapper">
                  <FaLock className="icon-field" />
                  <input
                    id="new-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-input-group">
                <label htmlFor="confirm-password">Confirm Password</label>
                <div className="input-icon-wrapper">
                  <FaLock className="icon-field" />
                  <input
                    id="confirm-password"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button type="submit" disabled={loading} className="btn-forgot-submit">
                {loading ? "Updating..." : "Reset Password"}
              </button>

              <button
                type="button"
                onClick={() => setStep(1)}
                className="lnk-back-to-sign"
                style={{ background: "none", border: "none", cursor: "pointer", width: "100%" }}
              >
                Cancel
              </button>
            </form>
          </>
        )}

        {step === 4 && (
          <div className="forgot-success-box">
            <div className="success-icon-wrapper">
              <FaCheckCircle />
            </div>
            <h2>Password Reset Successful</h2>
            <p>Your password has been updated. You can now use your new password to sign in.</p>
            
            <Link to="/login" className="btn-return-login">
              Go to Sign In
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;