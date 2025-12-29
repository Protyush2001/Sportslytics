


import { Link, useNavigate } from "react-router-dom";
import { FaSignOutAlt, FaBars, FaTimes } from "react-icons/fa";
import { useState, useEffect, useRef, useContext } from "react";
import UserContext from "../context/UserContext";

const Navbar = () => {
  const navigate = useNavigate();
  const { user, isLoggedIn, handleLogout } = useContext(UserContext);

  const [showDropdown, setShowDropdown] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);

  const dropdownRef = useRef(null);
  const role = localStorage.getItem("role");

  const getInitials = (username) => {
    if (!username || typeof username !== "string") return "U";
    const parts = username.trim().split(/\s+/);
    return (parts[0][0] + (parts[1]?.[0] || "")).toUpperCase();
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

  const NavLinks = ({ mobile = false }) => (
    <>
      {["/", "/matches", "/players", "/teams", "/analytics"].map((path, i) => (
        <Link
          key={i}
          to={path}
          onClick={() => mobile && setMobileMenu(false)}
          className="block py-2 text-gray-700 hover:text-blue-600 transition"
        >
          {path === "/" ? "Home" : path.slice(1).charAt(0).toUpperCase() + path.slice(2)}
        </Link>
      ))}
    </>
  );

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50 w-full">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="text-2xl font-bold text-blue-700">
            Cricket Analytics 🏏
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex space-x-6 text-sm font-medium">
            <NavLinks />
          </div>

          {/* Desktop Auth */}
          <div className="hidden md:flex items-center space-x-4">
            {!isLoggedIn ? (
              <>
                <Link to="/login" className="px-3 py-1.5 bg-gray-100 rounded-md">
                  Login
                </Link>
                <Link to="/register" className="px-3 py-1.5 bg-blue-600 text-white rounded-md">
                  Signup
                </Link>
              </>
            ) : (
              <div className="flex items-center space-x-3 relative">
                <div
                  className="bg-blue-600 text-white w-9 h-9 rounded-full flex items-center justify-center cursor-pointer"
                  onClick={() => setShowDropdown(!showDropdown)}
                >
                  {getInitials(user?.username)}
                </div>

                {role === "admin" && showDropdown && (
                  <div
                    ref={dropdownRef}
                    className="absolute right-0 top-12 w-40 bg-white border rounded shadow"
                  >
                    <button
                      className="w-full px-4 py-2 text-left hover:bg-gray-100"
                      onClick={() => navigate("/admin")}
                    >
                      Dashboard
                    </button>
                    <button
                      className="w-full px-4 py-2 text-left hover:bg-gray-100"
                      onClick={() => navigate("/profile")}
                    >
                      Profile
                    </button>
                  </div>
                )}

                <button onClick={handleLogout} className="text-red-500 text-xl">
                  <FaSignOutAlt />
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-2xl"
            onClick={() => setMobileMenu(!mobileMenu)}
          >
            {mobileMenu ? <FaTimes /> : <FaBars />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenu && (
        <div className="md:hidden bg-white border-t px-4 pb-4">
          <NavLinks mobile />

          {!isLoggedIn ? (
            <div className="mt-4 space-y-2">
              <Link to="/login" className="block w-full text-center bg-gray-100 py-2 rounded">
                Login
              </Link>
              <Link to="/register" className="block w-full text-center bg-blue-600 text-white py-2 rounded">
                Signup
              </Link>
            </div>
          ) : (
            <div className="mt-4 flex justify-between items-center">
              <span className="font-medium">{user?.username}</span>
              <button onClick={handleLogout} className="text-red-500 text-xl">
                <FaSignOutAlt />
              </button>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
