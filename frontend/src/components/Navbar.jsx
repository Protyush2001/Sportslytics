import { Link, useNavigate } from "react-router-dom";
import { FaSignOutAlt } from "react-icons/fa";
import { useState, useEffect, useRef, useContext } from "react";
import UserContext from "../context/UserContext";

const Navbar = () => {
  const navigate = useNavigate();
  const { user, isLoggedIn,handleLogout } = useContext(UserContext);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const role = localStorage.getItem("role"); 

  // const handleLogout = () => {
  //   localStorage.clear(); 
  //   navigate("/login");
  // };

  const getInitials = (username) => {
    if (!username || typeof username !== "string") return "U";
    const parts = username.trim().split(/\s+/);
    const first = parts[0]?.[0] || "";
    const last = parts[1]?.[0] || "";
    return (first + last).toUpperCase() || "U";
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50 w-full">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-0">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="text-2xl font-bold text-blue-700 tracking-tight">
            Cricket Analytics 🏏
          </Link>

          <div className="hidden md:flex space-x-6 text-sm font-medium text-gray-700">
            <Link to="/" className="hover:text-blue-600 transition">Home</Link>
            <Link to="/matches" className="hover:text-blue-600 transition">Matches</Link>
            <Link to="/players" className="hover:text-blue-600 transition">Players</Link>
            <Link to="/teams" className="hover:text-blue-600 transition">Teams</Link>
            <Link to="/analytics" className="hover:text-blue-600 transition">Analytics</Link>
          </div>

          <div className="flex items-center space-x-4">
            {!isLoggedIn ? (
              <>
                <Link to="/login" className="px-3 py-1.5 bg-gray-100 text-sm rounded-md hover:bg-gray-200 transition">
                  Login
                </Link>
                <Link to="/register" className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition">
                  Signup
                </Link>
              </>
            ) : (
              <div className="flex items-center space-x-4 relative">
                <div
                  className="bg-blue-600 text-white rounded-full w-9 h-9 flex items-center justify-center font-semibold text-sm hover:bg-blue-700 transition"
                  title={user?.username}
                  onClick={() => setShowDropdown((prev) => !prev)}
                >
                  {getInitials(user?.username)}
                </div>

                {role === "admin" && showDropdown && (
                  <div ref={dropdownRef} className="absolute right-0 mt-2 w-40 bg-white border rounded shadow-lg z-50">
                    <button
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm text-gray-700"
                      onClick={() => navigate("/admin")}
                    >
                      Dashboard
                    </button>
                    <button
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm text-gray-700"
                      onClick={() => navigate("/profile")}
                    >
                      Profile
                    </button>
                  </div>
                )}

                <button
                  onClick={handleLogout}
                  className="text-red-500 hover:text-red-700 text-xl transition"
                  title="Logout"
                >
                  <FaSignOutAlt />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;