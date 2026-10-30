import { Sidebar } from "@/components/layout/sidebar";
import { TopNavbar } from "@/components/layout/top-navbar";

const DashboardLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="flex min-h-screen bg-background">
    <Sidebar />
    <div className="flex min-w-0 flex-1 flex-col">
      <TopNavbar />
      <main className="flex-1 p-6">{children}</main>
    </div>
  </div>
);

export default DashboardLayout;
