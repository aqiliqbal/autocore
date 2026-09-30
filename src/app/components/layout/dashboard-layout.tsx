"use client";

import Sidebar from "./sidebar";
import Topbar from "./topbar";

type DashboardLayoutProps = {
  children: React.ReactNode;
};

export default function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-[#07080b] text-white">
      <Sidebar />

      <div className="min-h-screen pl-[255px]">
        <Topbar />

        <main>{children}</main>
      </div>
    </div>
  );
}