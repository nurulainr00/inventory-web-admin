import React, { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "./firebase/config";
import StockForm from './components/StockForm';
import Dashboard from './components/Dashboard';
import Report from './components/Report';
import Login from "./components/Login";
import './App.css';

const App = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState('dashboard'); // ← track selected page

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const handleLogout = () => {
    signOut(auth);
  };

  if (loading) return <p className="loading-text">Loading...</p>;

  if (!user) {
    return <Login onLogin={() => setUser(auth.currentUser)} />;
  }

  return (
    <div className="app-container">
      <header className="app-header">
  <div className="navbar-left">
    <img src="/avant.jpg" alt="Logo" className="navbar-logo" />
    <p className="navbar-title">Smart Inventory and Tracking System</p>
  </div>
  <div className="navbar-right">
    <button onClick={() => setPage('dashboard')} className="btn-nav">Dashboard</button>
    <button onClick={() => setPage('stockform')} className="btn-nav">Form</button>
    <button onClick={() => setPage('report')} className="btn-nav">Report</button>
    <button onClick={sendEmail} className="btn-nav">Send Email</button>
    <button onClick={handleLogout} className="btn-logout">Logout</button>
  </div>
</header>


      <main>
        {page === 'dashboard' && (
          <>
            <Dashboard />
            <div className="spacer" />
          </>
        )}
        {page === 'stockform' && <StockForm />}
        {page === 'report' && <Report />}
      </main>
    </div>
  );
};
const sendEmail = async () => {
  try {
    const response = await fetch("http://localhost:5000/send-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: "nurulainr00@gmail.com",
        subject: "Hello from Smart Inventory 🚀",
        html: "<h1>Inventory Alert</h1><p>Your stock is running low!</p>",
      }),
    });

    const result = await response.json();
    if (result.success) {
      alert("✅ Email sent successfully!");
    } else {
      alert("❌ Failed: " + result.error);
    }
  } catch (err) {
    console.error(err);
    alert("❌ Network error");
  }
};


export default App;
