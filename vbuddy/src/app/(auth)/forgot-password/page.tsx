import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";
import React from "react";

const ForgotPasswordPage = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <h1 className="text-2xl font-semibold mb-4">Forgot Your Password?</h1>
      <p className="mb-6 text-center text-sm text-gray-600 max-w-sm">
        No worries! Enter your email address below and we&apos;ll send you a
        link to reset your password.
      </p>
      <ForgotPasswordForm />
    </div>
  );
};

export default ForgotPasswordPage;
