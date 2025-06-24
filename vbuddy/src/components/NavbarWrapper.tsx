"use client";

import { usePathname } from "next/navigation";
import Navbar from "./Navbar";

export default function NavbarWrapper() {
  const pathname = usePathname();

  // Determine user type based on the URL path
  const userType = pathname.includes("/dashboard/va") ? "va" : "employer";

  // You can add user data fetching here if needed
  const userName = "User"; // Replace with actual user name
  const userImage = undefined; // Replace with actual user image URL if available

  return (
    <Navbar userType={userType} userName={userName} userImage={userImage} />
  );
}
