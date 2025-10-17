// import React from 'react'

// const Footer = () => {
//   return (
// <footer className="bg-gray-900 text-gray-300 py-6 mt-10">
//   <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between">
//     {/* Left Section */}
//     <p className="text-sm text-gray-400">
//       &copy; {new Date().getFullYear()} <span className="font-semibold text-white">Sports Analytics Hub</span>. All rights reserved.
//     </p>

//     {/* Right Section */}
//     <div className="flex space-x-6 mt-4 md:mt-0">
//       <a 
//         href="/about" 
//         className="text-gray-400 hover:text-white transition-colors duration-300"
//       >
//         About
//       </a>
//       <a 
//         href="/contact" 
//         className="text-gray-400 hover:text-white transition-colors duration-300"
//       >
//         Contact
//       </a>
//       <a 
//         href="/privacy" 
//         className="text-gray-400 hover:text-white transition-colors duration-300"
//       >
//         Privacy Policy
//       </a>
//     </div>
//   </div>
// </footer>


//   )
// }

// export default Footer

import React from "react";
import { FaFacebookF, FaTwitter, FaInstagram, FaLinkedinIn } from "react-icons/fa";

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-gray-300 py-10">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Logo & Description */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-3">Sports Analytics Hub</h2>
          <p className="text-gray-400 text-sm leading-6">
            Your go-to platform for real-time match updates, analytics, and insights into your favorite sports.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Quick Links</h3>
          <ul className="space-y-2 text-sm">
            <li>
              <a href="/about" className="hover:text-white transition-colors duration-300">About Us</a>
            </li>
            <li>
              <a href="/contact" className="hover:text-white transition-colors duration-300">Contact</a>
            </li>
            <li>
              <a href="/privacy" className="hover:text-white transition-colors duration-300">Privacy Policy</a>
            </li>
            <li>
              <a href="/terms" className="hover:text-white transition-colors duration-300">Terms & Conditions</a>
            </li>
          </ul>
        </div>

        {/* Social Media */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Follow Us</h3>
          <div className="flex space-x-4">
            <a href="#" className="bg-gray-800 p-3 rounded-full hover:bg-blue-600 transition duration-300">
              <FaFacebookF className="text-white text-lg" />
            </a>
            <a href="#" className="bg-gray-800 p-3 rounded-full hover:bg-blue-400 transition duration-300">
              <FaTwitter className="text-white text-lg" />
            </a>
            <a href="#" className="bg-gray-800 p-3 rounded-full hover:bg-pink-500 transition duration-300">
              <FaInstagram className="text-white text-lg" />
            </a>
            <a href="#" className="bg-gray-800 p-3 rounded-full hover:bg-blue-700 transition duration-300">
              <FaLinkedinIn className="text-white text-lg" />
            </a>
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="border-t border-gray-700 mt-8 pt-4 text-center text-sm text-gray-500">
        &copy; {new Date().getFullYear()} Sports Analytics Hub. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;


