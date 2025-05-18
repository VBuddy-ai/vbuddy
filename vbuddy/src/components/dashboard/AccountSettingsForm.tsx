"use client";

import React, { useState, useEffect } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

const AccountSettingsForm = () => {
  const supabase = createSupabaseBrowserClient();
  const [user, setUser] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const [currentPassword, setCurrentPassword] = useState(""); // For password update, if required by policy
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  const [passwordUpdateLoading, setPasswordUpdateLoading] = useState(false);
  const [passwordUpdateError, setPasswordUpdateError] = useState<string | null>(
    null
  );
  const [passwordUpdateSuccess, setPasswordUpdateSuccess] = useState<
    string | null
  >(null);

  // For email update (future consideration)
  // const [newEmail, setNewEmail] = useState('');
  // const [emailUpdateLoading, setEmailUpdateLoading] = useState(false);
  // const [emailUpdateError, setEmailUpdateError] = useState<string | null>(null);
  // const [emailUpdateSuccess, setEmailUpdateSuccess] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      setLoadingUser(true);
      const { data, error } = await supabase.auth.getUser();
      if (data.user) {
        setUser(data.user);
        // setNewEmail(data.user.email || ''); // Initialize for email update form
      }
      // Error handling for getUser can be added if necessary
      setLoadingUser(false);
    };
    fetchUser();
  }, [supabase]);

  const handlePasswordUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPasswordUpdateError(null);
    setPasswordUpdateSuccess(null);

    if (newPassword !== confirmNewPassword) {
      setPasswordUpdateError("New passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
      setPasswordUpdateError(
        "New password must be at least 6 characters long."
      );
      return;
    }
    // Optional: Check if currentPassword is required and matches, if your policy needs it.
    // Supabase's updateUser doesn't require current password by default for security reasons
    // (assumes user is already authenticated to reach this form).

    setPasswordUpdateLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setPasswordUpdateLoading(false);

    if (error) {
      setPasswordUpdateError(error.message);
    } else {
      setPasswordUpdateSuccess("Password updated successfully!");
      setNewPassword("");
      setConfirmNewPassword("");
      setCurrentPassword(""); // Clear current password field too
      // Optionally, provide feedback to log out and log back in if policies require it.
    }
  };

  // const handleEmailUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
  //   e.preventDefault();
  //   // TODO: Implement email update logic (UAC-004)
  //   // This will involve calling supabase.auth.updateUser({ email: newEmail })
  //   // And handling Supabase's email change confirmation flow.
  //   // For V1, we might make email read-only or defer this feature.
  //   alert('Email update functionality to be implemented.');
  // };

  if (loadingUser) {
    return (
      <p className="text-center text-gray-600">Loading account details...</p>
    );
  }

  if (!user) {
    return (
      <p className="text-center text-red-500">
        Could not load user details. Please try again or re-login.
      </p>
    );
  }

  return (
    <div className="space-y-8 divide-y divide-gray-200">
      {/* Email Section - Read-only for now */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Email Address</h2>
        <p className="mt-1 text-sm text-gray-600">
          Your current email address. Changing your primary email requires
          verification and is handled by Supabase.
        </p>
        <div className="mt-4">
          <input
            type="email"
            readOnly
            value={user.email || ""}
            className="block w-full max-w-md rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-gray-100 cursor-not-allowed"
          />
        </div>
      </div>

      {/* Update Password Section */}
      <div className="pt-8">
        <h2 className="text-xl font-semibold text-gray-900">Update Password</h2>
        <p className="mt-1 text-sm text-gray-600">
          Ensure your account is using a long, random password to stay secure.
        </p>
        <form
          onSubmit={handlePasswordUpdate}
          className="mt-6 space-y-6 max-w-md"
        >
          {/* Current Password (Optional, not used by Supabase by default) */}
          {/* 
          <div>
            <label htmlFor="current-password" className="block text-sm font-medium text-gray-700">
              Current Password
            </label>
            <input
              id="current-password"
              name="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div> 
          */}

          <div>
            <label
              htmlFor="new-password-settings"
              className="block text-sm font-medium text-gray-700"
            >
              New Password
            </label>
            <input
              id="new-password-settings"
              name="newPassword"
              type="password"
              required
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>

          <div>
            <label
              htmlFor="confirm-new-password-settings"
              className="block text-sm font-medium text-gray-700"
            >
              Confirm New Password
            </label>
            <input
              id="confirm-new-password-settings"
              name="confirmNewPassword"
              type="password"
              required
              minLength={6}
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>

          {passwordUpdateError && (
            <p className="text-sm text-red-600">{passwordUpdateError}</p>
          )}
          {passwordUpdateSuccess && (
            <p className="text-sm text-green-600">{passwordUpdateSuccess}</p>
          )}

          <div>
            <button
              type="submit"
              disabled={passwordUpdateLoading}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {passwordUpdateLoading
                ? "Updating Password..."
                : "Update Password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AccountSettingsForm;
