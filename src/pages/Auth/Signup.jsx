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
    setError(""); // reset error before each attempt
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
        createdAt: new Date()
      });

      console.log("Signup success:", userCred.user.uid);
      navigate("/");
    } catch (err) {
      console.error("Signup error:", err); // Detailed error in console
      setError(err.message); // Show Firebase error on page
    }
  };

  return (
    <div className="auth-container">
      <h2>Owner Signup</h2>
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
      <p>
        Already have an account? <Link to="/login">Login</Link>
      </p>
    </div>
  );
}

export default Signup;
