import { useFormik } from "formik";
import { useContext } from "react";
import { Link } from "react-router-dom";
import UserContext from "../context/UserContext";

const Login = () => {
  const { handleLogin, serverErrors } = useContext(UserContext);

  const formik = useFormik({
    initialValues: {
      email: '',
      password: ''
    },
    onSubmit: values => {
      handleLogin(values, formik.resetForm);
    }
  });

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 px-4">
      <form
        onSubmit={formik.handleSubmit}
        className="bg-white shadow-lg rounded-2xl p-8 w-full max-w-md"
      >
        <h2 className="text-2xl font-bold mb-6 text-center text-blue-600">
          Admin / Owner Login
        </h2>

        {serverErrors && (
          <p className="mb-4 text-center text-sm text-red-600">
            {serverErrors}
          </p>
        )}

        <div className="mb-4">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            onChange={formik.handleChange}
            value={formik.values.email}
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div className="mb-6">
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            onChange={formik.handleChange}
            value={formik.values.password}
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition"
        >
          Login
        </button>

        <div className="mt-4 text-center">
          <Link to="/register" className="text-sm text-blue-600 hover:underline">
            Don't have an account? Register
          </Link>
        </div>
      </form>

      <div className="mt-6 text-center">
        <h4 className="text-sm text-gray-700">
          Are you a Player?{" "}
          <Link to="/player-login" className="text-blue-600 hover:underline">
            Login Here
          </Link>
        </h4>
      </div>
    </div>
  );
};

export default Login;