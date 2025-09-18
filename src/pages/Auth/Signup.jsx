import React, { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../../firebase";
import { setDoc, doc } from "firebase/firestore";
import { useNavigate, Link } from "react-router-dom";
import "./Auth.css";

function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [shopName, setShopName] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");

    try {
      if (password.length < 6) {
        setError("Password must be at least 6 characters");
        return;
      }

      // Create Firebase Auth user
      const userCred = await createUserWithEmailAndPassword(auth, email, password);

      // Save shop info in Firestore
      await setDoc(doc(db, "ownerShops", userCred.user.uid), {
        shopName,
        email,
        createdAt: new Date(),
      });

      console.log("Signup success:", userCred.user.uid);
      navigate("/");
    } catch (err) {
      console.error("Signup error:", err);
      setError(err.message);
    }
  };

  return (
    <div className="auth-wrapper">
      {/* Left Section */}
      <div className="auth-left">
        <h1 className="brand-title">Printzy</h1>
        <p className="brand-tagline">
          Manage your print shop smarter, faster, and better.
        </p>
        <img
          src="/illustration.svg"
          alt="Illustration"
          className="auth-illustration"
        />
      </div>

      {/* Right Section */}
      <div className="auth-right">
        <div className="auth-card">
          <h2 className="auth-title">Owner Signup</h2>
          <p className="auth-subtitle">Create your shop account</p>

          {error && <p className="error">{error}</p>}

          <form onSubmit={handleSignup}>
            <input
              type="text"
              placeholder="Shop Name"
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              required
            />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password (min 6 chars)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button type="submit">Signup</button>
          </form>

          <div className="auth-footer">
            Already have an account?{" "}
            <Link to="/login" className="signup-link">
              Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Signup;
