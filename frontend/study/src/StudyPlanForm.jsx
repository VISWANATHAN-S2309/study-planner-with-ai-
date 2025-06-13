import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";

const StudyPlanForm = () => {
  const [subjects, setSubjects] = useState([
    { id: uuidv4(), name: "", difficulty: "medium", file: null, syllabusId: null }
  ]);
  const [examDate, setExamDate] = useState("");
  const [studyHours, setStudyHours] = useState(4);
  const [loading, setLoading] = useState(false);
  const [dragIndex, setDragIndex] = useState(null);
  const navigate = useNavigate();

  const addSubject = () => {
    setSubjects([...subjects, 
      { id: uuidv4(), name: "", difficulty: "medium", file: null, syllabusId: null }
    ]);
  };

  const removeSubject = (id) => {
    setSubjects(subjects.filter(subject => subject.id !== id));
  };

  const handleSubjectChange = (id, field, value) => {
    setSubjects(subjects.map(subject => 
      subject.id === id ? { ...subject, [field]: value } : subject
    ));
  };

  const handleFileUpload = async (subjectId, file) => {
    const formData = new FormData();
    formData.append("file", file);
    
    try {
      const response = await axios.post("http://localhost:5000/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setSubjects(subjects.map(subject =>
        subject.id === subjectId ? { ...subject, syllabusId: response.data.id } : subject
      ));
    } catch (error) {
      console.error("Upload failed:", error);
    }
  };

  const handleGeneratePlan = async () => {
    setLoading(true);
    try {
      const payload = {
        subjects: subjects.map(subject => ({
          syllabusId: subject.syllabusId,
          difficulty: subject.difficulty,
          name: subject.name
        })),
        examDate,
        studyHours
      };

      const response = await axios.post("http://localhost:5000/generate-plan", payload);
      navigate("/study-plan", { state: { plan: response.data.plan } });
    } catch (error) {
      console.error("Plan generation failed:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="multi-subject-container">
      <h2>Multi-Subject Study Planner</h2>
      
      <div className="calendar-section">
        <label>Final Exam Date:</label>
        <input type="date" value={examDate} onChange={(e) => setExamDate(e.target.value)} />
        
        <label>Daily Study Hours:</label>
        <input type="number" min="1" value={studyHours} 
               onChange={(e) => setStudyHours(e.target.value)} />
      </div>

      {subjects.map((subject, index) => (
        <div key={subject.id} className="subject-card">
          <div className="subject-header">
            <input
              type="text"
              placeholder="Subject Name"
              value={subject.name}
              onChange={(e) => handleSubjectChange(subject.id, "name", e.target.value)}
            />
            <select
              value={subject.difficulty}
              onChange={(e) => handleSubjectChange(subject.id, "difficulty", e.target.value)}
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
            <button onClick={() => removeSubject(subject.id)}>×</button>
          </div>

          <div className={`drop-zone ${dragIndex === index ? "active" : ""}`}
               onDragOver={(e) => { e.preventDefault(); setDragIndex(index); }}
               onDragLeave={() => setDragIndex(null)}
               onDrop={(e) => {
                 e.preventDefault();
                 setDragIndex(null);
                 const file = e.dataTransfer.files[0];
                 handleSubjectChange(subject.id, "file", file);
                 handleFileUpload(subject.id, file);
               }}>
            {subject.file ? (
              <div className="file-info">
                <span>{subject.file.name}</span>
                <progress value={subject.syllabusId ? 100 : 0} max="100" />
              </div>
            ) : (
              <p>Drag & Drop Syllabus PDF or Click to Upload</p>
            )}
            <input type="file" hidden 
                   onChange={(e) => {
                     const file = e.target.files[0];
                     handleSubjectChange(subject.id, "file", file);
                     handleFileUpload(subject.id, file);
                   }} />
          </div>
        </div>
      ))}

      <div className="controls">
        <button onClick={addSubject}>Add Subject +</button>
        <button onClick={handleGeneratePlan} disabled={loading || !subjects.every(s => s.syllabusId)}>
          {loading ? "Generating Plan..." : "Generate Smart Plan"}
        </button>
      </div>

      <style>
        {`
        .multi-subject-container {
          padding: 2rem;
          max-width: 800px;
          margin: 0 auto;
        }

        .subject-card {
          margin: 1.5rem 0;
          padding: 1rem;
          border-radius: 8px;
          background: #fff;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .subject-header {
          display: flex;
          gap: 1rem;
          margin-bottom: 1rem;
          align-items: center;
        }

        .subject-header input {
          flex: 1;
          padding: 0.5rem;
          border: 1px solid #ddd;
          border-radius: 4px;
        }

        .subject-header select {
          padding: 0.5rem;
          border-radius: 4px;
        }

        .drop-zone {
          border: 2px dashed #ccc;
          padding: 2rem;
          text-align: center;
          border-radius: 8px;
          transition: all 0.3s ease;
        }

        .drop-zone.active {
          border-color: #007bff;
          background: #f0f8ff;
        }

        .file-info {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .controls {
          display: flex;
          gap: 1rem;
          justify-content: center;
          margin-top: 2rem;
        }

        button {
          padding: 0.8rem 1.5rem;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          background: #007bff;
          color: white;
        }

        button:disabled {
          background: #cccccc;
          cursor: not-allowed;
        }
        `}
      </style>
    </div>
  );
};

export default StudyPlanForm;