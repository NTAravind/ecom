import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { ReactNode } from "react";
import FloatingWhatsApp from "./components/whatsapp";


export const metadata: Metadata = {
  title: "Patel Yarn House",
  description: "Your one-stop shop for premium yarns and knitting supplies.",
};

  export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
      <html>
        <body>
     {children}
           <FloatingWhatsApp/>
        </body>
      </html>
    )
  }

    
    
