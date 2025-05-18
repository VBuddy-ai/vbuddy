"use client";

import React from "react";
import AccountSettingsForm from "@/components/dashboard/AccountSettingsForm";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const AccountSettingsPage = () => {
  const supabase = createSupabaseBrowserClient();
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navbar Placeholder - Consider creating a reusable Navbar component */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link
                href="/dashboard"
                className="flex-shrink-0 font-bold text-xl text-indigo-600"
              >
                Vbuddy.ai
              </Link>
            </div>
            <div className="flex items-center">
              <Link
                href="/dashboard"
                className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium"
              >
                Dashboard
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

      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">Account Settings</h1>
        </div>
      </header>
      <main>
        <div className="max-w-3xl mx-auto py-10 sm:px-6 lg:px-8">
          <AccountSettingsForm />
        </div>
      </main>
    </div>
  );
};

export default AccountSettingsPage;
