import axios from "axios";
import { useNavigate } from "react-router-dom";
import React, { useState, useEffect } from "react";
import Spline from '@splinetool/react-spline';

const UploadSyllabus = () => {
  // ... existing state and logic ...
  

const [file, setFile] = useState(null);
const [uploadMessage, setUploadMessage] = useState("");
const [syllabusId, setSyllabusId] = useState(null);
const [studyPlan, setStudyPlan] = useState(null);
const [examDate, setExamDate] = useState("");
const [startDatetime, setStartDatetime] = useState("");
const [studyHours, setStudyHours] = useState(4);
const [dragActive, setDragActive] = useState(false);
const [loading, setLoading] = useState(false);
const navigate = useNavigate();
const [currentQuote, setCurrentQuote] = useState(0);
  const motivationalQuotes = [
    "The future belongs to those who believe in the beauty of their dreams. - Eleanor Roosevelt",
    "Success is the sum of small efforts, repeated day in and day out. - Robert Collier",
    "Don't watch the clock; do what it does. Keep going. - Sam Levenson",
    "The only way to do great work is to love what you do. - Steve Jobs",
    "Your limitation—it's only your imagination.",
    "The harder you work for something, the greater you'll feel when you achieve it."
  ];
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentQuote((prev) => (prev + 1) % motivationalQuotes.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const allowedTypes = [
    'application/pdf', 
    'image/png',
    'image/jpeg',
    'image/jpg'
  ];
  
  // Update handleFileChange and handleDrop to validate file types
  const validateFile = (file) => {
    return allowedTypes.includes(file.type);
  };
  
  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (validateFile(selectedFile)) {
      setFile(selectedFile);
    } else {
      setUploadMessage("Unsupported file type. Please upload PDF or image files.");
    }
  };

const handleDragOver = (event) => {
  event.preventDefault();
  setDragActive(true);
};

const handleDragLeave = () => {
  setDragActive(false);
};

const handleDrop = (event) => {
  event.preventDefault();
  setDragActive(false);
  if (event.dataTransfer.files.length > 0) {
    setFile(event.dataTransfer.files[0]);
  }
};

const handleUpload = async () => {
  if (!file) {
    setUploadMessage("Please select or drop a file.");
    return;
  }
  const formData = new FormData();
  formData.append("file", file);

  try {
    const response = await axios.post("http://localhost:5000/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    setUploadMessage("Syllabus uploaded successfully!");
    setSyllabusId(response.data.id);
  } catch (error) {
    setUploadMessage("Error uploading file: " + (error.response?.data?.error || error.message));
  }
};

const handleGenerateStudyPlan = async () => {
  if (!syllabusId || !examDate || !startDatetime) {
    alert("Please ensure syllabus is uploaded and all fields are filled.");
    return;
  }

  setLoading(true);

  try {
    const response = await axios.post("http://localhost:5000/schedule", {
      syllabusId,
      examDate,
      startDatetime,
      studyHours,
    });
    localStorage.setItem("syllabusId", syllabusId);
    setStudyPlan(response.data.studyPlan);
  } catch (error) {
    alert("Error generating study plan: " + (error.response?.data?.error || error.message));
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="upload-container">
      <Spline
        scene="https://prod.spline.design/qiZDO396VRy1wGtD/scene.splinecode"
        className="spline-background"
      />
       <div className="quote-container">
        <div className="quote-text">
          {motivationalQuotes[currentQuote]}
        </div>
      </div>
      <h2 className="main-heading">📚 AI-Powered Study Planner</h2>

      {/* File Upload Section */}
      <div className="upload-section">
        <div
          className={`drop-zone ${dragActive ? "active" : ""}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="drop-zone-content">
            <div className="upload-icon">📤</div>
            <p className="drop-text">{dragActive ? "Drop it here!" : "Drag & Drop your syllabus PDF  or images or screenshots"}</p>
            <input type="file" id="fileInput" onChange={handleFileChange} hidden />
            <label htmlFor="fileInput" className="upload-button">
              Browse Files
            </label>
          </div>
        </div>
        {!file && (
  <p className="supported-formats">
    Supported formats: PDF, PNG, JPG, JPEG
  </p>
)}
        {file && <p className="file-selected">✅ Selected: {file.name}</p>}

        <button className="upload-button-main" onClick={handleUpload}>
          {uploadMessage ? "📤 Upload Again" : "🚀 Upload Syllabus"}
        </button>
        {uploadMessage && <p className={`status-message ${syllabusId ? "success" : "error"}`}>{uploadMessage}</p>}
      </div>

      {/* Study Plan Configuration */}
      {syllabusId && (
        <div className="configuration-section">
          <h3 className="section-heading">🎯 Configure Your Study Plan</h3>
          <div className="input-group">
            <label className="input-label">
              <span className="label-icon">📅</span>
              Exam Date:
              <input
                type="date"
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                className="styled-input"
              />
            </label>
            
            <label className="input-label">
              <span className="label-icon">⏰</span>
              Start Date & Time:
              <input
                type="datetime-local"
                value={startDatetime}
                onChange={(e) => setStartDatetime(e.target.value)}
                className="styled-input"
              />
            </label>

            <label className="input-label">
              <span className="label-icon">⏳</span>
              Daily Study Hours:
              <input
                type="number"
                min="1"
                value={studyHours}
                onChange={(e) => setStudyHours(e.target.value)}
                className="styled-input study-hours-input"
              />
            </label>
          </div>

          <button
            className={`generate-button ${loading ? "loading" : ""}`}
            onClick={handleGenerateStudyPlan}
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="spinner"></div>
                Generating Your Plan...
              </>
            ) : (
              "✨ Generate Study Plan"
            )}
          </button>
          <button 
            className="get-started-button"
            onClick={() => navigate("/efficientplan")}
          >
            🚀 Start Studying Now
          </button>
        </div>
      )}

      {/* Study Plan Output */}
      {studyPlan && Array.isArray(studyPlan) && (
        <div className="study-plan-output">
          <h3 className="section-heading success-heading">🎉 Your Personalized Study Plan</h3>
          
          {studyPlan.map((subjectSchedule, subjectIndex) => (
            <div key={subjectIndex} className="subject-card">
              <div className="subject-header">
                <span className="subject-icon">📖</span>
                <h4 className="subject-title">{subjectSchedule.subject}</h4>
              </div>
              
              <div className="schedule-grid">
                {subjectSchedule.schedule.map((day, dayIndex) => (
                  <div key={dayIndex} className="day-card">
                    <div className="date-header">
                      <span className="calendar-icon">📅</span>
                      <h5 className="date-text">{day.date}</h5>
                    </div>
                    
                    <div className="time-slots">
                      {day.sessions.map((session, sessionIndex) => (
                        <div key={sessionIndex} className="time-slot">
                          <span className="time-badge">
                            🕒 {session.time}
                          </span>
                          <div className="activity-card">
                            {session.study ? (
                              <>
                                <span className="study-icon">📚</span>
                                {session.study}
                              </>
                            ) : (
                              <>
                                <span className="break-icon">☕</span>
                                {session.activity}
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* <button 
            className="get-started-button"
            onClick={() => navigate("/efficientplan")}
          >
            🚀 Start Studying Now
          </button> */}
        </div>
      )}

      <style>
        {`
        .upload-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          min-height: 100vh;
          padding: 2rem;
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
          position: relative;
          overflow-x: hidden;
        }

        .main-heading {
          font-size: 2.5rem;
          color: #2c3e50;
          margin-bottom: 2rem;
          text-align: center;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.1);
        }

        .upload-section {
          background: rgba(255, 255, 255, 0.95);
          padding: 2rem;
          border-radius: 20px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.1);
          backdrop-filter: blur(10px);
          margin-bottom: 2rem;
          width: 90%;
          max-width: 600px;
        }

        .drop-zone {
          border: 3px dashed #4a69bd;
          border-radius: 15px;
          padding: 2rem;
          margin-bottom: 1.5rem;
          transition: all 0.3s ease;
          background: rgba(255, 255, 255, 0.8);
        }

        .drop-zone.active {
          border-color: #3c538f;
          background: rgba(74, 105, 189, 0.1);
          transform: scale(1.02);
        }

        .upload-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
        }

        .upload-button {
          background: #4a69bd;
          color: white;
          padding: 0.8rem 2rem;
          border-radius: 25px;
          font-weight: 600;
          transition: all 0.3s ease;
          margin-top:10px;
          border: none;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
        }

        .upload-button:hover {
          background: #3c538f;
          transform: translateY(-2px);
        }

        .configuration-section {
          background: rgba(255, 255, 255, 0.95);
          padding: 2rem;
          border-radius: 20px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.1);
          width: 90%;
          max-width: 800px;
          margin-bottom: 2rem;
        }

        .input-group {
          display: grid;
          gap: 1.5rem;
          margin-bottom: 2rem;
        }
          .quote-container {
          position: absolute;
          bottom: 750px;
          left: 600px;
          max-width: 400px;
          background: rgba(255, 255, 255, 0.9);
          padding: 1.5rem;
          border-radius: 15px;
          box-shadow: 0 4px 15px rgba(0,0,0,0.1);
          animation: fadeInOut 5s ease-in-out infinite;
        }

        .quote-text {
          font-size: 1.1rem;
          color: #2c3e50;
          font-style: italic;
          line-height: 1.4;
          text-align: center;
        }

        @keyframes fadeInOut {
          0%, 100% { opacity: 0.7; transform: translateY(10px); }
          50% { opacity: 1; transform: translateY(0); }
        }

        /* Update Get Started button styles */
        .get-started-button {
          background: linear-gradient(135deg, #2ecc71 0%, #27ae60 100%);
          color: white;
          padding: 1rem 3rem;
          border: none;
          border-radius: 30px;
          font-size: 1.2rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          margin: 2rem auto 0;
          display: block;
          width: fit-content;
          opacity: 1;
          pointer-events: auto;
        }

        .get-started-button:disabled {
          background: #95a5a6;
          cursor: not-allowed;
          opacity: 0.7;
          pointer-events: none;
        }

        .input-label {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          font-weight: 500;
          color: #2c3e50;
        }

        .styled-input {
          padding: 0.8rem;
          border: 2px solid #dfe6e9;
          border-radius: 10px;
          font-size: 1rem;
          transition: all 0.3s ease;
        }

        .styled-input:focus {
          border-color: #4a69bd;
          box-shadow: 0 0 0 3px rgba(74, 105, 189, 0.2);
        }

        .generate-button {
          background: linear-gradient(135deg, #4a69bd 0%, #3c538f 100%);
          color: white;
          padding: 1rem 2rem;
          border: none;
          border-radius: 25px;
          font-size: 1.1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.8rem;
          width: 100%;
        }

        .generate-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(74, 105, 189, 0.3);
        }

        .generate-button.loading {
          background: linear-gradient(135deg, #dfe6e9 0%, #bdc3c7 100%);
          cursor: not-allowed;
        }

        .spinner {
          width: 20px;
          height: 20px;
          border: 3px solid rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          border-top-color: white;
          animation: spin 1s ease-in-out infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .study-plan-output {
          background: rgba(255, 255, 255, 0.95);
          padding: 2rem;
          border-radius: 20px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.1);
          width: 90%;
          max-width: 1000px;
          margin-top: 2rem;
        }

        .subject-card {
          background: #f8f9fa;
          border-radius: 15px;
          padding: 1.5rem;
          margin-bottom: 2rem;
          box-shadow: 0 4px 6px rgba(0,0,0,0.05);
        }

        .schedule-grid {
          display: grid;
          gap: 1.5rem;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        }

        .day-card {
          background: white;
          border-radius: 12px;
          padding: 1rem;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }

        .time-slot {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 0.8rem;
          margin: 0.5rem 0;
          background: #f8f9fa;
          border-radius: 8px;
        }

        .get-started-button {
          background: linear-gradient(135deg, #2ecc71 0%, #27ae60 100%);
          color: white;
          padding: 1rem 3rem;
          border: none;
          border-radius: 30px;
          font-size: 1.2rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          margin: 2rem auto 0;
          display: block;
          width: fit-content;
        }

        .get-started-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(46, 204, 113, 0.3);
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .main-heading {
            font-size: 2rem;
          }
          
          .upload-section, .configuration-section, .study-plan-output {
            width: 95%;
            padding: 1.5rem;
          }
        }
        `}
      </style>
    </div>
  );
};

export default UploadSyllabus;
