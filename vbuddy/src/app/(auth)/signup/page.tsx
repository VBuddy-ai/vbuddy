import SignupForm from "@/components/auth/SignupForm";
import React from "react";
import PublicNavbar from "@/components/PublicNavbar";
import Footer from "@/components/Footer";

const SignupPage = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <PublicNavbar />
      <main className="flex-grow flex flex-col items-center justify-center py-2">
        <h1 className="text-2xl font-semibold mb-4">Sign Up for Vbuddy.ai</h1>
        <SignupForm />
      </main>
      <Footer />
    </div>
  );
};

export default SignupPage;
