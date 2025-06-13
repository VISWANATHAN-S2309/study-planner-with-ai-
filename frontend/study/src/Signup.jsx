import React from 'react'
import {useState} from 'react'
import { useNavigate, } from 'react-router-dom';
import axios from "axios";
export const Signup = () => {
  const [user,setuser]=useState({name:"",email:"",password:""});
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const handleChange=(e)=>{
    setuser({...user,[e.target.name]:e.target.value});
  };
  const handleSubmit=async(e)=>{
    e.preventDefault();
    try{
      await axios.post("http://localhost:5000/signup", user);
      alert("Signup successful!");
      navigate("/login");
    }
    catch(err){
      console.error("signup failed",err);
      alert("Signup failed Try again");
    }
  }
  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };
  return (
    <>
    <div className="container1">
      <div className="imgcontainer">
        <img src="images/image1.jpeg"className="im1"/>
          <p className="header1">Join the Future of Smart Studying!</p>
          <p className="subheader1">Create your account and unlock AI-powered study plans tailored just for you.</p>
      </div>
      <div className="signupcontainer">
        <form onSubmit={handleSubmit}>
        <p className="brand1">FocusSphere</p>
        <p className="signuphead">Signup</p>
        <p className="hello">Hello Student enter your details</p>
        <input type="text" placeholder="Enter your name"className="user"name="name"onChange={handleChange} required/><br/>
        <input type="email"placeholder="enter email"className="useremail"name="email"onChange={handleChange} required/><br/>
        <input type={showPassword?"text":"password"}placeholder="Password"className="userpass"name="password"onChange={handleChange} required/><br/>
        <span
          onClick={toggleShowPassword}
          style={{
            position: 'absolute',
            right: '110px',
            fontSize:"16px",
            top: '47%',
            transform: 'translateY(-50%)',
            cursor: 'pointer'
          }}
        >
          {showPassword ? "Hide" : "Show"}
        </span>
        <input type="checkbox"className="checker"/><label className="remember">Remember me</label>
        <button className="signupbtn"type="submit">Signup</button><br/>
        <hr className="hr1"/> <p className="or">or</p><hr className="hr2"/><br/>
        <button className="signupgoogle">Sign up with Google</button>
        <p className="loginlink">Already have an account?
          <a href="/login"className="linker">Login</a>
          </p></form>
      </div>
    </div>
    </>
  )
}
export default Signup;

// import Spline from '@splinetool/react-spline/next';

// export default function Home() {
//   return (
//     <main>
//       <Spline
//         scene="https://prod.spline.design/qiZDO396VRy1wGtD/scene.splinecode" 
//       />
//     </main>
//   );
// }