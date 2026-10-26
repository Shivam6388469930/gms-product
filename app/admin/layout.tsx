import AdminSidebar from "@/components/admin/AdminSidebar";
import type { ReactNode } from "react";

export const metadata = {
  title: "GMS Admin Panel",
  description: "Admin dashboard for GMS Research Platform",
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <AdminSidebar>{children}</AdminSidebar>;
}


