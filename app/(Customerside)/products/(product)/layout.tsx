// app/products/layout.tsx
import MarqueeComponent from "@/app/components/marquee";
import { ReactNode, Suspense } from "react";

export default function ProductsLayout({ children }: { children: React.ReactNode }) {
  return (
 <div>
  <MarqueeComponent/>
  {children}
    </div>
  );
}