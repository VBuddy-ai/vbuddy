"use client";

import React, { useState, useEffect } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

const UpdatePasswordForm = () => {
  const supabase = createSupabaseBrowserClient();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSessionReady, setIsSessionReady] = useState(false);

  useEffect(() => {
    // Supabase client initializes and handles the session from the URL hash fragment automatically.
    // We wait for the session to be potentially established.
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "PASSWORD_RECOVERY") {
          // This event confirms that Supabase has processed the recovery token.
          // The session object might be available here if the user was automatically signed in.
        }
        // Once a session is active or we determine there isn't one from a recovery link,
        // we can allow the form to be used.
        setIsSessionReady(true);
      }
    );

    // Check if there's an error in the hash fragment (e.g., invalid token)
    const hash = window.location.hash;
    if (hash.includes("error_description")) {
      const params = new URLSearchParams(hash.substring(1)); // remove #
      setError(params.get("error_description"));
      setIsSessionReady(true);
    }

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [supabase.auth]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);

    const { error: updateError } = await supabase.auth.updateUser({
      password: password,
    });

    setLoading(false);

    if (updateError) {
      setError(updateError.message);
    } else {
      setSuccessMessage(
        "Your password has been updated successfully! You will be redirected to login."
      );
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    }
  };

  if (!isSessionReady && !error) {
    return <p className="text-center text-gray-600">Loading...</p>; // Or a spinner component
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-sm">
      <div>
        <label
          htmlFor="new-password"
          className="block text-sm font-medium text-gray-700"
        >
          New Password
        </label>
        <input
          id="new-password"
          name="newPassword"
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          disabled={!!successMessage}
        />
      </div>

      <div>
        <label
          htmlFor="confirm-new-password"
          className="block text-sm font-medium text-gray-700"
        >
          Confirm New Password
        </label>
        <input
          id="confirm-new-password"
          name="confirmNewPassword"
          type="password"
          required
          minLength={6}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          disabled={!!successMessage}
        />
      </div>

      {error && <p className="text-sm text-red-600 text-center">{error}</p>}
      {successMessage && (
        <p className="text-sm text-green-600 text-center">{successMessage}</p>
      )}

      {!successMessage && (
        <div>
          <button
            type="submit"
            disabled={loading || !isSessionReady}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {loading ? "Updating Password..." : "Update Password"}
          </button>
        </div>
      )}
      {successMessage && (
        <div className="text-sm text-center mt-4">
          <Link
            href="/login"
            className="font-medium text-indigo-600 hover:text-indigo-500"
          >
            Proceed to Login
          </Link>
        </div>
      )}
    </form>
  );
};

export default UpdatePasswordForm;
