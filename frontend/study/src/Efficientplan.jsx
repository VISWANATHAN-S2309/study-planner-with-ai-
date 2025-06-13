import React, { useEffect, useState } from "react";
import axios from "axios";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useGlobalState } from './GlobalStateContext';
import { Bar, Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, PointElement, LineElement } from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement
);

const Efficientplan = () => {
  const [studyPlan, setStudyPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const { state, dispatch } = useGlobalState();
  const [todos, setTodos] = useState({});
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [completedSessions, setCompletedSessions] = useState([]);
  const [autoProgression, setAutoProgression] = useState(true);
  const [timer, setTimer] = useState({ 
    startTime: null,
    duration: 0,
    isActive: false,
    isWork: true
  });
  const [tick, setTick] = useState(0);
  const [activeSession, setActiveSession] = useState(null);
  const syllabusId = localStorage.getItem("syllabusId");
  const [notifications, setNotifications] = useState([]);
  const [breakReminder, setBreakReminder] = useState(false);
  const [showCompletionPrompt, setShowCompletionPrompt] = useState(false);
  const [pendingSession, setPendingSession] = useState(null);
  const [extraTimeUsed, setExtraTimeUsed] = useState(0);
  const [retryCount, setRetryCount] = useState(0);
  const [quizData, setQuizData] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [score, setScore] = useState(0);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizResults, setQuizResults] = useState(null);
  const [isExtendingSession, setIsExtendingSession] = useState(false);
  const [nextSessionReminder, setNextSessionReminder] = useState(null);
  const [performanceMetrics, setPerformanceMetrics] = useState({
    completed: 0,
    pending: 0,
    timeSpent: 0,
    missed: 0
  });
  const [motivationalMessage, setMotivationalMessage] = useState('');
  const [showChat, setShowChat] = useState(false);
const [chatMessages, setChatMessages] = useState([]);
const [inputMessage, setInputMessage] = useState('');
const getProgressHistory = () => {
  const history = [];
  let completedCount = 0;
  
  // Add null/undefined check and optional chaining
  if (!studyPlan) return [];
  
  studyPlan.forEach((day, dayIndex) => {
    day.sessions?.forEach((session, sessionIndex) => { // Add optional chaining
      if (completedSessions.includes(`${dayIndex}-${sessionIndex}`)) {
        completedCount++;
      }
    });
    history.push(completedCount);
  });
  
  return history;
};

// Update lineChartData to handle empty state
const lineChartData = {
  labels: studyPlan?.map((day, index) => `Day ${index + 1}`) || [],
  datasets: [
    {
      label: 'Completed Sessions',
      data: studyPlan ? getProgressHistory() : [], // Add conditional
      borderColor: '#2196F3',
      tension: 0.4,
      fill: false,
    },
  ],
};
const barChartData = {
  labels: ['Completed', 'Pending'],
  datasets: [
    {
      label: 'Sessions',
      data: [performanceMetrics.completed, performanceMetrics.pending],
      backgroundColor: ['#4CAF50', '#FF6384'],
      borderWidth: 1,
    },
  ],
};

const resetQuiz = () => {
  setQuizData(null);
  setCurrentQuestion(0);
  setSelectedAnswer(null);
  setScore(0);
  setQuizResults(null);
};
const fetchQuizQuestions = async (topic) => {
  try {
    const response = await axios.post('http://localhost:5000/generate-quiz', {
      topic: topic
    });
    return response.data.questions;
  } catch (error) {
    console.error("Error fetching quiz:", error);
    return null;
  }
};
const handleAnswerSelect = (answerIndex) => {
  setSelectedAnswer(answerIndex);
};

const handleNextQuestion = async () => {
  if (selectedAnswer === quizData.questions[currentQuestion].correctIndex) {
    setScore(prev => prev + 1);
  }

  if (currentQuestion < quizData.questions.length - 1) {
    setCurrentQuestion(prev => prev + 1);
    setSelectedAnswer(null);
  } else {
    const finalScore = (score / quizData.questions.length) * 100;
    setQuizResults({
      score: finalScore,
      total: quizData.questions.length
    });
    
    // Get motivational message based on score
    const motivation = finalScore >= 80 ? "🎉 Excellent! You're ready to move on!" :
      finalScore >= 50 ? "👍 Good effort! Review and continue!" :
      "💪 Keep practicing! You'll get better!";
    
    setMotivationalMessage(motivation);
    setShowQuiz(false);
  }
};


  // Update performance metrics when sessions change
  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;
  
    // Add user message to chat
    const newMessage = { text: inputMessage, isBot: false };
    setChatMessages(prev => [...prev, newMessage]);
    
    try {
      // Get bot response
      const response = await axios.post('http://localhost:5000/chat', {
        question: inputMessage
      });
      
      // Add bot response to chat
      const botMessage = { text: response.data.answer, isBot: true };
      setChatMessages(prev => [...prev, botMessage]);
    } catch (error) {
      const errorMessage = { text: "Sorry, I'm having trouble connecting.", isBot: true };
      setChatMessages(prev => [...prev, errorMessage]);
    }
    
    setInputMessage('');
  };
  
  useEffect(() => {
    if (studyPlan) {
      const totalSessions = studyPlan.flatMap(day => day.sessions).length;
      const newMetrics = {
        completed: completedSessions.length,
        pending: totalSessions - completedSessions.length,
        timeSpent: completedSessions.length * 45, // Assuming 45min per session
        missed: Math.max(0, totalSessions - completedSessions.length - 
          (studyPlan[0]?.sessions.length || 0)) // Simple missed calculation
      };
      setPerformanceMetrics(newMetrics);
      updateMotivationalMessage(newMetrics);
    }
  }, [completedSessions, studyPlan]);
  const handleQuizCompletion = () => {
  setQuizResults(null);
  markSessionCompleted();
  proceedToNextSession();
};

