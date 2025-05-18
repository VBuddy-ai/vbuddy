"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

const DashboardPage = () => {
  const supabase = createSupabaseBrowserClient();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        router.push("/login"); // Should be handled by middleware, but as a fallback
        return;
      }
      setUser(data.user);
      setLoading(false);
    };
    getUser();
  }, [supabase, router]);

  useEffect(() => {
    if (user) {
      const userType = user.user_metadata?.user_type;
      if (userType === "va") {
        router.replace("/dashboard/va");
      } else if (userType === "employer") {
        router.replace("/dashboard/employer");
      } else {
        // Fallback or error: user type not set or unknown
        // For now, redirect to login or show an error. Could also go to a generic dashboard.
        console.error("Unknown or missing user type:", userType);
        // router.push('/login');
        // Or, let them stay on a generic /dashboard page if you create one without type specific content
      }
    }
  }, [user, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading dashboard...</p>
      </div>
    );
  }

  // This content will likely not be seen due to redirection, but acts as a fallback.
  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <h1 className="text-2xl font-semibold">Welcome to your Dashboard</h1>
      <p>Redirecting based on your role...</p>
      {user && (
        <p>User type: {user.user_metadata?.user_type || "Not specified"}</p>
      )}
      <button
        onClick={async () => {
          await supabase.auth.signOut();
          router.push("/login");
        }}
        className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
      >
        Sign Out
      </button>
    </div>
  );
};

export default DashboardPage;
