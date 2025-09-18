import React from "react";
import { useAuth } from "../pages/context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import { FaUserCircle } from "react-icons/fa";
import "./Home.css";

function Home() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="dashboard">
      {/* Top Navbar */}
      <header className="dashboard-header">
        <div className="logo">Printzy Owner Dashboard</div>
        <div className="profile-section">
          {/* Profile Icon Redirect */}
          <Link to="/profile" className="profile-icon">
            <FaUserCircle size={28} />
          </Link>
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="dashboard-main">
        <h2>Welcome Back, {currentUser?.email.split("@")[0]} 👋</h2>
        <p className="subtitle">
          Manage your shop, orders, and printing workflow efficiently.
        </p>

        <div className="cards-container">
          <div className="card orders-card">
            <h3>📄 Orders</h3>
            <p>View and manage all incoming print orders seamlessly.</p>
            <Link to="/orders" className="card-btn">
              Go to Orders
            </Link>
          </div>

          <div className="card printers-card">
            <h3>🖨️ Printers</h3>
            <p>Check connected printers and manage printing jobs.</p>
            <button className="card-btn">Manage Printers</button>
          </div>

          <div className="card income-card">
            <h3>💰 Income (Last 30 days)</h3>
            <p className="income-amount">₹5,200</p>
            <p className="income-subtext">Based on completed orders</p>
            <Link to="/transactions">
              <button className="card-btn">💰 Income Report</button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Home;
