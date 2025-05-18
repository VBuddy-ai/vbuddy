"use client";

import React, { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import Link from "next/link";

const ForgotPasswordForm = () => {
  const supabase = createSupabaseBrowserClient();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    // Construct the redirectTo URL. Ensure this base URL matches your Site URL in Supabase.
    // And that the full path is in your Supabase Redirect URLs.
    const redirectTo = `${window.location.origin}/update-password`;

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email,
      {
        redirectTo,
      }
    );

    setLoading(false);

    if (resetError) {
      setError(resetError.message);
    } else {
      setSuccessMessage(
        "If an account exists for this email, a password reset link has been sent. Please check your inbox (and spam folder)."
      );
      setEmail(""); // Clear the email field
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-sm">
      <div>
        <label
          htmlFor="email-forgot-password"
          className="block text-sm font-medium text-gray-700"
        >
          Email address
        </label>
        <input
          id="email-forgot-password"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          disabled={!!successMessage} // Disable if success message is shown
        />
      </div>

      {error && <p className="text-sm text-red-600 text-center">{error}</p>}
      {successMessage && (
        <p className="text-sm text-green-600 text-center">{successMessage}</p>
      )}

      <div>
        <button
          type="submit"
          disabled={loading || !!successMessage}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {loading ? "Sending..." : "Send Password Reset Email"}
        </button>
      </div>
      <div className="text-sm text-center">
        <Link
          href="/login"
          className="font-medium text-indigo-600 hover:text-indigo-500"
        >
          Back to Login
        </Link>
      </div>
    </form>
  );
};

export default ForgotPasswordForm;
