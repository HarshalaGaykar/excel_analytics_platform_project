import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FileText, User, LogOut, History } from "lucide-react"; // Removed LayoutDashboard
import Chart from "chart.js/auto";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const UserDashboard = ({ history, addToHistory, setHistory }) => { // Added setHistory as prop
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(true);
  const [file, setFile] = useState(null);
  const [activeSection, setActiveSection] = useState("upload");
  const [uploadHistory, setUploadHistory] = useState([]);
  const [chartData, setChartData] = useState({ labels: [], data: [] });
  const chartRef = useRef(null);
  const canvasRef = useRef(null);
  const navigate = useNavigate();
  const [isThinking, setIsThinking] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("No token found");
        const res = await axios.get("http://localhost:5000/api/auth/me", {
          headers: { "x-auth-token": token },
        });
        setUsername(res.data.username || "User");
      } catch (error) {
        console.error("Error fetching user:", error.message, "at", new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }));
      } finally {
        setLoading(false);
      }
    };

    const fetchUploadHistory = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("No token found");
        const res = await axios.get("http://localhost:5000/api/upload/history", {
          headers: { "x-auth-token": token },
        });
        setUploadHistory(res.data || []);
      } catch (error) {
        console.error("Error fetching upload history:", error.message, "at", new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }));
      }
    };

    const fetchChartData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("No token found");
        const res = await axios.get("http://localhost:5000/api/upload/latest", {
          headers: { "x-auth-token": token },
        });
        setChartData(res.data.data || { labels: [], data: [] });
      } catch (error) {
        console.error("Error fetching chart data:", error.message, "at", new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }));
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
    fetchUploadHistory();
    fetchChartData();
  }, []);

  useEffect(() => {
    if (chartRef.current) {
      chartRef.current.destroy();
    }

    if (activeSection === "dashboard" && chartData.labels.length > 0 && canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      chartRef.current = new Chart(ctx, {
        type: "bar", // Default to bar since selectedChartType is not used
        data: {
          labels: chartData.labels,
          datasets: [
            {
              label: "Data",
              data: chartData.data,
              backgroundColor: "rgba(74, 144, 226, 0.2)",
              borderColor: "#4A90E2",
              borderWidth: 1,
            },
          ],
        },
        options: {
          scales: {
            y: {
              beginAtZero: true,
            },
          },
        },
      });
    }
  }, [activeSection, chartData]);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) {
      alert("Please select a file first!");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No token found");
      const res = await axios.post("http://localhost:5000/api/upload/upload", formData, {
        headers: {
          "x-auth-token": token,
          "Content-Type": "multipart/form-data",
        },
      });
      alert("File uploaded successfully!");
      localStorage.setItem("uploadId", res.data.uploadId);
      navigate("/visualize", { state: { uploadId: res.data.uploadId } });
      const updatedHistory = await axios.get("http://localhost:5000/api/upload/history", {
        headers: { "x-auth-token": token },
      });
      setUploadHistory(updatedHistory.data || []);
      setChartData(res.data.data || { labels: [], data: [] });
      addToHistory(`Uploaded file: ${file.name} at ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata", hour12: true })}`);
    } catch (error) {
      console.error("Upload error:", error.message, "at", new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }));
      alert("Failed to upload file: " + (error.response?.data?.msg || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const downloadPNG = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const link = document.createElement("a");
      link.download = "chart.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
    } else {
      alert("Chart not found!");
    }
  };

  const downloadPDF = () => {
    const input = document.getElementById("chartSection");
    if (input) {
      html2canvas(input).then((canvas) => {
        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF();
        const width = pdf.internal.pageSize.getWidth();
        const height = (canvas.height * width) / canvas.width;
        pdf.addImage(imgData, "PNG", 0, 0, width, height);
        pdf.save("chart.pdf");
      });
    } else {
      alert("Chart section not found!");
    }
  };

  const saveVisualization = async (uploadId) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No token found");
      const canvas = canvasRef.current;
      let image = "";
      if (canvas) {
        image = canvas.toDataURL("image/png");
      }
      await axios.post(
        `http://localhost:5000/api/upload/visualize/${uploadId}`,
        {
          type: "bar", // Default type since selectedChartType is not used
          data: chartData,
          image,
        },
        { headers: { "x-auth-token": token } }
      );
      alert("Visualization saved!");
      const updatedHistory = await axios.get("http://localhost:5000/api/upload/history", {
        headers: { "x-auth-token": token },
      });
      setUploadHistory(updatedHistory.data || []);
      addToHistory(`Saved visualization for upload ID ${uploadId} at ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata", hour12: true })}`);
    } catch (error) {
      console.error("Error saving visualization:", error.message, "at", new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }));
      alert("Failed to save visualization");
    }
  };

  const downloadPastChart = async (viz) => {
    try {
      if (!viz.visualizationImage || !viz.visualizationImage.startsWith("data:image/png;base64,")) {
        throw new Error("Invalid or empty image data");
      }

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();
      img.src = viz.visualizationImage;

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = () => reject(new Error("Failed to load image"));
      });

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      const link = document.createElement("a");
      link.download = `${viz.type}_${new Date(viz.createdAt).toLocaleDateString()}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      addToHistory(`Downloaded past chart ${viz.type} at ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata", hour12: true })}`);
    } catch (error) {
      console.error("Error downloading past chart:", error.message, "at", new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }));
      alert("Failed to download past chart. Check the console for details: " + error.message);
    }
  };

  const handleThink = async (action) => {
    setIsThinking(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));

    try {
      switch (action) {
        case "upload":
          if (file) {
            const formData = new FormData();
            formData.append("file", file);
            const token = localStorage.getItem("token");
            const res = await axios.post("http://localhost:5000/api/upload/upload", formData, {
              headers: {
                "x-auth-token": token,
                "Content-Type": "multipart/form-data",
              },
            });
            alert("File uploaded with detailed analysis!");
            localStorage.setItem("uploadId", res.data.uploadId);
            navigate("/visualize", { state: { uploadId: res.data.uploadId } });
            const updatedHistory = await axios.get("http://localhost:5000/api/upload/history", {
              headers: { "x-auth-token": token },
            });
            setUploadHistory(updatedHistory.data || []);
            setChartData(res.data.data || { labels: [], data: [] });
            addToHistory(`Thought and uploaded file: ${file.name} at ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata", hour12: true })}`);
          } else {
            alert("Please select a file first!");
          }
          break;
        case "chartData":
          const token = localStorage.getItem("token");
          const chartRes = await axios.get("http://localhost:5000/api/upload/latest", {
            headers: { "x-auth-token": token },
          });
          setChartData(chartRes.data.data || { labels: [], data: [] });
          alert("Chart data analyzed and updated with enhanced insights!");
          addToHistory(`Analyzed chart data at ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata", hour12: true })}`);
          break;
        default:
          alert("Thinking mode activated, but no specific action defined.");
      }
    } catch (error) {
      console.error("Error during think mode:", error.message, "at", new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }));
      alert("Think mode failed: " + (error.response?.data?.msg || error.message));
    } finally {
      setIsThinking(false);
    }
  };

  // Derive counts from uploadHistory
  const uploadedFilesCount = uploadHistory.length;
  const graphsCreatedCount = uploadHistory.reduce((count, item) => count + (item.visualizations ? item.visualizations.length : 0), 0);

  if (loading) return <div className="text-center p-4 text-[#FFFFFF] font-[Arial, sans-serif]">Loading...</div>;

  return (
    <div className="min-h-screen bg-[#1C1C2D] text-[#FFFFFF] font-[Arial, sans-serif] flex">
      <aside className="w-64 bg-[#2A2A3D] h-screen p-4 shadow-lg fixed">
        <div className="mb-6 text-center">
          
        </div>
        <nav>
          <ul className="space-y-2">
            <li>
              <button
                onClick={() => setActiveSection("upload")}
                className={`w-full flex items-center px-4 py-2 rounded-lg hover:bg-[#3A3A4D] focus:outline-none focus:ring-2 focus:ring-[#4A90E2] transition duration-300 transform hover:scale-105 ${activeSection === "upload" ? "bg-[#3A3A4D]" : ""} font-[Arial, sans-serif] text-sm`}
              >
                <FileText className="mr-2" size={18} />
                Upload Document
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveSection("profile")}
                className={`w-full flex items-center px-4 py-2 rounded-lg hover:bg-[#3A3A4D] focus:outline-none focus:ring-2 focus:ring-[#4A90E2] transition duration-300 transform hover:scale-105 ${activeSection === "profile" ? "bg-[#3A3A4D]" : ""} font-[Arial, sans-serif] text-sm`}
              >
                <User className="mr-2" size={18} />
                Profile
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveSection("uploadHistory")}
                className={`w-full flex items-center px-4 py-2 rounded-lg hover:bg-[#3A3A4D] focus:outline-none focus:ring-2 focus:ring-[#4A90E2] transition duration-300 transform hover:scale-105 ${activeSection === "uploadHistory" ? "bg-[#3A3A4D]" : ""} font-[Arial, sans-serif] text-sm`}
              >
                <History className="mr-2" size={18} />
                Upload History
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveSection("chatHistory")}
                className={`w-full flex items-center px-4 py-2 rounded-lg hover:bg-[#3A3A4D] focus:outline-none focus:ring-2 focus:ring-[#4A90E2] transition duration-300 transform hover:scale-105 ${activeSection === "chatHistory" ? "bg-[#3A3A4D]" : ""} font-[Arial, sans-serif] text-sm`}
              >
                <History className="mr-2" size={18} />
                Chat History
              </button>
            </li>
            <li>
              <button
                onClick={handleLogout}
                className="w-full flex items-center px-4 py-2 rounded-lg bg-[#FF4D4D] hover:bg-[#FF6666] focus:outline-none focus:ring-2 focus:ring-[#FF4D4D] transition duration-300 transform hover:scale-105 font-[Arial, sans-serif] text-sm"
              >
                <LogOut className="mr-2" size={18} />
                Logout
              </button>
            </li>
          </ul>
        </nav>
      </aside>

      <main className="ml-64 w-full pt-6 pb-16 animate-fade-in-up">
        <header className="bg-[#2A2A3D] p-4 shadow-lg mb-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-[#FFFFFF] font-[Arial, sans-serif]">Excel Analytics Platform</h2>
          <span className="text-[#FFFFFF] font-[Arial, sans-serif] text-sm">Welcome, {username || "Guest"}</span>
        </header>                             

        {activeSection === "upload" && (
          <section className="bg-[#2A2A3D] p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow mx-6">
            <h2 className="text-2xl font-semibold text-[#FFFFFF] mb-4 font-[Arial, sans-serif]">Upload Excel File</h2>
            <input
              type="file"
              accept=".xls,.xlsx"
              onChange={handleFileChange}
              className="w-full p-3 bg-[#3A3A4D] text-[#FFFFFF] border border-[#4A90E2] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4A90E2] placeholder-[#B0B0B0] transition duration-300 font-[Arial, sans-serif] text-sm"
            />
            <div className="flex space-x-4 mt-4">
              <button
                onClick={handleUpload}
                className="w-full py-2 bg-[#4A90E2] text-[#FFFFFF] rounded-lg hover:bg-[#6BB9F4] focus:outline-none focus:ring-2 focus:ring-[#4A90E2] transition duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl font-[Arial, sans-serif] text-sm disabled:bg-[#666666]"
                disabled={!file}
              >
                Upload & Visualize
              </button>
              <button
                onClick={() => handleThink("upload")}
                className={`w-full py-2 bg-[#4A90E2] text-[#FFFFFF] rounded-lg hover:bg-[#6BB9F4] focus:outline-none focus:ring-2 focus:ring-[#4A90E2] transition duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl ${isThinking ? "opacity-50 cursor-not-allowed" : ""} font-[Arial, sans-serif] text-sm`}
                disabled={isThinking}
              >
                {isThinking ? "Thinking..." : "Think & Upload"}
              </button>
            </div>
            {file && <p className="mt-2 text-[#B0B0B0] font-[Arial, sans-serif] text-sm">Selected file: {file.name}</p>}
          </section>
        )}

        {activeSection === "profile" && (
          <section className="bg-[#2A2A3D] p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow mx-6">
            <h2 className="text-2xl font-semibold text-[#FFFFFF] mb-4 font-[Arial, sans-serif]">Profile</h2>
            <p className="text-xl text-[#B0B0B0] mb-6 font-[Arial, sans-serif]">Welcome, {username || "Guest"}!</p>
            <p className="text-md text-[#B0B0B0] mb-6 font-[Arial, sans-serif]">Explore your analytics journey with us!</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-[#3A3A4D] p-4 rounded-lg border border-[#4A90E2] text-center">
                <h3 className="text-lg font-semibold text-[#4A90E2] font-[Arial, sans-serif]">Uploaded Files</h3>
                <p className="text-2xl text-[#FFFFFF] font-[Arial, sans-serif]">{uploadedFilesCount}</p>
              </div>
              <div className="bg-[#3A3A4D] p-4 rounded-lg border border-[#4A90E2] text-center">
                <h3 className="text-lg font-semibold text-[#4A90E2] font-[Arial, sans-serif]">Graphs Created</h3>
                <p className="text-2xl text-[#FFFFFF] font-[Arial, sans-serif]">{graphsCreatedCount}</p>
              </div>
            </div>
          </section>
        )}

        {activeSection === "uploadHistory" && (
          <section className="bg-[#2A2A3D] p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow mx-6">
            <h2 className="text-2xl font-semibold text-[#FFFFFF] mb-4 font-[Arial, sans-serif]">Upload History</h2>
            {uploadHistory.length > 0 ? (
              <ul className="text-[#B0B0B0] space-y-4 font-[Arial, sans-serif] text-sm">
                {uploadHistory.map((item) => (
                  <li key={item._id} className="border-b border-[#4A90E2] pb-2">
                    <div>
                      <strong>File:</strong> {item.filename}
                    </div>
                    <div>
                      <strong>Uploaded On:</strong> {new Date(item.uploadAt).toLocaleDateString()}
                    </div>
                    {item.visualizations.length > 0 && (
                      <div>
                        <strong>Visualizations:</strong>
                        <ul className="ml-4 mt-2">
                          {item.visualizations.map((viz, index) => (
                            <li key={index} className="mb-4">
                              <div>
                                <strong>Type:</strong> {viz.type}
                              </div>
                              <div>
                                <strong>Created:</strong> {new Date(viz.createdAt).toLocaleDateString()}
                              </div>
                              {viz.xAxis && viz.yAxis && (
                                <div>
                                  <strong>Axes:</strong> X={viz.xAxis}, Y={viz.yAxis}
                                </div>
                              )}
                              {viz.visualizationImage && (
                                <img
                                  src={viz.visualizationImage}
                                  alt={`${viz.type} visualization`}
                                  className="mt-2 w-48 h-auto border border-[#4A90E2]"
                                />
                              )}
                              <button
                                onClick={() => downloadPastChart(viz)}
                                className="mt-2 px-4 py-2 bg-[#4A90E2] text-[#FFFFFF] rounded-lg hover:bg-[#6BB9F4] focus:outline-none focus:ring-2 focus:ring-[#4A90E2] transition duration-300 transform hover:scale-105 font-[Arial, sans-serif] text-sm"
                              >
                                Re-Download Chart
                              </button>
                              <button
                                onClick={() => saveVisualization(item._id)}
                                className="ml-2 mt-2 px-4 py-2 bg-[#4A90E2] text-[#FFFFFF] rounded-lg hover:bg-[#6BB9F4] focus:outline-none focus:ring-2 focus:ring-[#4A90E2] transition duration-300 transform hover:scale-105 font-[Arial, sans-serif] text-sm"
                              >
                                Save Visualization
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[#B0B0B0] font-[Arial, sans-serif] text-sm">No upload history available.</p>
            )}
            <div className="mt-4">
              <button
                onClick={downloadPNG}
                className="px-4 py-2 bg-[#4A90E2] text-[#FFFFFF] rounded-lg hover:bg-[#6BB9F4] focus:outline-none focus:ring-2 focus:ring-[#4A90E2] transition duration-300 transform hover:scale-105 font-[Arial, sans-serif] text-sm"
              >
                Download PNG
              </button>
              <button
                onClick={downloadPDF}
                className="ml-2 px-4 py-2 bg-[#4A90E2] text-[#FFFFFF] rounded-lg hover:bg-[#6BB9F4] focus:outline-none focus:ring-2 focus:ring-[#4A90E2] transition duration-300 transform hover:scale-105 font-[Arial, sans-serif] text-sm"
              >
                Download PDF
              </button>
            </div>
          </section>
        )}

        {activeSection === "chatHistory" && (
          <section className="bg-[#2A2A3D] p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow mx-6">
            <h2 className="text-2xl font-semibold text-[#FFFFFF] mb-4 font-[Arial, sans-serif]">Chat History</h2>
            {history.length > 0 ? (
              <ul className="text-[#B0B0B0] space-y-4 font-[Arial, sans-serif] text-sm">
                {history.map((entry, index) => (
                  <li key={index} className="border-b border-[#4A90E2] pb-2">
                    <div>
                      <strong>Time:</strong> {entry.timestamp}
                    </div>
                    <div>
                      <strong>Message:</strong> {entry.message}
                    </div>
                    <button
                      className="mt-2 px-2 py-1 bg-transparent border border-[#4A90E2] text-[#4A90E2] rounded-lg hover:bg-[#4A90E2] hover:text-[#FFFFFF] focus:outline-none focus:ring-2 focus:ring-[#4A90E2] transition duration-300 transform hover:scale-105 font-[Arial, sans-serif] text-xs"
                      onClick={() => alert("To forget this chat, click the book icon below this message and select it from the menu. Alternatively, disable memory in Data Controls settings.")}
                    >
                      📖 Manage Memory
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[#B0B0B0] font-[Arial, sans-serif] text-sm">No chat history available.</p>
            )}
            <button
              className="mt-4 px-4 py-2 bg-[#FF4D4D] text-[#FFFFFF] rounded-lg hover:bg-[#FF6666] focus:outline-none focus:ring-2 focus:ring-[#FF4D4D] transition duration-300 transform hover:scale-105 font-[Arial, sans-serif] text-sm"
              onClick={() => {
                setHistory([]); // Now defined via prop
                alert("Chat history cleared. Note: To permanently forget, use the memory management options.");
              }}
            >
              Clear History
            </button>
          </section>
        )}
      </main>

      <footer className="bg-[#2A2A3D] p-4 mt-auto text-center fixed bottom-0 w-full ml-64">
        <p className="text-sm text-[#B0B0B0] font-[Arial, sans-serif]">© 2025 Excel Analytics Platform. All rights reserved.</p>
      </footer>

      <canvas ref={canvasRef} className="hidden" id="chartSection" />
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
`;
const styleSheet = document.createElement("style");
styleSheet.textContent = styles;
document.head.appendChild(styleSheet);

export default UserDashboard;