import type { Metadata } from "next";
import {Lexend} from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import React from "react";
import Navbar from "@/components/Navbar";
import { Provider } from "@/components/Providers";
import { Toaster } from "@/components/ui/sonner";

const lexend = Lexend({
  subsets: ["latin"],
});


export const metadata: Metadata = {
  title: "Learning Journal",

};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(lexend.className, 'antialiased min-h-screen pt-16')}
      >
        <Provider>
        <Navbar />
        {children}
        <Toaster/>
        </Provider>
        
      </body>
    </html>
  );
}