const proceedToNextSession = (completed) => {
  const [currentDay, currentSession] = pendingSession.split('-').map(Number);
  const nextSession = findNextSession(currentDay, currentSession, completed);
  
  if (nextSession) {
    const { dayIndex, sessionIndex } = nextSession;
    const session = studyPlan[dayIndex].sessions[sessionIndex];
    handleStartSession(dayIndex, sessionIndex, session.duration);
  }
};

// Enhance findNextSession to accept completed sessions
const findNextSession = (currentDay, currentSession, completed) => {
  let dayIndex = currentDay;
  let sessionIndex = currentSession + 1;

  while (dayIndex < studyPlan.length) {
    while (sessionIndex < studyPlan[dayIndex].sessions.length) {
      const sessionId = `${dayIndex}-${sessionIndex}`;
      if (!completed.includes(sessionId)) {
        return { dayIndex, sessionIndex };
      }
      sessionIndex++;
    }
    dayIndex++;
    sessionIndex = 0;
  }
  return null;
};
  
  
  const updateMotivationalMessage = (metrics) => {
    const completionRate = metrics.completed / (metrics.completed + metrics.pending);
    if (completionRate >= 0.9) {
      setMotivationalMessage("🔥 Awesome! You're crushing your study goals!");
    } else if (completionRate >= 0.7) {
      setMotivationalMessage("🚀 Great progress! Keep up the momentum!");
    } else {
      setMotivationalMessage("💪 Every session counts! Let's catch up!");
    }
  };
  useEffect(() => {
    const savedState = JSON.parse(localStorage.getItem('studyState'));
    if (savedState) {
      setTodos(savedState.todos || {});
      setCompletedSessions(savedState.completedSessions || []);
      setTimer(savedState.timer || { 
        startTime: null,
        duration: 0,
        isActive: false,
        isWork: true
      });
      setActiveSession(savedState.activeSession || null);
      setStudyPlan(savedState.studyPlan || null);
    }
  }, []);

  useEffect(() => {
    const stateToSave = {
      todos,
      completedSessions,
      timer,
      activeSession,
      studyPlan
    };
    localStorage.setItem('studyState', JSON.stringify(stateToSave));
  }, [todos, completedSessions, timer, activeSession, studyPlan]);

  // Improved timer logic
  const getRemainingTime = () => {
    if (!timer.isActive || !timer.startTime) return timer.duration;
    const elapsed = Math.floor((Date.now() - timer.startTime) / 1000);
    return Math.max(timer.duration - elapsed, 0);
  };


  useEffect(() => {
    let interval;
    if (timer.isActive) {
      interval = setInterval(() => {
        const remaining = getRemainingTime();
        setTick(prev => prev + 1); // Force re-render
        if (remaining <= 0) {
          handleSessionComplete();
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer.isActive]);

  // Page visibility handling
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && timer.isActive) {
        const remaining = getRemainingTime();
        setTimer(prev => ({
          ...prev,
          duration: remaining,
          startTime: Date.now() - (prev.duration - remaining) * 1000
        }));
        setTick(prev => prev + 1); // Force immediate update
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [timer.isActive]);

  // Modified session handling
  const handleStartSession = (dayIndex, sessionIndex, duration) => {
    const sessionId = `${dayIndex}-${sessionIndex}`;
    resetQuiz(); // Reset quiz when starting a new session
    setActiveSession(sessionId);
    setTimer({
      startTime: Date.now(),
      duration: parseDuration(duration),
      isActive: true,
      isWork: true
    });
  };

  // const handleSessionComplete = () => {
  //   if (timer.isWork) {
  //     const newCompleted = [...completedSessions, activeSession];
  //     setCompletedSessions(newCompleted);
      
  //     // Automatically start break timer
  //     setBreakReminder(true);
  //     setTimeout(() => {
  //       setTimer({
  //         startTime: Date.now(),
  //         duration: 300,
  //         isActive: true,
  //         isWork: false
  //       });
  //     }, 5000);
      
  //     // Find next session coordinates
  //     const [currentDay, currentSession] = activeSession.split('-').map(Number);
  //     let nextDay = currentDay;
  //     let nextSession = currentSession + 1;
  
  //     // Find next available session
  //     while (nextDay < studyPlan.length) {
  //       if (nextSession < studyPlan[nextDay].sessions.length) {
  //         const nextSessionId = `${nextDay}-${nextSession}`;
  //         if (!newCompleted.includes(nextSessionId) && 
  //             isPreviousCompleted(nextDay, nextSession)) {
  //           // Auto-start next session after break
  //           setTimeout(() => {
  //             handleStartSession(nextDay, nextSession, 
  //               studyPlan[nextDay].sessions[nextSession].duration);
  //           }, 300000); // 5 minute break duration
  //           break;
  //         }
  //         nextSession++;
  //       } else {
  //         nextDay++;
  //         nextSession = 0;
  //       }
  //     }
  //   }
    
  //   setTimer(prev => ({ ...prev, isActive: false }));
  //   setActiveSession(null);
  // };
  
  useEffect(() => {
    let animationFrame;
    
    const updateTimer = () => {
      if (timer.isActive) {
        setTick(prev => prev + 1);
        animationFrame = requestAnimationFrame(updateTimer);
      }
    };
  
    if (timer.isActive) {
      animationFrame = requestAnimationFrame(updateTimer);
    }
    
    return () => cancelAnimationFrame(animationFrame);
  }, [timer.isActive]);
  // Keep the rest of your component code the same until return statement...
  const showAchievementProgress = (completedCount) => {
    const milestones = [5, 10, 25, 50];
    const nextMilestone = milestones.find(m => m > completedCount);
    
    if(nextMilestone) {
      const remaining = nextMilestone - completedCount;
      showNotification(
        "🎯 Progress Update",
        `Complete ${remaining} more sessions to reach ${nextMilestone} sessions!`
      );
    }
  };
  const handleCompletionConfirmation = async (confirmed) => {
    setShowCompletionPrompt(false);
    
    if (confirmed) {
      // Mark session as completed
      dispatch({ type: 'SESSION_COMPLETED', sessionId: pendingSession });
    
    // Check for badge eligibility
    const completedCount = state.completedSessions.length + 1;
    if(completedCount === 10) {
      dispatch({ type: 'ADD_BADGE', badge: 'Session Pro' });
      showNotification("🏆 Badge Earned!", "You've unlocked the Session Pro badge!");
    }
    if([8, 9].includes(completedCount)) {
      const remaining = 10 - completedCount;
      showNotification(
        "🔥 Keep Going!", 
        `Complete ${remaining} more ${remaining > 1 ? 'sessions' : 'session'} to earn the Session Pro badge!`
      );
    }
      const newCompleted = [...completedSessions, pendingSession];
      setCompletedSessions(newCompleted);
      const [dayIndex, sessionIndex] = pendingSession.split('-').map(Number);
      const session = studyPlan[dayIndex]?.sessions[sessionIndex];
     if (session) {
      const questions = await fetchQuizQuestions(session.topic);
      if (questions?.length > 0) {
        setQuizData({ questions });
        setShowQuiz(true);
      } else {
        markSessionCompleted();
        showAchievementProgress(state.completedSessions.length + 1);
        proceedToNextSession(newCompleted);
      }
    }
  } else {
    // Handle session extension
    setIsExtendingSession(true);
      const newDuration = 600; // 10 minutes in seconds
      setExtraTimeUsed(prev => prev + newDuration);
      setRetryCount(prev => prev + 1);
      
      setTimer({
        startTime: Date.now(),
        duration: newDuration,
        isActive: true,
        isWork: true
      });
    
  }
};
  //     setBreakReminder(true);
  //     setTimeout(() => {
  //       setTimer({
  //         startTime: Date.now(),
  //         duration: 300,
  //         isActive: true,
  //         isWork: false
  //       });
  //     }, 5000);

  //     // Adjust plan with extra time used
  //     if (extraTimeUsed > 0) {
  //       await adjustStudyPlanWithExtraTime(extraTimeUsed);
  //     }

  //     // Find next session
  //     const [currentDay, currentSession] = pendingSession.split('-').map(Number);
  //     findNextSession(currentDay, currentSession, newCompleted);
  //   } else {
  //     // Add 10 minutes and restart timer
  //     setIsExtendingSession(true);
  //     const newDuration = 600; // 10 minutes in seconds
  //     setExtraTimeUsed(prev => prev + newDuration);
  //     setRetryCount(prev => prev + 1);
      
  //     setTimer({
  //       startTime: Date.now(),
  //       duration: newDuration,
  //       isActive: true,
  //       isWork: true
  //     });
  //   }
  // };

  // // New function to adjust study plan
  // const adjustStudyPlanWithExtraTime = async (extraTime) => {
  //   try {
  //     const response = await axios.post('http://localhost:5000/adjust-plan', {
  //       syllabusId,
  //       completedSessions,
  //       extraTime,
  //       retryCount
  //     });
  //     setStudyPlan(response.data.updatedPlan);
  //     showNotification("Plan Updated", "Your study plan has been adjusted with extra time");
  //   } catch (error) {
  //     console.error("Error adjusting plan:", error);
  //   }
  // };

  useEffect(() => {
    if (timer.duration === 0 && !timer.isWork) {
      setBreakReminder(false);
      showNotification("⏰ Break Over!", "Time to get back to studying!");
      
      // Find first available session of the day
      const currentDate = new Date().toISOString().split('T')[0];
      const currentDay = studyPlan.findIndex(day => day.date === currentDate);
      if (currentDay !== -1) {
        const firstAvailable = studyPlan[currentDay].sessions.findIndex(
          (_, idx) => !completedSessions.includes(`${currentDay}-${idx}`)
        );
        if (firstAvailable !== -1) {
          handleStartSession(currentDay, firstAvailable, 
            studyPlan[currentDay].sessions[firstAvailable].duration);
        }
      }
    }
  }, [timer.duration, timer.isWork]);
  // Update timer display
  const formatTime = (seconds) => {
    const secs = Number(seconds);
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  // Adaptive planning API call
  const adjustStudyPlan = async () => {
    try {
      const response = await axios.post('http://localhost:5000/adjust-plan', {
        syllabusId,
        completedSessions,
        performanceMetrics
      });
      setStudyPlan(response.data.updatedPlan);
      showNotification("Plan Updated", "Your study plan has been optimized!");
    } catch (error) {
      console.error("Error adjusting plan:", error);
    }
  };
  
  useEffect(() => {
    if ("Notification" in window) {
      Notification.requestPermission();
    }
  }, []);
  useEffect(() => {
    if (!studyPlan) return;

    const checkUpcomingSessions = () => {
      const now = new Date();
      studyPlan.forEach((day, dayIndex) => {
        day.sessions.forEach((session, sessionIndex) => {
          const [hours, minutes] = session.time.split(':').map(Number);
          const sessionDate = new Date(day.date);
          sessionDate.setHours(hours, minutes, 0, 0);
          
          // Check if session starts in 10 minutes
          if (sessionDate - now > 0 && sessionDate - now <= 600000) {
            const sessionId = `${dayIndex}-${sessionIndex}`;
            if (!notifications.includes(sessionId)) {
              showNotification(
                `📚 Time to study!`,
                `Your next session on '${session.topic}' starts in 10 minutes.`
              );
              setNotifications(prev => [...prev, sessionId]);
            }
          }
        });
      });
    };

    const interval = setInterval(checkUpcomingSessions, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [studyPlan, notifications]);

  // Break reminder logic
  useEffect(() => {
    if (timer.duration === 0 && timer.isWork && !breakReminder) {
      showNotification(
        "🚀 Great job!",
        "Take a 5-minute break and refresh your mind."
      );
      setBreakReminder(true);
      setTimeout(() => {
        setTimer({
          startTime: Date.now(),
          duration: 300, // 5 minutes in seconds
          isActive: true,
          isWork: false
        });
      }, 5000);
    }
  }, [timer.duration, timer.isWork]); // Changed from timer.time to timer.duration

  // Revision reminder logic
  useEffect(() => {
    const handleRevisionReminder = (sessionId, topic) => {
      setTimeout(() => {
        showNotification(
          "🔁 Time to revise!",
          `It's time to revise '${topic}' before your next session!`
        );
      }, 86400000); // 24 hours later
    };

    completedSessions.forEach(sessionId => {
      if (!notifications.includes(`rev-${sessionId}`)) {
        const [dayIndex, sessionIndex] = sessionId.split('-').map(Number);
        const topic = studyPlan[dayIndex]?.sessions[sessionIndex]?.topic;
        if (topic) {
          handleRevisionReminder(sessionId, topic);
          setNotifications(prev => [...prev, `rev-${sessionId}`]);
        }
      }
    });
  }, [completedSessions]);

  const showNotification = (title, message) => {
    // System notification
    if (Notification.permission === "granted") {
      new Notification(title, { body: message });
    }
    // In-app toast notification
    toast.info(message, {
      position: "bottom-right",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    });
  };
  
  const markSessionCompleted = () => {
    const newCompleted = [...completedSessions, pendingSession];
    setCompletedSessions(newCompleted);
    proceedToNextSession(newCompleted);
  };

  // Modified timer handler to include break completion
  const handleSessionComplete = () => {
    if (timer.isWork) {
      setShowCompletionPrompt(true);
      setPendingSession(activeSession);
      setTimer(prev => ({ ...prev, isActive: false }));
    } else {
      setTimer({ time: 0, isActive: false, isWork: true });
      setBreakReminder(false);
      showNotification("⏰ Break Over!", "Time to get back to studying!");
    }
    if (performanceMetrics.pending > performanceMetrics.completed * 0.3) {
      adjustStudyPlan();
    }
  };

  // Load saved data from localStorage
  useEffect(() => {
    const savedTodos = localStorage.getItem('todos');
    const savedCompleted = localStorage.getItem('completedSessions');
    if (savedTodos) setTodos(JSON.parse(savedTodos));
    if (savedCompleted) setCompletedSessions(JSON.parse(savedCompleted));
  }, []);

  // Save data to localStorage
  useEffect(() => {
    localStorage.setItem('todos', JSON.stringify(todos));
    localStorage.setItem('completedSessions', JSON.stringify(completedSessions));
  }, [todos, completedSessions]);

  useEffect(() => {
    if (!syllabusId) return;

    const fetchStudyPlan = async () => {
      try {
        const response = await axios.get(
          `http://localhost:5000/get-study-plan/${syllabusId}`
        );
        
        if (response.data?.plan) {
          // Normalize different response formats
          const plan = Array.isArray(response.data.plan) ? 
            response.data.plan : 
            response.data.plan.study_plan;
            
          setStudyPlan(plan.map(day => ({
            ...day,
            sessions: day.sessions.map(session => ({
              time: session.time || '09:00 AM',
              duration: session.duration || '60 minutes',
              type: session.type || 'study',
              topic: session.topic || 'General Study',
              subject: session.subject || 'General',
              unit: session.unit || null,
              difficulty: session.difficulty || 'medium'
            }))
          })));
        }
      } catch (error) {
        console.error("Error fetching study plan:", error);
      } finally {
        setLoading(false);
      }
    };
    
    if (syllabusId) fetchStudyPlan();
  }, [syllabusId]);

  

  // Timer effect
  // useEffect(() => {
  //   let interval;
  //   if (timer.isActive && timer.time > 0) {
  //     interval = setInterval(() => {
  //       setTimer(prev => ({ ...prev, time: prev.time - 1 }));
  //     }, 1000);
  //   } else if (timer.time === 0 && timer.isActive) {
  //     handleSessionComplete();
  //   }
  //   return () => clearInterval(interval);
  // }, [timer.isActive, timer.time]);

  const parseDuration = (duration) => {
    const minutes = parseInt(duration.match(/\d+/)?.[0] || 25); // Default to 25 minutes
    return minutes * 60;
  };

  // const handleStartSession = (dayIndex, sessionIndex, duration) => {
  //   const sessionId = `${dayIndex}-${sessionIndex}`;
  //   setActiveSession(sessionId);
  //   setTimer({
  //     time: parseDuration(duration),
  //     isActive: true,
  //     isWork: true
  //   });
  // };
  const handleTodoChange = (sessionId, action, value = null, index = null) => {
    switch(action) {
      case 'add':
        setTodos(prev => ({
          ...prev,
          [sessionId]: [...(prev[sessionId] || []), { text: value, completed: false }]
        }));
        break;
      case 'toggle':
        setTodos(prev => ({
          ...prev,
          [sessionId]: prev[sessionId].map((todo, i) => 
            i === index ? { ...todo, completed: !todo.completed } : todo
          )
        }));
        break;
      case 'remove':
        setTodos(prev => ({
          ...prev,
          [sessionId]: prev[sessionId].filter((_, i) => i !== index)
        }));
        break;
    }
  };

  const isPreviousCompleted = (dayIndex, sessionIndex) => {
    if (sessionIndex === 0) return true;
    const prevSessionId = `${dayIndex}-${sessionIndex - 1}`;
    return completedSessions.includes(prevSessionId);
  };

  // const formatTime = (seconds) => {
  //   const mins = Math.floor(seconds / 60);
  //   const secs = seconds % 60;
  //   return `${mins}:${secs.toString().padStart(2, '0')}`;
  // };

  return (
    <div className="efficient-plan">
      <div className="chat-container">
  {showChat && (
    <div className="chat-window">
      <div className="chat-header">
        <h3>Study Assistant 🤖</h3>
        <button 
          className="close-chat"
          onClick={() => setShowChat(false)}
        >
          ×
        </button>
      </div>
      <div className="chat-messages">
        {chatMessages.map((msg, index) => (
          <div 
            key={index}
            className={`message ${msg.isBot ? 'bot' : 'user'}`}
          >
            {msg.text}
          </div>
        ))}
      </div>
      <div className="chat-input">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Ask me anything..."
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
        />
        <button onClick={handleSendMessage}>Send</button>
      </div>
    </div>
  )}
  <button 
    className="chat-toggle"
    onClick={() => setShowChat(!showChat)}
  >
    🤖
  </button>
</div>
      <div className="performance-dashboard">
      <div className="analytics-section">
  <button 
    className="analytics-button"
    onClick={() => setShowAnalytics(!showAnalytics)}
  >
    📈 View Analytics
  </button>

  {showAnalytics && (
    <div className="analytics-modal">
      <div className="analytics-content">
        <h2>Study Progress Analytics</h2>
        <button 
          className="close-analytics"
          onClick={() => setShowAnalytics(false)}
        >
          ×
        </button>
        
        <div className="chart-container">
          <h3>Session Completion Overview</h3>
          <Bar 
            data={barChartData}
            options={{
              responsive: true,
              plugins: {
                legend: { position: 'top' },
              }
            }}
          />
        </div>

        <div className="chart-container">
          <h3>Progress Over Time</h3>
          <Line 
            data={lineChartData}
            options={{
              responsive: true,
              plugins: {
                legend: { position: 'top' },
              }
            }}
          />
        </div>
      </div>
    </div>
  )}
</div>
        <h2>📊 Your Progress</h2>
        <div className="metrics">
          <div className="metric">
            <span className="value">{performanceMetrics.completed}</span>
            <span className="label">Completed</span>
          </div>
          <div className="metric">
            <span className="value">{performanceMetrics.pending}</span>
            <span className="label">Pending</span>
          </div>
          <div className="metric">
            <span className="value">{performanceMetrics.timeSpent}m</span>
            <span className="label">Time Spent</span>
          </div>
        </div>
        <div className="motivation-message">
          {motivationalMessage}
        </div></div>
      <h1>📚 Your Personalized Study Plan</h1>

      {timer.isActive && (
        <div className="pomodoro-timer">
          <h3>{timer.isWork ? "⏳ Study Time" : "☕ Break Time"}</h3>
          <div className="timer-display">
    {formatTime(getRemainingTime())}
  </div>
          <button 
            onClick={() => setTimer(prev => ({ ...prev, isActive: !prev.isActive }))}
            className="timer-control"
          >
            {timer.isActive ? "⏸️ Pause" : "▶️ Resume"}
          </button>
        </div>
      )}

      {loading ? (
        <div className="loading-indicator">
          <p>Loading study plan...</p>
        </div>
      ) : studyPlan ? (
        <div className="study-timeline">
          {studyPlan.map((day, dayIndex) => (
            <div key={dayIndex} className="study-day-card">
              <div className="day-header">
                <h2>📅 Day {dayIndex + 1} - {day.date}</h2>
                <span className="total-sessions">
                  {day.sessions.length} sessions
                </span>
              </div>
              
              <div className="session-list">
                {day.sessions.map((session, sessionIndex) => {
                  const sessionId = `${dayIndex}-${sessionIndex}`;
                  const isCompleted = completedSessions.includes(sessionId);
                  const isActive = activeSession === sessionId;
                  const sessionTodos = todos[sessionId] || [];

                  return (
                    <div key={sessionIndex} className={`session-card ${isCompleted ? 'completed' : ''}`}>
                      <div className="time-duration">
                        <span className="time">{session.time}</span>
                        <span className="duration">{session.duration}</span>
                      </div>
                      <div className="session-content">
                        <h3 className="topic">{session.topic}</h3>
                        
                        <div className="todo-section">
                          <div className="todo-input">
                            <input
                              type="text"
                              placeholder="Add a task + press Enter"
                              onKeyPress={(e) => {
                                if (e.key === 'Enter' && e.target.value.trim()) {
                                  handleTodoChange(sessionId, 'add', e.target.value.trim());
                                  e.target.value = '';
                                }
                              }}
                            />
                          </div>
                          <div className="todo-list">
                            {sessionTodos.map((todo, index) => (
                              <div key={index} className="todo-item">
                                <label>
                                  <input
                                    type="checkbox"
                                    checked={todo.completed}
                                    onChange={() => handleTodoChange(sessionId, 'toggle', null, index)}
                                  />
                                  <span className={todo.completed ? 'completed' : ''}>
                                    {todo.text}
                                  </span>
                                </label>
                                <button 
                                  className="remove-todo"
                                  onClick={() => handleTodoChange(sessionId, 'remove', null, index)}
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>

                        {!isCompleted && (
                          <button
                            className={`start-button ${!isPreviousCompleted(dayIndex, sessionIndex) ? 'disabled' : ''}`}
                            onClick={() => handleStartSession(dayIndex, sessionIndex, session.duration)}
                            disabled={!isPreviousCompleted(dayIndex, sessionIndex) || isActive}
                          >
                            {isActive ? '⏳ In Progress...' : '▶️ Start Session'}
                          </button>
                        )}
                        {showQuiz && (
  <div className="quiz-overlay">
    <div className="quiz-container">
      <h3>📝 Quick Knowledge Check: {studyPlan[activeSession]?.sessions[sessionIndex]?.topic}</h3>
      <div className="quiz-progress">
        Question {currentQuestion + 1} of {quizData.questions.length}
      </div>
      
      <div className="quiz-question">
        <h4>{quizData.questions[currentQuestion].question}</h4>
        <div className="quiz-options">
          {quizData.questions[currentQuestion].options.map((option, index) => (
            <button
              key={index}
              className={`quiz-option ${selectedAnswer === index ? 'selected' : ''}`}
              onClick={() => handleAnswerSelect(index)}
            >
              {String.fromCharCode(65 + index)}. {option}
            </button>
          ))}
        </div>
      </div>

      <div className="quiz-navigation">
        <button
          className="quiz-next-button"
          onClick={handleNextQuestion}
          disabled={selectedAnswer === null}
        >
          {currentQuestion === quizData.questions.length - 1 
            ? 'Finish Quiz' 
            : 'Next Question →'}
        </button>
      </div>
    </div>
  </div>
)}

  
  {quizResults && (
    <div className="quiz-results-overlay">
      <div className="quiz-results">
        <h3>Quiz Results</h3>
        <div className="quiz-score">
          🏆 Score: {Math.round(quizResults.score)}% ({quizResults.score} correct out of {quizResults.total})
        </div>
        <p className="quiz-motivation">{motivationalMessage}</p>
        <button
          className="quiz-continue-button"
          onClick={() => {
            setQuizResults(null);
            markSessionCompleted();
          }}
        >
          Continue to Next Session ➡️
        </button>
      </div>
    </div>
  )}

                        {showCompletionPrompt && (
    <div className="completion-prompt-overlay">
      <div className="completion-prompt">
        <h3>Session Completion Check</h3>
        <p>Did you complete this session?</p>
        <div className="prompt-buttons">
          <button 
            className="confirm-button"
            onClick={() => handleCompletionConfirmation(true)}
          >
            ✅ Yes, Mark Completed
          </button>
          <button
            className="extend-button"
            onClick={() => handleCompletionConfirmation(false)}
          >
            ⏳ No, Add 10 More Minutes
          </button>
        </div>
        <p className="extension-counter">
          Extra time used: {Math.floor(extraTimeUsed / 60)} minutes
        </p>
      </div>
    </div>
  )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="no-plan">
          <p>No study plan found. Please generate one first.</p>
        </div>
      )}

      <style>
        {`
        .efficient-plan {
          padding: 2rem;
          max-width: 1200px;
          margin: 0 auto;
        }

        .pomodoro-timer {
          position: fixed;
          top: 20px;
          right: 20px;
          background: white;
          padding: 1.5rem;
          border-radius: 10px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          z-index: 1000;
          text-align: center;
        }

        .timer-display {
          font-size: 2.5rem;
          font-weight: bold;
          margin: 1rem 0;
          color: #2c3e50;
        }
        .performance-dashboard {
  background: #f8f9fa;
  border-radius: 15px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.metrics {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin: 1rem 0;
}

.metric {
  text-align: center;
  padding: 1rem;
  background: white;
  border-radius: 10px;
}

.metric .value {
  font-size: 1.5rem;
  font-weight: bold;
  color: #2ecc71;
}

.metric .label {
  display: block;
  color: #7f8c8d;
}

.motivation-message {
  padding: 1rem;
  background: #3498db;
  color: white;
  border-radius: 8px;
  text-align: center;
}
        .timer-control {
          background: #007bff;
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 5px;
          cursor: pointer;
        }
          .analytics-section {
  margin: 2rem 0;
  text-align: center;
}

.analytics-button {
  background: #2196F3;
  color: white;
  padding: 1rem 2rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  transition: transform 0.2s;
}

.analytics-button:hover {
  transform: scale(1.05);
}

.analytics-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
}

.analytics-content {
  background: white;
  padding: 2rem;
  border-radius: 15px;
  max-width: 800px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
}

.close-analytics {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
}

.chart-container {
  margin: 2rem 0;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 10px;
}

.chart-container h3 {
  margin-bottom: 1rem;
  color: #2c3e50;
}

        .session-card.completed {
          background: #e8f5e9;
          opacity: 0.8;
        }

        .todo-section {
          margin: 1rem 0;
          border-top: 1px solid #eee;
          padding-top: 1rem;
        }

        .todo-input input {
          width: 100%;
          padding: 0.5rem;
          margin-bottom: 0.5rem;
          border: 1px solid #ddd;
          border-radius: 4px;
        }

        .todo-list {
          max-height: 150px;
          overflow-y: auto;
        }

        .todo-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.5rem;
          background: white;
          margin: 0.25rem 0;
          border-radius: 4px;
        }
        toast-notification {
  background: #ffffff;
  color: #2c3e50;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  padding: 1rem;
  margin: 0.5rem;
  min-width: 250px;
}
  .quiz-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 2000;
    }

    .quiz-container {
      background: white;
      padding: 2rem;
      border-radius: 15px;
      max-width: 600px;
      width: 90%;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }

    .quiz-progress {
      text-align: right;
      color: #7f8c8d;
      margin-bottom: 1rem;
    }

    .quiz-question h4 {
      margin-bottom: 1.5rem;
      font-size: 1.2rem;
    }

    .quiz-options {
      display: grid;
      gap: 1rem;
    }

    .quiz-option {
      padding: 1rem;
      border: 2px solid #dfe6e9;
      border-radius: 8px;
      cursor: pointer;
      background: white;
      transition: all 0.2s ease;
    }

    .quiz-option.selected {
      border-color: #3498db;
      background: #f0f8ff;
    }

    .quiz-next-button {
      margin-top: 2rem;
      width: 100%;
      padding: 1rem;
      background: #27ae60;
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
    }

    .quiz-results-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 2000;
    }

    .quiz-results {
      background: white;
      padding: 2rem;
      border-radius: 15px;
      text-align: center;
      max-width: 500px;
      width: 90%;
    }

    .quiz-score {
      font-size: 1.2rem;
      margin: 1rem 0;
      padding: 1rem;
      background: #f8f9fa;
      border-radius: 8px;
    }

    .quiz-motivation {
      font-size: 1.1rem;
      margin: 1.5rem 0;
    }

    .quiz-continue-button {
      background: #3498db;
      color: white;
      padding: 1rem 2rem;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-size: 1rem;
    }

.react-toastify__toast-body {
  display: flex;
  align-items: center;
}

.react-toastify__toast-icon {
  font-size: 1.5rem;
  margin-right: 1rem;
}

        .todo-item span.completed {
          text-decoration: line-through;
          color: #95a5a6;
        }

        .remove-todo {
          background: none;
          border: none;
          color: #e74c3c;
          cursor: pointer;
          padding: 0 0.5rem;
        }

        .start-button {
          background: #27ae60;
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 5px;
          cursor: pointer;
          margin-top: 1rem;
          font-weight: bold;
        }
        .chat-container {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 1000;
}
.completion-prompt-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 2000;
    }

    .completion-prompt {
      background: white;
      padding: 2rem;
      border-radius: 10px;
      text-align: center;
      max-width: 400px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }

    .prompt-buttons {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      margin-top: 1.5rem;
    }

    .confirm-button {
      background: #27ae60;
      color: white;
      padding: 1rem;
      border: none;
      border-radius: 5px;
      cursor: pointer;
    }

    .extend-button {
      background: #f1c40f;
      color: black;
      padding: 1rem;
      border: none;
      border-radius: 5px;
      cursor: pointer;
    }

    .extension-counter {
      margin-top: 1rem;
      color: #7f8c8d;
      font-size: 0.9rem;
    }
.chat-toggle {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: #007bff;
  color: white;
  border: none;
  font-size: 24px;
  cursor: pointer;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  transition: transform 0.2s;
}

.chat-toggle:hover {
  transform: scale(1.1);
}

.chat-window {
  width: 350px;
  height: 500px;
  background: rgba(255,255,255,0.95);
  border-radius: 15px;
  box-shadow: 0 10px 20px rgba(0,0,0,0.2);
  display: flex;
  flex-direction: column;
  margin-bottom: 10px;
}

.chat-header {
  padding: 1rem;
  background: #007bff;
  color: white;
  border-radius: 15px 15px 0 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.close-chat {
  background: none;
  border: none;
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
}

.chat-messages {
  flex: 1;
  padding: 1rem;
  overflow-y: auto;
}

.message {
  margin: 0.5rem 0;
  padding: 0.8rem;
  border-radius: 15px;
  max-width: 80%;
}

.message.user {
  background: #e3f2fd;
  margin-left: auto;
}

.message.bot {
  background: #f5f5f5;
  margin-right: auto;
}

.chat-input {
  padding: 1rem;
  border-top: 1px solid #eee;
  display: flex;
  gap: 0.5rem;
}

.chat-input input {
  flex: 1;
  padding: 0.8rem;
  border: 1px solid #ddd;
  border-radius: 8px;
}

.chat-input button {
  padding: 0.8rem 1.2rem;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}
        .start-button.disabled {
          background: #bdc3c7;
          cursor: not-allowed;
        }

        .start-button:hover:not(.disabled) {
          background: #219a52;
        }

        /* Previous styles remain the same */
        `}
      </style>
    </div>
  );
};

export default Efficientplan;