import React from "react";
import Link from "next/link";

const PublicNavbar = () => {
  return (
    <nav className="bg-gray-800 text-gray-300 py-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
        <div className="flex items-center">
          <Link href="/" className="text-white text-lg font-bold">
            VBuddy
          </Link>
        </div>
        <div className="flex items-center space-x-4">
          <Link href="/login" className="hover:text-white">
            Login
          </Link>
          <Link href="/signup" className="hover:text-white">
            Sign Up
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default PublicNavbar;
