import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css";
import { NavBar } from "../components/Nav";
import { ReactNode } from "react";
import Footer from "../components/footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Patel Yarn House",
  description: "Your one-stop shop for premium yarns and knitting supplies.",
};

  export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
      <>
     <html>
      <body>
    <div>
  <NavBar />
   
      {children}
     </div>
     <Footer/>
  </body>
</html>
  </>
    )
  }

    
    
