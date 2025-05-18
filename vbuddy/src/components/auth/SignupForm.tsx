"use client";

import React, { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const SignupForm = () => {
  const supabase = createSupabaseBrowserClient();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [userType, setUserType] = useState<"employer" | "va">("va"); // Default to VA
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          user_type: userType, // Store user type in metadata
          // We can add more metadata here as needed, e.g., full_name for VAs if collected at signup
        },
      },
    });

    setLoading(false);

    if (signUpError) {
      setError(signUpError.message);
    } else if (data.user) {
      // Supabase sends a confirmation email by default if email confirmation is enabled in your project settings.
      // If user is null but session is not, it might mean email confirmation is pending.
      if (data.session) {
        setSuccessMessage(
          "Signup successful! Please check your email to confirm your account. You will be redirected shortly..."
        );
        // Redirect to a page indicating to check email, or to login after a delay
        setTimeout(() => {
          router.push("/login"); // Or a specific "check your email" page
        }, 3000);
      } else {
        setSuccessMessage(
          "Signup successful! You can now log in. Redirecting..."
        );
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      }
      // Clear form or redirect as needed
      setEmail("");
      setPassword("");
      setConfirmPassword("");
    } else {
      setError("An unexpected error occurred during signup. Please try again.");
    }
  };

  return (
    <form onSubmit={handleSignup} className="space-y-4 w-full max-w-sm">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Sign up as:
        </label>
        <div className="mt-1 flex rounded-md shadow-sm">
          <button
            type="button"
            onClick={() => setUserType("va")}
            className={`px-4 py-2 border border-gray-300 rounded-l-md text-sm font-medium 
                        ${
                          userType === "va"
                            ? "bg-indigo-600 text-white"
                            : "bg-white text-gray-700 hover:bg-gray-50"
                        }
                        focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500`}
          >
            Virtual Assistant
          </button>
          <button
            type="button"
            onClick={() => setUserType("employer")}
            className={`px-4 py-2 border-t border-b border-r border-gray-300 rounded-r-md text-sm font-medium 
                        ${
                          userType === "employer"
                            ? "bg-indigo-600 text-white"
                            : "bg-white text-gray-700 hover:bg-gray-50"
                        }
                        focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500`}
          >
            Employer
          </button>
        </div>
      </div>

      <div>
        <label
          htmlFor="email-signup"
          className="block text-sm font-medium text-gray-700"
        >
          Email address
        </label>
        <input
          id="email-signup"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
      </div>

      <div>
        <label
          htmlFor="password-signup"
          className="block text-sm font-medium text-gray-700"
        >
          Password
        </label>
        <input
          id="password-signup"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
      </div>

      <div>
        <label
          htmlFor="confirm-password-signup"
          className="block text-sm font-medium text-gray-700"
        >
          Confirm Password
        </label>
        <input
          id="confirm-password-signup"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          minLength={6}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
      </div>

      {error && <p className="text-sm text-red-600 text-center">{error}</p>}
      {successMessage && (
        <p className="text-sm text-green-600 text-center">{successMessage}</p>
      )}

      <div>
        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {loading ? "Signing up..." : "Sign Up"}
        </button>
      </div>
    </form>
  );
};

export default SignupForm;
