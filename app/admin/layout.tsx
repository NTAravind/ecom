import { Nav } from "../components/Nav";

export default function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="container py-4 mx-auto">
      <Nav />
      {children}
    </div>
  );
}
