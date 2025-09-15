import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../firebase";
import { useNavigate, Link } from "react-router-dom";
import "./Auth.css";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/");
    } catch {
      setError("⚠️ Invalid email or password");
    }
  };

  return (
    <div className="auth-wrapper">
      {/* Left side branding/illustration */}
      <div className="auth-left">
        <h1 className="brand-title">Printzy</h1>
        <p className="brand-tagline">
          Simplifying life for Print Shop Owners 🚀
        </p>
        <img
          src="https://cdni.iconscout.com/illustration/premium/thumb/printing-shop-illustration-download-in-svg-png-gif-file-formats--office-equipment-business-industry-pack-illustrations-5102739.png"
          alt="Illustration"
          className="auth-illustration"
        />
      </div>

      {/* Right side login form */}
      <div className="auth-right">
        <div className="auth-card">
          <h2 className="auth-title">Owner Login</h2>
          <p className="auth-subtitle">Access your Printzy dashboard</p>

          {error && <p className="error">{error}</p>}

          <form onSubmit={handleLogin}>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button type="submit">Login</button>
          </form>

          <p className="auth-footer">
            Don’t have an account?{" "}
            <Link to="/signup" className="signup-link">
              Signup
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
