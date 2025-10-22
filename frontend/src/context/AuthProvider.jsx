

import { useContext, useEffect, useReducer, useRef } from "react";
import UserContext from "./UserContext.js";
import axios from "../config/axios.js";
import { useNavigate } from "react-router-dom";

const userReducer = (state, action) => {
  switch (action.type) {
    case "LOGIN":
      return {
        ...state,
        user: action.payload.user,
        role: action.payload.role,
        isLoggedIn: true,
        serverErrors: null,
      };
    case "LOGOUT":
      return {
        ...state,
        user: null,
        role: null,
        isLoggedIn: false,
        serverErrors: null,
      };
    case "SET_SERVER_ERRORS":
      return {
        ...state,
        serverErrors: action.payload,
      };
    default:
      return state;
  }
};

export default function AuthProvider(props) {
  const navigate = useNavigate();
  const [state, dispatch] = useReducer(userReducer, {
    user: null,
    role: null,
    isLoggedIn: false,
    serverErrors: null,
  });



  const authHeader = () => ({
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  });

  //   if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
  //   inactivityTimer.current = setTimeout(() => {
  //     handleLogout("Session expired due to inactivity.");
  //   }, INACTIVITY_LIMIT);
  // };

  // useEffect(() => {
  //   const events = ["mousemove", "keydown", "click"];
  //   events.forEach((event) => window.addEventListener(event, resetInactivityTimer));
  //   resetInactivityTimer(); // Start timer on mount

  //   return () => {
  //     events.forEach((event) => window.removeEventListener(event, resetInactivityTimer));
  //     clearTimeout(inactivityTimer.current);
  //   };
  // }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user") || "null");
    const role = localStorage.getItem("role");

    if (token && user && role) {
      const tokenPayload = parseJwt(token);
      const now = Date.now() / 1000;

      if (tokenPayload?.exp && tokenPayload.exp < now) {
        handleLogout("Session expired. Please log in again.");
      } else {
        dispatch({ 
          type: "LOGIN", 
          payload: { 
            user: { ...user, role },
            role 
          } 
        });
      }
    }
  }, []);

  const parseJwt = (token) => {
    try {
      return JSON.parse(atob(token.split(".")[1]));
    } catch {
      return null;
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    dispatch({ type: "LOGOUT" });
    alert("Logout Successfully");
    navigate("/login", { replace: true });
  };

  const handleRegister = async (formData, resetForm) => {
    try {
      const response = await axios.post("/register", formData);
      alert("Successfully registered");
      resetForm();
      navigate("/login");
    } catch (err) {
      dispatch({
        type: "SET_SERVER_ERRORS",
        payload:
          err.response?.data?.error ||
          err.response?.data?.message ||
          "Registration failed",
      });
    }
  };

  const handleLogin = async (formData, resetForm) => {
    try {
      const response = await axios.post("/login", formData);
      const { token, user, role } = response.data;

      localStorage.setItem("token", token);
      localStorage.setItem("role", role);
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("userId", user._id); // Add this line

      dispatch({ 
        type: "LOGIN", 
        payload: { user, role } 
      });
      resetForm();
      alert("Successfully logged in");

      if (role === "admin") navigate("/admin");
      else if (role === "player") navigate("/players"); // Fixed navigation
      else if (role === "team_owner") navigate("/analytics");
      else navigate("/dashboard");
    } catch (err) {
      dispatch({
        type: "SET_SERVER_ERRORS",
        payload: err.response?.data?.error || "Login failed",
      });
    }
  };

  // FIXED: Player Login Function
  const handlePlayerLogin = async (formData, resetForm) => {
    try {
      console.log("Player login attempt:", formData);
      
      // Use absolute URL to avoid baseURL issues
      const response = await axios.post("/api/players/login", formData, {
        baseURL: "http://localhost:3018" 
      });
      
      console.log("Player login response:", response.data);
      
      const { token, player } = response.data;

      // Store all necessary data in localStorage
      localStorage.setItem("token", token);
      localStorage.setItem("role", "player");
      localStorage.setItem("user", JSON.stringify(player));
      localStorage.setItem("userId", player._id);
      localStorage.setItem("userName", player.name);

      dispatch({ 
        type: "LOGIN", 
        payload: { 
          user: player, 
          role: "player" 
        } 
      });
      
      if (resetForm) resetForm();
      alert("Player login successful");
      
      // Navigate to players page (make sure this route exists)
      navigate("/player-dashboard");
      
    } catch (err) {
      console.error("Player login error:", err);
      const errorMessage = err.response?.data?.error || 
                          err.response?.data?.message || 
                          "Player login failed. Please check your credentials.";
      
      dispatch({
        type: "SET_SERVER_ERRORS",
        payload: errorMessage,
      });
    }
  };

  return (
    <UserContext.Provider
      value={{
        ...state,
        handleRegister,
        handleLogin,
        handleLogout,
        handlePlayerLogin,
      }}
    >
      {props.children}
    </UserContext.Provider>
  );
}