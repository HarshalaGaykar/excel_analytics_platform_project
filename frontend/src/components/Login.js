import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [forgotPassword, setForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Attempting login with:", { username, password }, "at", new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }));
    try {
      const res = await axios.post("http://localhost:5000/api/auth/login", {
        username,
        password,
      });
      console.log("Login successful, response:", res.data, "at", new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }));
      localStorage.setItem("token", res.data.token);
      const decoded = jwtDecode(res.data.token);
      console.log("Decoded token full payload:", decoded, "at", new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }));
      console.log("Decoded token, role:", decoded?.role, "at", new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }));
      const role = decoded?.role?.toLowerCase(); // Normalize role to handle case sensitivity
      if (role === "admin") {
        console.log("Navigating to /admin for role:", role, "at", new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }));
        navigate("/admin");
      } else {
        console.log("Navigating to /dashboard for role:", role || "user", "at", new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }));
        navigate("/dashboard");
      }
    } catch (error) {
      console.error("Login error:", error.response?.data?.msg || error.message, "at", new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }));
      alert("Login failed: " + (error.response?.data?.msg || error.message));
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    console.log("Attempting forgot password with email:", resetEmail, "at", new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }));
    try {
      await axios.post("http://localhost:5000/api/auth/forgot-password", { email: resetEmail });
      console.log("Forgot password response received", "at", new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }));
      alert("Password reset link sent to your email!");
      setForgotPassword(false);
      setResetEmail("");
    } catch (error) {
      console.error("Forgot password error:", error.response?.data?.msg || error.message, "at", new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }));
      alert("Failed to send reset link: " + (error.response?.data?.msg || error.message));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1C1C2D] via-[#2A2A3D] to-[#3A3A4D] text-[#FFFFFF] overflow-hidden fontFamily-[Arial, sans-serif]">
      <nav className="bg-gradient-to-r from-[#2A2A3D] to-[#3A3A4D] p-4 shadow-lg fixed w-full z-10">
        <div className="container mx-auto flex justify-between items-center">
          <svg width="100" height="40" viewBox="0 0 100 40" xmlns="http://www.w3.org/2000/svg" className="excel-logo">
            <g>
              <text x="30" y="25" className="logo-text">Excel Analytics</text>
              <rect x="5" y="10" width="5" height="20" fill="#4A90E2"/>
              <rect x="12" y="15" width="5" height="15" fill="#4A90E2"/>
              <rect x="19" y="5" width="5" height="25" fill="#4A90E2"/>
            </g>
          </svg>
          <Link to="/signup" className="px-4 py-2 bg-[#2A2A3D] text-[#FFFFFF] rounded-lg hover:bg-[#3A3A4D] focus:outline-none focus:ring-2 focus:ring-[#4A90E2] transition duration-300 transform hover:scale-105">
            Sign Up
          </Link>
        </div>
      </nav>

      <main className="container mx-auto pt-24 pb-16 flex items-center justify-center">
        <div className="bg-[#2A2A3D] p-8 rounded-lg shadow-lg w-full max-w-md animate-fade-in-up">
          <h2 className="text-3xl font-bold mb-6 text-center">Login</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-3 bg-[#3A3A4D] border border-[#4A90E2] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4A90E2] placeholder-[#B0B0B0] transition duration-300"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 bg-[#3A3A4D] border border-[#4A90E2] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4A90E2] placeholder-[#B0B0B0] transition duration-300"
            />
            <button
              type="submit"
              className="w-full px-4 py-2 bg-[#4A90E2] text-[#FFFFFF] rounded-lg hover:bg-[#6BB9F4] focus:outline-none focus:ring-2 focus:ring-[#4A90E2] transition duration-300 transform hover:scale-105 shadow-md hover:shadow-lg"
            >
              Login
            </button>
          </form>
          <div className="mt-4 text-center">
            <Link
              to="#"
              onClick={() => setForgotPassword(true)}
              className="text-[#4A90E2] underline hover:text-[#6BB9F4] focus:outline-none focus:ring-2 focus:ring-[#4A90E2] transition duration-300 transform hover:scale-105"
            >
              Forgot Password?
            </Link>
            <p className="mt-2 text-[#B0B0B0]">
              Don't have an account?{" "}
              <Link to="/signup" className="text-[#4A90E2] underline hover:text-[#6BB9F4] focus:outline-none focus:ring-2 focus:ring-[#4A90E2] transition duration-300 transform hover:scale-105">
                Sign Up
              </Link>
            </p>
          </div>

          {forgotPassword && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-[#2A2A3D] p-6 rounded-lg shadow-lg w-full max-w-md">
                <h3 className="text-2xl font-bold mb-4 text-center">Forgot Password</h3>
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="w-full p-3 bg-[#3A3A4D] border border-[#4A90E2] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4A90E2] placeholder-[#B0B0B0] transition duration-300"
                  />
                  <button
                    type="submit"
                    className="w-full px-4 py-2 bg-[#4A90E2] text-[#FFFFFF] rounded-lg hover:bg-[#6BB9F4] focus:outline-none focus:ring-2 focus:ring-[#4A90E2] transition duration-300 transform hover:scale-105 shadow-md hover:shadow-lg"
                  >
                    Send Reset Link
                  </button>
                </form>
                <button
                  onClick={() => setForgotPassword(false)}
                  className="mt-4 w-full px-4 py-2 bg-[#2A2A3D] text-[#FFFFFF] rounded-lg hover:bg-[#3A3A4D] focus:outline-none focus:ring-2 focus:ring-[#4A90E2] transition duration-300 transform hover:scale-105"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="bg-[#2A2A3D] p-4 mt-auto text-center">
        <p className="text-sm text-[#B0B0B0] font-[Arial, sans-serif]">© 2025 Excel Analytics Platform. All rights reserved.</p>
      </footer>
    </div>
  );
};

// Animations
const styles = `
  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .animate-fade-in-up {
    animation: fadeInUp 1s ease-out;
  }
  .excel-logo .logo-text {
    font-family: Arial, sans-serif;
    font-size: 16px;
    fill: #4A90E2;
    font-weight: bold;
  }
`;
const styleSheet = document.createElement("style");
styleSheet.textContent = styles;
document.head.appendChild(styleSheet);

export default Login;