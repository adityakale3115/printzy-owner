import React, { useState, useEffect } from "react";
import { useAuth } from "./context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  FaUserCircle,
  FaEnvelope,
  FaSignOutAlt,
  FaCog,
  FaPhone,
  FaEdit,
  FaSave,
  FaTimes,
  FaMapMarkerAlt,
} from "react-icons/fa";
import { doc, getDoc, setDoc, deleteDoc } from "firebase/firestore";
import { db } from "../firebase";
import { deleteUser } from "firebase/auth";
import "./Profile.css";

function Profile() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const [userData, setUserData] = useState(null);
  const [editing, setEditing] = useState(false);
  const [showAccountSettings, setShowAccountSettings] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    phone: "",
    shopName: "",
    address: "",
    services: [{ name: "", price: "" }],
  });

  // 🔹 Fetch shop owner data
  useEffect(() => {
    if (currentUser) {
      const fetchShop = async () => {
        const ref = doc(db, "ownerShops", currentUser.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data();
          setUserData(data);
          setFormData({
            email: data.email || currentUser.email,
            phone: data.phone || "",
            shopName: data.shopName || "",
            address: data.address || "",
            services: data.services || [{ name: "", price: "" }],
          });
        } else {
          // if no doc, create one with default values
          await setDoc(ref, {
            email: currentUser.email,
            phone: "",
            shopName: "",
            address: "",
            services: [],
            createdAt: new Date(),
          });
        }
      };
      fetchShop();
    }
  }, [currentUser]);

  // 🔹 Handle input change
  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // 🔹 Handle services
  const updateService = (index, field, value) => {
    const updated = [...formData.services];
    updated[index][field] = value;
    setFormData((prev) => ({ ...prev, services: updated }));
  };

  const addService = () => {
    setFormData((prev) => ({
      ...prev,
      services: [...prev.services, { name: "", price: "" }],
    }));
  };

  const removeService = (index) => {
    const updated = [...formData.services];
    updated.splice(index, 1);
    setFormData((prev) => ({ ...prev, services: updated }));
  };

  // 🔹 Save to Firestore
  const handleSave = async () => {
    if (currentUser) {
      const ref = doc(db, "ownerShops", currentUser.uid);
      await setDoc(ref, { ...formData, updatedAt: new Date() }, { merge: true });
      setUserData(formData);
      setEditing(false);
    }
  };

  // 🔹 Delete account (Firestore + Auth)
  const handleDeleteAccount = async () => {
    if (window.confirm("Are you sure you want to delete your account? This cannot be undone.")) {
      try {
        const ref = doc(db, "ownerShops", currentUser.uid);
        await deleteDoc(ref); // delete shop record
        await deleteUser(currentUser); // delete auth account
        alert("Your account has been deleted.");
        navigate("/signup");
      } catch (error) {
        console.error("Error deleting account:", error);
        alert("Failed to delete account. Please re-login and try again.");
      }
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="profile-container">
      {/* Header */}
      <header className="profile-header">
        <h2>My Profile</h2>
      </header>

      {/* Profile Card */}
      <div className="profile-card">
        <FaUserCircle className="profile-avatar" />

        {editing ? (
          <>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Email"
              disabled
            />
            <input
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Phone Number"
            />
            <input
              type="text"
              name="shopName"
              value={formData.shopName}
              onChange={handleChange}
              placeholder="Shop Name"
            />
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Shop Address"
            />

            {/* Services */}
            <label>Services & Charges</label>
            {formData.services.map((s, i) => (
              <div key={i} className="service-row">
                <input
                  type="text"
                  placeholder="Service"
                  value={s.name}
                  onChange={(e) => updateService(i, "name", e.target.value)}
                />
                <input
                  type="number"
                  placeholder="₹ Price"
                  value={s.price}
                  onChange={(e) => updateService(i, "price", e.target.value)}
                />
                {formData.services.length > 1 && (
                  <button onClick={() => removeService(i)}>❌</button>
                )}
              </div>
            ))}
            <button className="add-service-btn" onClick={addService}>
              ➕ Add Service
            </button>

            <div className="edit-actions">
              <button onClick={handleSave}>
                <FaSave /> Save
              </button>
              <button onClick={() => setEditing(false)}>
                <FaTimes /> Cancel
              </button>
            </div>
          </>
        ) : (
          <>
            <h3>{userData?.shopName || "Shop Not Added"}</h3>
            <p>
              <FaEnvelope /> {userData?.email}
            </p>
            <p>
              <FaPhone /> {userData?.phone || "Not added"}
            </p>
            <p>
              <FaMapMarkerAlt /> {userData?.address || "No address added"}
            </p>

            <div className="services-list">
              <h4>Services</h4>
              {userData?.services && userData.services.length > 0 ? (
                <ul>
                  {userData.services.map((s, i) => (
                    <li key={i}>
                      {s.name} - ₹{s.price}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No services added</p>
              )}
            </div>

            <button className="edit-btn" onClick={() => setEditing(true)}>
              <FaEdit /> Edit Profile
            </button>
          </>
        )}
      </div>

      {/* Settings / Options */}
      <div className="profile-options">
        <button
          className="profile-option"
          onClick={() => setShowAccountSettings(!showAccountSettings)}
        >
          <FaCog className="option-icon" /> Account Settings
        </button>

        {showAccountSettings && (
          <div className="account-settings">
            <button className="delete-btn" onClick={handleDeleteAccount}>
              ❌ Delete Account
            </button>
          </div>
        )}

        <button className="profile-option logout" onClick={handleLogout}>
          <FaSignOutAlt className="option-icon" /> Logout
        </button>
      </div>
    </div>
  );
}

export default Profile;
