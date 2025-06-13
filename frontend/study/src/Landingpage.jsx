import React from 'react';
import Spline from '@splinetool/react-spline';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faPaperPlane} from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router-dom';

const LandingPage = () => {

  return (
    <>
    <div className="h-screen flex justify-center items-center bg-black">
      <Spline scene="https://prod.spline.design/jWFb4ImmhACo2qDS/scene.splinecode" />
      </div>
      <div className="container">
        <p className="brand">FocusSphere</p>
        <Link to="/login">
        <button className="login">Login</button>
        </Link>
        <div className="sidebar">
          {/* <button className="bar">
            <FontAwesomeIcon icon={faBars} />
          </button> */}
        </div>
        <p className="header">Achieve Academic Success with Smart Study Plans!</p>
        <p className="subheader">Personalized AI-driven study schedules, insights, and progress tracking.</p>
        <Link to="/signup">
        <button className="explore">Explore</button>
        </Link>
      </div>
    </>
  );
};

export default LandingPage;