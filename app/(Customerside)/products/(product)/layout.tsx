// app/products/layout.tsx
import { ReactNode, Suspense } from "react";

export default function ProductsLayout({ children }: { children: React.ReactNode }) {
  return (
 <div>
  {children}
    </div>
  );
}