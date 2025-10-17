import { createContext } from "react";

const UserContext = createContext({
  user: null,
  isLoggedIn: false,
  role: null,
  serverErrors: null,
  handleRegister: () => {},
  handleLogin: () => {},
  handleLogout: () => {},
  handlePlayerLogin: () => {},
});

export default UserContext;