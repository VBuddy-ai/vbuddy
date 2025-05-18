import LoginForm from "@/components/auth/LoginForm";
import React from "react";
import Link from "next/link";
import PublicNavbar from "@/components/PublicNavbar";
import Footer from "@/components/Footer";

const LoginPage = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <PublicNavbar />
      <main className="flex-grow flex flex-col items-center justify-center py-2">
        <h1 className="text-2xl font-semibold mb-4">Login to Vbuddy.ai</h1>
        <LoginForm />
        <p className="mt-4 text-sm text-gray-600">
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            className="font-medium text-indigo-600 hover:text-indigo-500"
          >
            Sign up
          </Link>
        </p>
      </main>
      <Footer />
    </div>
  );
};

export default LoginPage;
