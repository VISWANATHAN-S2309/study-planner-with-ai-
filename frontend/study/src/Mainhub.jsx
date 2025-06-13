import { Link } from 'react-router-dom';
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { HiMenu } from "react-icons/hi";
import { FaBrain, FaChartLine, FaBookOpen,FaTimes,FaTrophy,FaHome,FaRobot,FaUser } from "react-icons/fa";
export const Mainhub = () => {
    const [isopen,setopen]=useState(false);
    const [isopenai,setopenai]=useState(false);
    const features = [
      { 
        id: 1, 
        icon: <FaBrain />, 
        title: "AI Study Planner", 
        description: "Get a customized study plan based on your schedule and learning pace.", 
        path: "/study-plan" 
      },
      { 
        id: 2, 
        icon: <FaChartLine />, 
        title: "Learning Analytics", 
        description: "Track your study performance and get AI-powered recommendations.", 
        path: "/analytics" 
      },
      { 
        id: 3, 
        icon: <FaTrophy />, 
        title: "Gamification", 
        description: "Earn points, set challenges, and stay motivated while studying.", 
        path: "/gamification" 
      },
      { 
        id: 4, 
        icon: <FaRobot />, 
        title: "AI Study Assistant", 
        description: "Get real-time answers and study tips with AI-powered assistance.", 
        path: "/ai-assistant" 
      }
    ];
    const [messages, setMessages] = useState([
        { text: "Hello! Ask me anything about your studies.", sender: "bot" }
      ]);
      const [input, setInput] = useState("");
      const chatEndRef = useRef(null);
    
      // Scroll to the latest message
      useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, [messages]);
    
      // Handle user input
      const sendMessage = async () => {
        if (!input.trim()) return;
    
        const userMessage = { text: input, sender: "user" };
        setMessages((prev) => [...prev, userMessage]);
        setInput("");
    
        // Fetch response from Flask backend
        try {
          const response = await fetch("http://127.0.0.1:5000/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ question: input })
          });
    
          const data = await response.json();
          setMessages((prev) => [...prev, { sender: "Bot", text: data.answer }]);
        } catch (error) {
          setMessages((prev) => [...prev, { sender: "Bot", text: "Error connecting to chatbot!" }]);
        }
      };
  return (
    <>
    
    <div className="container3 background-image">
      <div className="navbar">
        <ul className="nav">
        <li className="homenav">Home</li>
        <li className=""><Link className="pro"to="/quiz">Study Plan</Link></li>
        <li className=""><Link className="pro"to="/profile">Profile</Link></li>
        <li className="more"onClick={()=>setopen(true)}><HiMenu className="text-white text-3xl cursor-pointer" /></li>
        </ul>

      <p className="brandhome">FocusSphere</p>
      <div className={isopen?"open":"close"}>
      <ul className="nav-links">
        <li><Link className="a1"to="/"><FaHome /> Home</Link></li>
        <li><Link className="a1"to="/quiz"><FaBrain /> Study Plan</Link></li>
        <li><Link className="a1"to="/analytics"><FaChartLine /> Analytics</Link></li>
        <li><Link className="a1"to="/gamification"><FaTrophy /> Gamification</Link></li>
        <li className="more"onClick={()=>setopenai(true)}><FaRobot /> AI Assistant</li>
        <div className={isopenai?"openai":"closeai"}>
        <div style={styles.container}>
      <div style={styles.chatBox}>
        {messages.map((msg, index) => (
          <div
            key={index}
            style={msg.sender === "user" ? styles.userMessage : styles.botMessage}
          >
            {msg.text}
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>
      <div style={styles.inputContainer}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask me anything..."
          style={styles.input}
        />
        <button onClick={sendMessage} style={styles.button}>Send</button>
        <button className="closebtn1"onClick={()=>setopenai(false)}><FaTimes className="cross"/></button>
      </div>
    </div>
    </div>
        <li><Link className="a1"to="/profile"><FaUser /> Profile</Link></li>
        <li className="closebtn"onClick={()=>setopen(false)}><FaTimes/>close</li>
      </ul>
      </div>
      </div>
      <div className="header3">
        <p className="hubtitle1">AI-Powered Student Planner</p>
        <p className="hubtitle2">Plan smarter,study better,and achieve your goals with AI-generated insights</p>
        <button className="startnow">Start planning now</button>
      </div>
      <div className="feature-cards-container">
      {features.map((feature) => (
        <div key={feature.id} className="feature-card" onClick={() => navigate(feature.path)}>
          <div className="feature-icon">{feature.icon}</div>
          <h2 className="feature-title">{feature.title}</h2>
          <p className="feature-description">{feature.description}</p>
        </div>
      ))}
    </div>
    <style>
        {`
        .background-image {
          background-image: url('images/image3.jpg');
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
        }
        `}
      </style>
    </div>
    </>
  )
}
const styles = {
  container: {
    width: "400px",
    height:"1500px",
    margin: "20px auto",
    border: "1px solid #ccc",
    borderRadius: "10px",
    overflow: "hidden",
    fontFamily: "Arial, sans-serif",
    backgroundColor: "aliceblue"
  },
  chatBox: {
    height: "450px",
    padding: "10px",
    overflowY: "auto",
    display: "flex",
    flexDirection: "column"
  },
  userMessage: {
    alignSelf: "flex-end",
    background: "linear-gradient(135deg, #4a69bd 0%, #3c538f 100%)",
    color: "white",
    fontFamily:"Josefin Sans",
    fontSize:"18px",
    padding: "10px",
    borderRadius: "10px",
    maxWidth: "70%",
    margin: "5px 0"
  },
  botMessage: {
    alignSelf: "flex-start",
    backgroundColor: "white",
    color: "black",
    fontSize:"18px",
    padding: "10px",
    fontFamily:"Josefin Sans",
    borderRadius: "10px",
    maxWidth: "70%",
    margin: "5px 0"
  },
  inputContainer: {
    display: "flex",
    padding: "10px",
    borderTop: "1px solid #ccc"
  },
  input: {
    flex: 1,
    padding: "8px",
    border: "1px solid #ccc",
    borderRadius: "5px"
  },
  button: {
    marginLeft: "5px",
    padding: "8px 12px",
    border: "none",
    backgroundColor: "linear-gradient(135deg, #4a69bd 0%, #3c538f 100%)",
    color: "white",
    borderRadius: "5px",
    cursor: "pointer"
  }
};
export default Mainhub;