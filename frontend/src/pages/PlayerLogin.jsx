// import { useFormik } from "formik";
// import { useContext } from "react";
// import { Link } from "react-router-dom";
// import UserContext from "../context/UserContext";
// import DatePicker from "react-datepicker";
// import "react-datepicker/dist/react-datepicker.css";

// const PlayerLogin = () => {
//   const { handlePlayerLogin, serverErrors } = useContext(UserContext);

//   const formik = useFormik({
//     initialValues: {
//       email: '',
//       dob: null,
//     },
//     onSubmit: values => {
//       const payload = {
//         email: values.email,
//         dob: values.dob?.toISOString().split('T')[0], 
//       };
//       handlePlayerLogin(payload, formik.resetForm);
//     }
//   });

//   return (
//     <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 px-4">
//       <form
//         onSubmit={formik.handleSubmit}
//         className="bg-white shadow-lg rounded-2xl p-8 w-full max-w-md"
//       >
//         <h2 className="text-2xl font-bold mb-6 text-center text-blue-600">
//           Player Login
//         </h2>

//         {serverErrors && (
//           <p className="mb-4 text-center text-sm text-red-600">
//             {serverErrors}
//           </p>
//         )}

//         <div className="mb-4">
//           <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
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

//         <div className="mb-6">
//           <label htmlFor="dob" className="block text-sm font-medium text-gray-700 mb-1">
//             Date of Birth
//           </label>
//           <DatePicker
//             selected={formik.values.dob}
//             onChange={date => formik.setFieldValue('dob', date)}
//             dateFormat="yyyy-MM-dd"
//             placeholderText="Select your DOB"
//             maxDate={new Date()}
//             showYearDropdown
//             scrollableYearDropdown
//             yearDropdownItemNumber={100}
//             className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//             required
//           />
//         </div>

//         <button
//           type="submit"
//           className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition"
//         >
//           Login
//         </button>

//         {/* <div className="mt-4 text-center">
//           <Link to="/register-player" className="text-sm text-blue-600 hover:underline">
//             Don't have an account? Register
//           </Link>
//         </div> */}
//       </form>

//       <div className="mt-6 text-center">
//         <h4 className="text-sm text-gray-700">
//           Are you an Admin or Owner?{" "}
//           <Link to="/login" className="text-blue-600 hover:underline">
//             Login Here
//           </Link>
//         </h4>
//       </div>
//     </div>
//   );
// };

// export default PlayerLogin;

import { useFormik } from "formik";
import { useContext } from "react";
import { Link } from "react-router-dom";
import UserContext from "../context/UserContext";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const PlayerLogin = () => {
  const { handlePlayerLogin, serverErrors } = useContext(UserContext);

  const formik = useFormik({
    initialValues: {
      email: '',
      dob: null,
    },
    onSubmit: values => {
      
      let dobString;
      if (values.dob) {
        const year = values.dob.getFullYear();
        const month = String(values.dob.getMonth() + 1).padStart(2, '0');
        const day = String(values.dob.getDate()).padStart(2, '0');
        dobString = `${year}-${month}-${day}`;
      }
      
      const payload = {
        email: values.email.trim().toLowerCase(),
        dob: dobString, 
      };
      
      console.log("Submitting login:", payload);
      handlePlayerLogin(payload, formik.resetForm);
    }
  });

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 px-4">
      <form
        onSubmit={formik.handleSubmit}
        className="bg-white shadow-lg rounded-2xl p-8 w-full max-w-md"
      >
        <h2 className="text-2xl font-bold mb-6 text-center text-blue-600">
          Player Login
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
          <label htmlFor="dob" className="block text-sm font-medium text-gray-700 mb-1">
            Date of Birth
          </label>
          <DatePicker
            selected={formik.values.dob}
            onChange={date => formik.setFieldValue('dob', date)}
            dateFormat="yyyy-MM-dd"
            placeholderText="Select your DOB"
            maxDate={new Date()}
            showYearDropdown
            scrollableYearDropdown
            yearDropdownItemNumber={100}
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          {/* Show selected date for debugging */}
          {formik.values.dob && (
            <p className="text-xs text-gray-500 mt-1">
              Selected: {formik.values.dob.toDateString()} 
              (Will send: {formik.values.dob.getFullYear()}-{String(formik.values.dob.getMonth() + 1).padStart(2, '0')}-{String(formik.values.dob.getDate()).padStart(2, '0')})
            </p>
          )}
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition"
        >
          Login
        </button>
      </form>

      <div className="mt-6 text-center">
        <h4 className="text-sm text-gray-700">
          Are you an Admin or Owner?{" "}
          <Link to="/login" className="text-blue-600 hover:underline">
            Login Here
          </Link>
        </h4>
      </div>
    </div>
  );
};

export default PlayerLogin;