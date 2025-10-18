import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ChatBotLauncher from "./components/ChatBotLauncher";
import ProtectedRoute from "./components/ProtectedRoute";
import AuthProvider from "./context/AuthProvider";

// Pages
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Matches from "./pages/Matches";
import Players from "./pages/Players";
import Teams from "./pages/Teams";
import Analytics from "./pages/Analytics";
import PlayerLogin from "./pages/PlayerLogin"
import AdminDashboard from "./pages/AdminDashboard";
// import Profile from "./pages/Profile";
import PointsTable from "./pages/PointsTable";

function App() {
  return (
    <Router>
      <AuthProvider>
        <>
          <Navbar />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/player-login" element={<PlayerLogin />} />


              {/* Protected Routes */}
              <Route
                path="/matches"
                element={
                  <ProtectedRoute>
                    <Matches />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/players"
                element={
                  <ProtectedRoute allowedRoles={["admin", "player", "team_owner"]}>
                    <Players />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/teams"
                element={
                  <ProtectedRoute allowedRoles={["admin", "team_owner"]}>
                    <Teams />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/analytics"
                element={
                  <ProtectedRoute allowedRoles={["admin", "player", "team_owner"]}>
                    <Analytics />
                  </ProtectedRoute>
                }
              />

              
              <Route path="/admin" element={<ProtectedRoute allowedRoles={["admin"]}><AdminDashboard /></ProtectedRoute>} />
              {/* <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} /> */}
              <Route path="/points-table" element={<ProtectedRoute><PointsTable /></ProtectedRoute>} />
            </Routes>
          </div>
          <Footer />
        </>
      </AuthProvider>
      <ChatBotLauncher />
    </Router>
  );
}

export default App;
