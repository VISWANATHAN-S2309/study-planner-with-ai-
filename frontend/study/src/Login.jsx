import React from 'react'
import {useState} from 'react'
import { useNavigate } from "react-router-dom";
import axios from "axios";
export const Login = () => {
  const [user, setUser] = useState({ email: "", password: "" });
  const navigate = useNavigate();

  const handleChange = (e) => {
    setUser({ ...user, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:5000/login", user);
      if (res.data.success) {
        localStorage.setItem("userId", res.data.userId);
        console.log(localStorage.getItem("userId"));
        alert("Login Successful!");
        navigate("/mainhub"); // Redirect to mainhub page
      } else {
        alert("Invalid credentials");
      }
    } catch (err) {
      console.error("Login failed", err);
      alert("Login failed! Try again.");
    }
  };

  return (
    <>
     <div className="container2">
      <div className="imgcontainer1">
        <img src="images/image2.jpeg"className="im2"/>
          <p className="header2">Welcome Back, Achiever!</p>
          <p className="subheader2">Log in to continue your journey towards smarter and more productive studying..</p>
      </div>
      <div className="logincontainer">
      <form onSubmit={handleSubmit}>
        <p className="brand2">FocusSphere</p>
        <p className="loginhead">Login</p>
        <p className="welcome">Hello Achiever,</p>
        <input type="email" placeholder="Email"className="username"name="email"onChange={handleChange} required/><br/>
        <input type="password"placeholder="Password"className="userpassword"name="password"onChange={handleChange} required/><br/>
        <input type="checkbox"className="checker1"/><label className="remember1">Remember me</label>
        <a className="forgot">Forgot Password?</a><br/>
        <button className="loginbtn"type="submit">Login</button><br/>
        <hr className="hr11"/> <p className="or1">or</p><hr className="hr12"/><br/>
        <button className="logingoogle">Login with Google</button>
        <p className="signuplink">Don't have an account?
          <a href="/signup"className="linker1">Signup</a>
          </p></form>
      </div>
    </div>
    </>
  )
}
export default Login;