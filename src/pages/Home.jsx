import React, { useState } from "react";
import { useAuth } from "../pages/context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import "./Home.css";

function Home() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [editingProfile, setEditingProfile] = useState(false);
  const [email, setEmail] = useState(currentUser?.email);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const handleProfileSave = () => {
    // Here you can call a function to update the user profile in Firebase
    console.log("Profile updated:", email);
    setEditingProfile(false);
  };

  return (
    <div className="dashboard">
      {/* Top Navbar */}
      <header className="dashboard-header">
        <div className="logo">Printzy Owner Dashboard</div>
        <div className="profile-section">
          {editingProfile ? (
            <div className="profile-edit">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="profile-input"
              />
              <button onClick={handleProfileSave} className="save-btn">Save</button>
              <button onClick={() => setEditingProfile(false)} className="cancel-btn">Cancel</button>
            </div>
          ) : (
            <>
              <span className="user-email">{email}</span>
              <button onClick={() => setEditingProfile(true)} className="edit-btn">Edit Profile</button>
              <button className="logout-btn" onClick={handleLogout}>Logout</button>
            </>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="dashboard-main">
        <h2>Welcome Back, {currentUser?.email.split("@")[0]} 👋</h2>
        <p className="subtitle">Manage your shop, orders, and printing workflow efficiently.</p>

        <div className="cards-container">
          <div className="card">
            <h3>📄 Orders</h3>
            <p>View and manage all incoming print orders seamlessly.</p>
            <Link to="/orders" className="card-btn">Go to Orders</Link>
          </div>

          <div className="card">
            <h3>🖨️ Printers</h3>
            <p>Check connected printers and manage printing jobs.</p>
            <button className="card-btn">Manage Printers</button>
          </div>

          <div className="card">
            <h3>⚙️ Settings</h3>
            <p>Update shop details and personalize preferences.</p>
            <button className="card-btn">Go to Settings</button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Home;
