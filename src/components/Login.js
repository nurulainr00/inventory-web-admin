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
    // Sign in with Firebase
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // ✅ Allow only this specific admin email
    const adminEmail = "nurul@gmail.com"; // <-- replace with your real admin email

    if (user.email === adminEmail) {
      onLogin();
    } else {
      setError("Access denied: Only the admin can log in.");
      await auth.signOut(); // immediately log out non-admin users
    }
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
