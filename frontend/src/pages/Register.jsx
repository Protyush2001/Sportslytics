// import { useFormik } from "formik";
// import { useContext, useState } from "react";
// import { Link } from "react-router-dom";
// import UserContext from "../context/UserContext";
// import PaymentForm from "../components/PaymentForm";
// import { Elements } from "@stripe/react-stripe-js";
// import { loadStripe } from "@stripe/stripe-js";

// const stripePromise = loadStripe(
//   "pk_test_51S4mqxCTAL2OsiupdEnFuDrML5hlecmBRSYj6urlyGvL8P2YRc9wEkRsvXZWqTuJEfGoVdZzuYhy12F9FNIo2U0D00KQZDdWRv"
// );

// const Register = () => {
//   const { handleRegister, serverErrors } = useContext(UserContext);
//   const [paymentComplete, setPaymentComplete] = useState(false);

//   const formik = useFormik({
//     initialValues: {
//       username: "",
//       email: "",
//       password: "",
//       role: "",
//     },

//     onSubmit: (values) => {
//       const requiresPayment = ["admin", "team_owner"].includes(values.role);
//       if (requiresPayment && !paymentComplete) {
//         alert("Please complete payment before registering.");
//         return;
//       }
//       handleRegister(values, formik.resetForm);
//     },
//   });

//   return (
//     <div className="flex items-center justify-center min-h-screen bg-gray-100">
//       <form
//         onSubmit={formik.handleSubmit}
//         className="bg-white shadow-lg rounded-2xl p-8 w-full max-w-md"
//       >
//         <h2 className="text-2xl font-bold mb-6 text-center text-blue-600">
//           Register
//         </h2>

//         <div className="mb-4">
//           <label
//             htmlFor="username"
//             className="block text-sm font-medium text-gray-700 mb-1"
//           >
//             Username
//           </label>
//           <input
//             id="username"
//             name="username"
//             type="text"
//             onChange={formik.handleChange}
//             value={formik.values.username}
//             className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//             required
//           />
//         </div>

//         <div className="mb-4">
//           <label
//             htmlFor="email"
//             className="block text-sm font-medium text-gray-700 mb-1"
//           >
//             Email
//           </label>
//           <input
//             id="email"
//             name="email"
//             type="email"
//             onChange={formik.handleChange}
//             value={formik.values.email}
//             className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//             required
//           />
//         </div>

//         <div className="mb-4">
//           <label
//             htmlFor="password"
//             className="block text-sm font-medium text-gray-700 mb-1"
//           >
//             Password
//           </label>
//           <input
//             id="password"
//             name="password"
//             type="password"
//             onChange={formik.handleChange}
//             value={formik.values.password}
//             className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//             required
//           />
//         </div>

//         <div className="mb-6">
//           <label
//             htmlFor="role"
//             className="block text-sm font-medium text-gray-700 mb-1"
//           >
//             Role
//           </label>
//           <select
//             id="role"
//             name="role"
//             onChange={formik.handleChange}
//             value={formik.values.role}
//             className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//             required
//           >
//             <option value="">Select a role</option>
//             <option value="admin">Admin</option>
//             <option value="player">Player</option>
//             <option value="team_owner">Team Owner</option>
//             <option value="general_user">General User</option>
//           </select>
//         </div>

//         {["admin", "team_owner"].includes(formik.values.role) &&
//           !paymentComplete && (
//             <Elements stripe={stripePromise}>
//               <PaymentForm
//                 role={formik.values.role}
//                 onPaymentSuccess={() => setPaymentComplete(true)}
//               />
//             </Elements>
//           )}

//         <button
//           type="submit"
//           className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition"
//         >
//           Register
//         </button>

//         {serverErrors && (
//           <p className="mt-4 text-center text-sm text-red-600">
//             {serverErrors}
//           </p>
//         )}

//         <div className="mt-6 text-center">
//           <h4 className="text-sm text-gray-700">
//             Already have an account?{" "}
//             <Link to="/login" className="text-blue-600 hover:underline">
//               Login Here
//             </Link>
//           </h4>
//         </div>
//       </form>
//     </div>
//   );
// };

// export default Register;


import { useFormik } from "formik";
import { useContext, useState } from "react";
import { Link } from "react-router-dom";
import UserContext from "../context/UserContext";
import PaymentForm from "../components/PaymentForm";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

const stripePromise = loadStripe("pk_test_51S4mqxCTAL2OsiupdEnFuDrML5hlecmBRSYj6urlyGvL8P2YRc9wEkRsvXZWqTuJEfGoVdZzuYhy12F9FNIo2U0D00KQZDdWRv");

const Register = () => {
  const { handleRegister, serverErrors } = useContext(UserContext);
  const [showPayment, setShowPayment] = useState(false);

  const formik = useFormik({
    initialValues: {
      username: "",
      email: "",
      password: "",
      role: "",
    },
    onSubmit: async (values) => {
      const requiresPayment = ["admin", "team_owner"].includes(values.role);
      
      if (requiresPayment && !showPayment) {
        setShowPayment(true);
        return;
      }
      
      // Proceed with registration
      handleRegister(values, () => {
        formik.resetForm();
        setShowPayment(false);
      });
    },
  });

  const handlePaymentSuccess = () => {
    // After payment success, submit the form automatically
    formik.handleSubmit();
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <form
        onSubmit={formik.handleSubmit}
        className="bg-white shadow-lg rounded-2xl p-8 w-full max-w-md"
      >
        <h2 className="text-2xl font-bold mb-6 text-center text-blue-600">
          Register
        </h2>

        {/* Form fields remain the same */}
        <div className="mb-4">
          <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
            Username
          </label>
          <input
            id="username"
            name="username"
            type="text"
            onChange={formik.handleChange}
            value={formik.values.username}
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

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

        <div className="mb-4">
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

        <div className="mb-6">
          <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
            Role
          </label>
          <select
            id="role"
            name="role"
            onChange={formik.handleChange}
            value={formik.values.role}
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Select a role</option>
            <option value="admin">Admin</option>
            <option value="player">Player</option>
            <option value="team_owner">Team Owner</option>
            <option value="general_user">General User</option>
          </select>
        </div>

        {!showPayment ? (
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition"
          >
            {["admin", "team_owner"].includes(formik.values.role) 
              ? "Proceed to Payment" 
              : "Register"}
          </button>
        ) : (
          <Elements stripe={stripePromise}>
            <PaymentForm
              role={formik.values.role}
              onPaymentSuccess={handlePaymentSuccess}
            />
          </Elements>
        )}

        {serverErrors && (
          <p className="mt-4 text-center text-sm text-red-600">
            {serverErrors}
          </p>
        )}

        <div className="mt-6 text-center">
          <h4 className="text-sm text-gray-700">
            Already have an account?{" "}
            <Link to="/login" className="text-blue-600 hover:underline">
              Login Here
            </Link>
          </h4>
        </div>
      </form>
    </div>
  );
};

export default Register;