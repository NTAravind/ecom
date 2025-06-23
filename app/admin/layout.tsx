import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Nav } from "../components/Nav";
import { AppSideBar } from "./components/appsidebar";

export default function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="">

      <SidebarProvider >
        <AppSideBar/>
  
          <SidebarTrigger/>
          {children}
        
      </SidebarProvider>
  
    </div>
  );
}
