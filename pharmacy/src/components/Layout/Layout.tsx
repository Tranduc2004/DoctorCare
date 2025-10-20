import React from "react";
import SideBar from "../SideBar/SideBar";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="bg-gradient-to-br from-white via-[#EAF9F6] to-white text-slate-900 min-h-screen">
      <div className="grid grid-cols-1 md:grid-cols-[240px_1fr]">
        <SideBar />
        <main className="min-h-screen">{children}</main>
      </div>
    </div>
  );
};

export default Layout;
