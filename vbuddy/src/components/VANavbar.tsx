"use client";

import React from "react";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const VANavbar = () => {
  const supabase = createSupabaseBrowserClient();
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link
              href="/dashboard/va"
              className="flex-shrink-0 font-bold text-xl text-indigo-600"
              prefetch={true}
            >
              Vbuddy.ai (VA)
            </Link>
            <div className="ml-10 flex items-baseline space-x-4">
              <Link
                href="/dashboard/va"
                className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium"
                prefetch={true}
              >
                Dashboard
              </Link>
              <Link
                href="/dashboard/va/profile"
                className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium"
                prefetch={true}
              >
                My Profile
              </Link>
              <Link
                href="/dashboard/va/jobs"
                className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium"
                prefetch={true}
              >
                Find Jobs
              </Link>
              <Link
                href="/dashboard/va/kyc"
                className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium"
                prefetch={true}
              >
                KYC Verification
              </Link>
              {/* Add more VA-specific links here */}
            </div>
          </div>
          <div className="flex items-center">
            <Link
              href="/dashboard/settings"
              className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium"
              prefetch={true}
            >
              Settings
            </Link>
            <button
              onClick={handleLogout}
              className="ml-4 px-3 py-2 rounded-md text-sm font-medium text-white bg-red-500 hover:bg-red-600"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default VANavbar;
