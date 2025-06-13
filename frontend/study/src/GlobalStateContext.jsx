import React, { createContext, useContext, useReducer } from 'react';

const GlobalStateContext = createContext();

const initialState = {
  completedSessions: [],
  studyHours: 0,
  completedSyllabi: 0,
  badges: [],
  performanceMetrics: {
    completed: 0,
    pending: 0,
    timeSpent: 0,
    missed: 0
  }
};

const reducer = (state, action) => {
  switch (action.type) {
    case 'SESSION_COMPLETED':
      const newCompleted = [...state.completedSessions, action.sessionId];
      const studyHours = newCompleted.length * 45;
      
      return {
        ...state,
        completedSessions: newCompleted,
        studyHours,
        performanceMetrics: {
          ...state.performanceMetrics,
          completed: newCompleted.length,
          timeSpent: studyHours
        }
      };
      
    case 'SYLLABUS_COMPLETED':
      return {
        ...state,
        completedSyllabi: state.completedSyllabi + 1
      };
      
    case 'ADD_BADGE':
      return {
        ...state,
        badges: [...new Set([...state.badges, action.badge])]
      };
      
    default:
      return state;
  }
};

export const GlobalStateProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  
  return (
    <GlobalStateContext.Provider value={{ state, dispatch }}>
      {children}
    </GlobalStateContext.Provider>
  );
};

export const useGlobalState = () => useContext(GlobalStateContext);
