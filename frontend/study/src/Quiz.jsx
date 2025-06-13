import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const questions = [
  {
    question: "What is your study goal?",
    options: ["Normal Study", "Government Exam Preparation", "School/College Exam Preparation"],
  },
  {
    question: "How many hours can you study daily?",
    options: ["1-2 hours", "3-5 hours", "6+ hours"],
  },
  {
    question: "How do you prefer studying?",
    options: ["Sequential Order", "Random Order", "AI-Optimized Order"],
  },
  {
    question: "Would you like scheduled breaks?",
    options: ["Yes", "No"],
  },
  {
    question: "Do you want AI to dynamically adjust your study plan?",
    options: ["Yes, make it smart!", "No, keep it fixed."],
  },
];

const Quiz = () => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const navigate = useNavigate();

  const handleAnswer = (answer) => {
    const newAnswers = [...answers, answer];
    setAnswers(newAnswers);
    
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setQuizCompleted(true);
      submitQuiz(newAnswers);
    }
  };

  const handleGetReady = () => {
    if (answers[0] === "Normal Study") {
      navigate("/syllabus");
    } else if (answers[0] === "Government Exam Preparation") {
      navigate("/syllabus");
    } else if (answers[0] === "School/College Exam Preparation") {
      navigate("/syllabus");
    }
  };

  return (
    <div className="quiz-container">
      <div className="quiz-box">
        {!quizCompleted ? (
          <>
            <h2>{questions[currentQuestion].question}</h2>
            <div className="options">
              {questions[currentQuestion].options.map((option, index) => (
                <button key={index} className="quiz-button" onClick={() => handleAnswer(option)}>
                  {option}
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="completion-box">
            <h2>🎉 Quiz Completed! 🎉</h2>
            <p>Your study plan is ready.</p>
            <button className="get-ready-button" onClick={handleGetReady}>
              Get Ready 🚀
            </button>
          </div>
        )}
      </div>

      <style>
        {`
          /* Fullscreen Centered Layout */
          .quiz-container {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            background: linear-gradient(to right, #6a11cb, #2575fc);
          }

          /* Quiz Box */
          .quiz-box {
            background: white;
            padding: 2rem;
            border-radius: 12px;
            box-shadow: 0px 4px 15px rgba(0, 0, 0, 0.2);
            text-align: center;
            width: 350px;
            transition: transform 0.3s ease;
          }

          .quiz-box:hover {
            transform: scale(1.02);
          }

          /* Question Title */
          .quiz-box h2 {
            font-size: 1.5rem;
            margin-bottom: 1rem;
            color: #333;
          }

          /* Options Button */
          .quiz-button {
            display: block;
            width: 100%;
            background-color: #007bff;
            color: white;
            padding: 0.8rem;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            margin-bottom: 10px;
            font-size: 1rem;
            transition: all 0.3s ease;
          }

          .quiz-button:hover {
            background-color: #0056b3;
          }

          /* Completion Box */
          .completion-box {
            text-align: center;
          }

          .completion-box h2 {
            font-size: 1.8rem;
            color: #333;
          }

          .completion-box p {
            font-size: 1.2rem;
            margin-bottom: 1.5rem;
            color: #666;
          }

          /* Get Ready Button */
          .get-ready-button {
            background: #28a745;
            color: white;
            font-size: 1.2rem;
            padding: 0.8rem 1.5rem;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            transition: background 0.3s ease;
          }

          .get-ready-button:hover {
            background: #218838;
          }
        `}
      </style>
    </div>
  );
};

export default Quiz;