import React, { useState,useEffect} from "react";
import { useGlobalState } from './GlobalStateContext';
const nicknameSuggestions = [
  "CodeWizard", "MathWhiz", "ScienceBuff", 
  "HistoryHero", "ArtVirtuoso", "LitGenius",
  "PhysicsPhantom", "ChemChamp", "BioBrain", 
  "TechTitan"
];
const StudentProfile = () => {
  const { state } = useGlobalState();
  const [isEditing, setIsEditing] = useState(false);
  const [newInterest, setNewInterest] = useState("");
  const [profile, setProfile] = useState({
    username: "",
    nickname: "",
    name: "",
    bio: "",
    dob: "",
    location: "J",
    education: {
      institution: "",
      gradeLevel: "",
      major: "",
      graduationYear: ""
    },
    skills: {
      criticalThinking: 4,
      leadership: 3,
      communication: 4
    },
    interests: [],
    achievements: {
      completedSessions: state.completedSessions?.length || 0,
      completedSyllabi: state.completedSyllabi || 0,
      studyHours: state.studyHours || 0,
      streakDays: state.streakDays || 0
    },
    badges: []
  });
  
  const [tempProfile, setTempProfile] = useState({...profile});
  const [profileImage, setProfileImage] = useState("/image4.jpg");
  const interestOptions = [
    "Mathematics", "Programming", "Science", 
    "History", "Art", "Literature", "Physics",
    "Chemistry", "Biology", "Engineering"
  ];
  useEffect(() => {
    const newNickname = nicknameSuggestions[
      Math.floor(Math.random() * nicknameSuggestions.length)
    ];
    setProfile(prev => ({
      ...prev,
      nickname: newNickname,
      achievements: {
        completedSessions: state.completedSessions?.length || 0,
        completedSyllabi: state.completedSyllabi || 0,
        studyHours: state.studyHours || 0,
        streakDays: state.streakDays || 0
      }
    }));
  }, [state.completedSessions, state.completedSyllabi, state.studyHours, state.streakDays]);
  // Enhanced Gamification System
  const handleInterestUpdate = (action, value) => {
    setTempProfile(prev => {
      const interests = [...prev.interests];
      if(action === 'add' && value && !interests.includes(value)) {
        interests.push(value);
      } else if(action === 'remove') {
        const index = interests.indexOf(value);
        if(index !== -1) interests.splice(index, 1);
      }
      return {...prev, interests};
    });
  };
  const educationInputStyles = {
    container: "education-input-container",
    label: "education-input-label",
    input: "education-input-field",
    select: "education-select-field"
  };
  const achievements = {
    completedSessions: state.completedSessions.length,
    studyHours: state.studyHours,
    // ... other metrics
  };
  const badges = [
    { 
      id: 1, 
      name: "Newbie", 
      icon: "🍼", 
      condition: p => p.achievements.completedSessions >= 1 
    },
    { 
      id: 2, 
      name: "Session Pro", 
      icon: "⚡", 
      condition: p => p.achievements.completedSessions >= 10
    },
    { 
      id: 3, 
      name: "Syllabus Master", 
      icon: "📜", 
      condition: p => p.achievements.completedSyllabi >= 1
    },
    { 
      id: 4, 
      name: "Study Marathoner", 
      icon: "🏃♂️", 
      condition: p => p.achievements.studyHours >= 100
    }
  ];
  // Updated calculateNextBadge function
const calculateNextBadge = () => {
  if (profile.achievements.completedSessions < 10) {
    return {
      name: "Session Pro",
      remaining: 10 - profile.achievements.completedSessions,
      icon: "⚡"
    };
  }
  if (profile.achievements.completedSyllabi < 1) {
    return {
      name: "Syllabus Master",
      remaining: 1 - profile.achievements.completedSyllabi,
      icon: "📜"
    };
  }
  // Add more conditions as needed
  return null;
};

  const calculateLevel = () => Math.floor(profile.achievements.studyHours / 50);

  useEffect(() => {
    // Auto-generate nickname based on achievements
    const newNickname = nicknameSuggestions[
      Math.floor(Math.random() * nicknameSuggestions.length)
    ];
    setProfile(prev => ({...prev, nickname: newNickname}));
  }, [profile.achievements.completedSessions]);

  const handleEditToggle = () => {
    if (isEditing) {
      setProfile(tempProfile);
    } else {
      setTempProfile({...profile});
    }
    setIsEditing(!isEditing);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result);
      };
      reader.onerror = () => {
        setProfileImage("/image4.jpg");
      };
      reader.readAsDataURL(file);
    }
  };


  const handleEducationChange = (field, value) => {
    setTempProfile(prev => ({
      ...prev,
      education: { ...prev.education, [field]: value }
    }));
  };

  return (
    <div className="profile-container">
      <aside className="sidebar">
        <div className="profile-section">
          <label htmlFor="image-upload" className="profile-pic-container">
          <img
    src={profileImage}
    alt="Profile"
    className="profile-pic"
    onError={(e) => {
      e.target.onerror = null;
      e.target.src = "/image4.jpg";
    }}
  />
            {isEditing && <div className="upload-overlay">📷</div>}
          </label>
          {isEditing && (
            <input
              id="image-upload"
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              style={{ display: 'none' }}
            />
          )}

          {isEditing ? (
            <div className="edit-fields">
              <input
                value={tempProfile.username}
                onChange={e => setTempProfile({...tempProfile, username: e.target.value})}
                placeholder="Username"
              />
              <select
                value={tempProfile.nickname}
                onChange={e => setTempProfile({...tempProfile, nickname: e.target.value})}
              >
                {nicknameSuggestions.map((nick, i) => (
                  <option key={i} value={nick}>{nick}</option>
                ))}
              </select>
            </div>
          ) : (
            <div className="profile-names">
              <h3>@{profile.username}</h3>
              <h4>"{profile.nickname}"</h4>
            </div>
          )}

          <div className="level-badge">
            <div className="level-circle">Lv. {calculateLevel()}</div>
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{ width: `${(profile.achievements.studyHours % 50) * 2}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Education Edit Section */}
        {isEditing && (
          <div className="education-edit">
            <h4>🎓 Education Details</h4>
            <div className={educationInputStyles.container}>
              <label className={educationInputStyles.label}>
                Institution:
                <input
                  className={educationInputStyles.input}
                  value={tempProfile.education.institution}
                  onChange={e => handleEducationChange('institution', e.target.value)}
                />
              </label>
              
              <label className={educationInputStyles.label}>
                Education Level:
                <select
                  className={educationInputStyles.select}
                  value={tempProfile.education.gradeLevel}
                  onChange={e => handleEducationChange('gradeLevel', e.target.value)}
                >
                  <option>High School</option>
                  <option>Undergraduate</option>
                  <option>Graduate</option>
                </select>
              </label>

              <label className={educationInputStyles.label}>
                Major:
                <input
                  className={educationInputStyles.input}
                  value={tempProfile.education.major}
                  onChange={e => handleEducationChange('major', e.target.value)}
                />
              </label>

              <label className={educationInputStyles.label}>
                Graduation Year:
                <input
                  type="number"
                  className={educationInputStyles.input}
                  value={tempProfile.education.graduationYear}
                  onChange={e => handleEducationChange('graduationYear', e.target.value)}
                />
              </label>
            </div>

            <div className="interest-selection">
              <h4>🎯 Select Your Interests</h4>
              <div className="interest-options">
                {interestOptions.map(interest => (
                  <button
                    key={interest}
                    type="button"
                    className={`interest-option ${
                      tempProfile.interests.includes(interest) ? 'selected' : ''
                    }`}
                    onClick={() => handleInterestUpdate(
                      tempProfile.interests.includes(interest) ? 'remove' : 'add',
                      interest
                    )}
                  >
                    {interest}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <nav className="menu">
          <button className="edit-btn" onClick={handleEditToggle}>
            {isEditing ? '💾 Save Profile' : '✏️ Edit Profile'}
          </button>
        </nav>

         In StudentProfile's badge section
        <div className="badges-slider-container">
  <h4>🏆 Achievements Progress</h4>
  <div className="badges-slider">
    {badges.map(badge => {
      const isUnlocked = badge.condition(profile);
      
      return (
        <div 
          key={badge.id} 
          className={`badge-slide ${isUnlocked ? 'unlocked' : 'locked'}`}
        >
          <div className="badge-icon-wrapper">
            <span className="badge-icon">
              {isUnlocked ? badge.icon : '🔒'}
            </span>
            {!isUnlocked && (
              <div className="badge-progress-overlay">
                <div className="progress-circle">
                  {badge.id === 2 && `${calculateNextBadge()?.remaining || 0}/10`}
                </div>
              </div>
            )}
          </div>
          <span className="badge-name">{badge.name}</span>
          {!isUnlocked && (
            <div className="badge-tooltip">
              {badge.id === 2 
                ? `Complete ${10 - state.completedSessions.length} more sessions`
                : 'Keep learning to unlock!'}
            </div>
          )}
        </div>
      );
    })}
  </div>
</div>

      </aside>
      <main className="main-content">
        {/* Added Education Display */}
        <section className="education-section">
          <h2>🎓 Education</h2>
          <div className="education-details">
            <p><strong>Institution:</strong> {profile.education.institution}</p>
            <p><strong>Level:</strong> {profile.education.gradeLevel}</p>
            <p><strong>Major:</strong> {profile.education.major}</p>
            <p><strong>Graduation Year:</strong> {profile.education.graduationYear}</p>
          </div>
        </section>

        <section className="achievements-section">
          <h2>📈 Learning Statistics</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <h3>{state.completedSessions.length}</h3>
              <p>Completed Sessions</p>
            </div>
            <div className="stat-card">
              <h3>{state.completedSyllabi}</h3>
              <p>Syllabus Mastered</p>
            </div>
            <div className="stat-card">
              <h3>{state.studyHours}</h3>
              <p>Study Hours</p>
            </div>
          </div>
        </section>

        <section className="interests-section">
          <h2>❤️ Interests</h2>
          <div className="interests-grid">
            {profile.interests.map((interest, index) => (
              <div key={index} className="interest-chip">
                {interest}
              </div>
            ))}
          </div>
          <div className="progress-tips">
      <h3>Next Achievement</h3>
      {calculateNextBadge() && (
        <div className="badge-progress">
          <span className="badge-preview">{calculateNextBadge().icon}</span>
          <p>Complete {calculateNextBadge().remaining} more sessions to unlock:</p>
          <h4>{calculateNextBadge().name}</h4>
        </div>
      )}
    </div>
        </section>
      </main>

      <style>{`
        .profile-container {
          display: flex;
          min-height: 100vh;
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
        }

        .sidebar {
          width: 300px;
          background: rgba(255, 255, 255, 0.9);
          padding: 2rem;
          margin-top:1px;
          box-shadow: 4px 0 15px rgba(0, 0, 0, 0.1);
          backdrop-filter: blur(10px);
        }

        .profile-pic-container {
          position: relative;
          display: block;
          cursor: pointer;
          width: 200px;
          height: 200px;
          margin: 0 auto;
        }

        .profile-pic {
          width: 200px;
          height: 200px;
          border-radius: 50%;
          object-fit: cover;
          transition: transform 0.3s ease;
        }

        .upload-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.3s ease;
          border-radius: 50%;
        }
          .education-input-container {
          display: grid;
          gap: 1.2rem;
          padding: 1rem;
          background: #f8f9fa;
          border-radius: 12px;
        }

        .education-input-label {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          font-weight: 500;
          color: #2c3e50;
        }

        .education-input-field {
          padding: 0.8rem 1.2rem;
          border: 2px solid #e0e0e0;
          border-radius: 8px;
          font-size: 1rem;
          transition: all 0.3s ease;
        }

        .education-input-field:focus {
          border-color: #4a90e2;
          box-shadow: 0 0 0 3px rgba(74, 144, 226, 0.2);
          outline: none;
        }

        .education-select-field {
          padding: 0.8rem 1.2rem;
          border: 2px solid #e0e0e0;
          border-radius: 8px;
          font-size: 1rem;
          background: white;
          appearance: none;
          background-image: url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23007CB2%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E");
          background-repeat: no-repeat;
          background-position: right 0.7rem top 50%;
          background-size: 0.65rem auto;
        }

        /* Interest Selection Styling */
        .interest-selection {
          margin-top: 2rem;
          padding: 1rem;
          background: white;
          border-radius: 12px;
        }

        .interest-options {
          display: flex;
          flex-wrap: wrap;
          gap: 0.8rem;
          margin-top: 1rem;
        }

        .interest-option {
          padding: 0.6rem 1.2rem;
          border: 2px solid #e0e0e0;
          border-radius: 20px;
          background: white;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .interest-option.selected {
          background: #4a90e2;
          color: white;
          border-color: #4a90e2;
        }


        .profile-pic-container:hover .upload-overlay {
          opacity: 1;
        }
        .profile-names {
          text-align: center;
          margin: 1rem 0;
        }
        .profile-names h4 {
          color: #666;
          font-style: italic;
        }
        .edit-fields input, 
        .edit-fields select {
          width: 100%;
          margin: 0.5rem 0;
          padding: 0.5rem;
          border: 1px solid #ddd;
          border-radius: 4px;
        }
        .education-edit {
          margin: 1rem 0;
          padding: 1rem;
          background: #f8f9fa;
          border-radius: 8px;
        }
        .badges-slider-container {
  margin-top: 2rem;
  padding: 1rem 0;
  position: relative;
}

.badges-slider-container h4 {
  margin-bottom: 1.5rem;
  padding-left: 1rem;
}

.badges-slider {
  display: flex;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  gap: 1.5rem;
  padding: 0 1rem 1rem;
  -webkit-overflow-scrolling: touch;
}

.badges-slider::-webkit-scrollbar {
  height: 6px;
}

.badges-slider::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.badges-slider::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 3px;
}

.badges-slider::-webkit-scrollbar-thumb:hover {
  background: #555;
}

.badge-slide {
  scroll-snap-align: start;
  flex: 0 0 120px;
  text-align: center;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 12px;
  padding: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s;
  position: relative;
}

.badge-slide.locked {
  opacity: 0.7;
  background: linear-gradient(45deg, #f5f5f5, #e0e0e0);
}

.badge-icon-wrapper {
  position: relative;
  width: 60px;
  height: 60px;
  margin: 0 auto 1rem;
}

.badge-icon {
  font-size: 2.5rem;
  display: block;
  transition: transform 0.2s;
}

.badge-progress-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.progress-circle {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: bold;
  color: #4a90e2;
}

.badge-name {
  display: block;
  font-size: 0.9rem;
  font-weight: 500;
  color: #333;
}

.badge-tooltip {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.8rem;
  white-space: nowrap;
  opacity: 0;
  transition: opacity 0.2s;
  pointer-events: none;
}

.badge-slide:hover .badge-tooltip {
  opacity: 1;
}
        .education-edit h4 {
          margin-bottom: 1rem;
        }
        .education-details p {
          margin: 0.5rem 0;
          padding: 0.5rem;
          background: #f8f9fa;
          border-radius: 4px;
        }

        .level-badge {
          text-align: center;
          margin: 1.5rem 0;
        }

        .level-circle {
          display: inline-block;
          background: #4a90e2;
          color: white;
          padding: 0.5rem 1.5rem;
          border-radius: 20px;
          font-weight: bold;
          margin-bottom: 0.5rem;
        }

        .progress-bar {
          height: 8px;
          background: #eee;
          border-radius: 4px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: #4a90e2;
          transition: width 0.3s ease;
        }

        .badges-section {
          margin-top: 2rem;
        }

        .badges-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
          margin-top: 1rem;
        }

        .badge-card {
          padding: 1rem;
          background: #f8f9fa;
          border-radius: 10px;
          text-align: center;
          transition: transform 0.2s;
        }

        .badge-card:hover {
          transform: translateY(-3px);
        }

        .badge-icon {
          font-size: 2rem;
          display: block;
          margin-bottom: 0.5rem;
        }

        .main-content {
          flex: 1;
          padding: 3rem;
          background: rgba(255, 255, 255, 0.8);
        }

        .skills-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
          margin-top: 1.5rem;
        }

        .skill-item {
          background: white;
          padding: 1.5rem;
          border-radius: 12px;
          box-shadow: 0 3px 6px rgba(0, 0, 0, 0.1);
        }

        .skill-name {
          text-transform: capitalize;
          font-weight: 600;
          color: #333;
        }

        .skill-level {
          margin-top: 0.8rem;
        }

        .star {
          color: #ddd;
          font-size: 1.2rem;
          margin-right: 0.3rem;
        }

        .star.filled {
          color: #ffd700;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 2rem;
          margin-top: 2rem;
        }

        .stat-card {
          background: white;
          padding: 2rem;
          border-radius: 12px;
          text-align: center;
          box-shadow: 0 3px 6px rgba(0, 0, 0, 0.1);
        }

        .interests-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 0.8rem;
          margin-top: 1.5rem;
        }

        .interest-chip {
          background: #4a90e2;
          color: white;
          padding: 0.5rem 1.2rem;
          border-radius: 20px;
          font-size: 0.9rem;
        }

        .edit-btn {
          background: #4a90e2;
          color: white;
          padding: 0.8rem 1.5rem;
          border: none;
          border-radius: 25px;
          cursor: pointer;
          transition: all 0.3s ease;
          width: 100%;
          font-size: 1rem;
        }

        .edit-btn:hover {
          background: #357abd;
          transform: translateY(-2px);
        }
      `}</style>
    </div>
  );
};

export default StudentProfile;