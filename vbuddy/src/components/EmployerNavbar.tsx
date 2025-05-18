"use client";

import React from "react";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const EmployerNavbar = () => {
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
              href="/dashboard/employer"
              className="flex-shrink-0 font-bold text-xl text-indigo-600"
              prefetch={true}
            >
              Vbuddy.ai (Employer)
            </Link>
            <div className="ml-10 flex items-baseline space-x-4">
              <Link
                href="/dashboard/employer"
                className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium"
                prefetch={true}
              >
                Dashboard
              </Link>
              <Link
                href="/dashboard/employer/post-job"
                className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium"
                prefetch={true}
              >
                Post Job
              </Link>
              <Link
                href="/dashboard/employer/my-jobs"
                className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium"
                prefetch={true}
              >
                My Jobs
              </Link>
              <Link
                href="/dashboard/employer/hired-vas"
                className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium"
                prefetch={true}
              >
                Hired VAs
              </Link>
              <Link
                href="/dashboard/employer/company"
                className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium"
                prefetch={true}
              >
                Company Profile
              </Link>
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

export default EmployerNavbar;
