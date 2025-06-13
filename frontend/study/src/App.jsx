import { useEffect, useState } from 'react'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import './App.css';
import Signup from './Signup';
import Landingpage from './Landingpage';
import Login  from './Login';
import Mainhub from './Mainhub';
import Profile from './Profile';
import Efficientplan from './Efficientplan';
import StudyPlanForm from './StudyPlanForm';
import UploadSyllabus from './UploadSyllabus';
import { GlobalStateProvider } from './GlobalStateContext';
import Quiz from './Quiz';
function App() {
  return (
    <GlobalStateProvider>
    <Router>
      <Routes>
        <Route path="/" element={<Landingpage />} />
        <Route path="/signup" element={<Signup/>} />
        <Route path="/login" element={<Login/>}/>
        <Route path="/quiz" element={<Quiz/>}/>
        <Route path="/mainhub"element={<Mainhub/>}/>
        <Route path="/study-plan" element={<StudyPlanForm/>} />
        <Route path="/analytics"element={<Mainhub/>}/>
        <Route path="/gamification"element={<Mainhub/>}/>
        <Route path="/profile"element={<Profile/>}/>
        <Route path="/efficientplan" element={<Efficientplan />} />
        <Route path="/syllabus"element={<UploadSyllabus/>}/>

      </Routes>
    </Router>
    </GlobalStateProvider>
  )
}

export default App;