import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ClientToasterWrapper } from "@/components/ui/client-toaster-wrapper";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "VBuddy",
  description: "Virtual Assistant Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <ClientToasterWrapper />
      </body>
    </html>
  );
}
