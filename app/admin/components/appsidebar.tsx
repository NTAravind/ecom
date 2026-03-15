import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarGroupLabel,
  SidebarMenuItem,
  SidebarMenu,
  SidebarMenuButton,
  SidebarGroupContent,
} from "@/components/ui/sidebar"
import { Box, CarIcon, Home, FactoryIcon, Palette, Database } from "lucide-react"
import { title } from "process"
const items = [
  {
    title: "Home",
    url: "/admin",
    icon: Home
  },
  {
    title: "Products",
    url: "/admin/products",
    icon: Box
  },
  {
    title: "Yarn Accessories",
    url: "/admin/yarn-accessories",
    icon: Palette
  },
  {
    title: "Orders",
    url: "/admin/orders",
    icon: CarIcon
  },
  {
    title: "Brands",
    url: "/admin/brands",
    icon: FactoryIcon,
  },
  {
    title: "Stock",
    url: "/admin/stock",
    icon: FactoryIcon,
  },
  {
    title: "Backups",
    url: "/admin/backups",
    icon: Database,
  }
]

export function AppSideBar() {
  return (
    <Sidebar>
      <SidebarHeader><div className="text-3xl sm:2xl my-5 font-semibold">Patel Yarn House</div></SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Admin Portal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}