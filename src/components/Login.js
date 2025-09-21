import React, { useState } from "react";
import { auth } from "../firebase/config";
import { signInWithEmailAndPassword } from "firebase/auth";
import "../login.css"; // custom CSS

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
      onLogin();
    } catch {
      setError("Invalid email or password");
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        {/* Logo */}
        <img 
          src="/avant.jpg" 
          alt="System Logo" 
          className="login-logo"
        />
        {/* Title */}
        <h2>Smart Inventory and Tracking System</h2>
        <p className="subtitle">Admin Login</p>

        <form onSubmit={handleSubmit} className="login-form">
          <input
            type="email"
            placeholder="Email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button type="submit" className="login-button">
            Login
          </button>
          {error && <p className="error-message">{error}</p>}
        </form>
      </div>
    </div>
  );
};

export default Login;
