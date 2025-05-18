import React from "react";

const Footer = () => {
  return (
    <footer className="bg-gray-800 text-gray-300 py-4 mt-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <p>&copy; {new Date().getFullYear()} VBuddy. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
