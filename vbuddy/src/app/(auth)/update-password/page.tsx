import UpdatePasswordForm from "@/components/auth/UpdatePasswordForm";
import React from "react";

const UpdatePasswordPage = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <h1 className="text-2xl font-semibold mb-4">Update Your Password</h1>
      <p className="mb-6 text-center text-sm text-gray-600 max-w-sm">
        Please enter and confirm your new password below.
      </p>
      <UpdatePasswordForm />
    </div>
  );
};

export default UpdatePasswordPage;
