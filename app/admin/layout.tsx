import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSideBar } from "./components/appsidebar";

// Force dynamic rendering for all pages under this layout
export const dynamic = 'force-dynamic';

export default function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="">
      <SidebarProvider>
        <AppSideBar />
        <SidebarTrigger />
        {children}
      </SidebarProvider>
    </div>
  );
}