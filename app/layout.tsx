import type { Metadata } from "next";
import { Geist, Geist_Mono, Manrope } from "next/font/google";
import "./globals.css";

import { ReactNode } from "react";
import FloatingWhatsApp from "./components/whatsapp";


export const metadata: Metadata = {
  title: "Patel Yarn House",
  description: "Your one-stop shop for premium yarns and knitting supplies.",
};
const manrope = Manrope({
subsets:['latin'],
})

  export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
      <html className={manrope.className}>
        <body>
     {children}
         
        </body>
      </html>
    )
  }

    
    
