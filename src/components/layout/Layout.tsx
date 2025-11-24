import { ReactNode } from "react";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="flex flex-col min-h-screen bg-background overflow-x-hidden">
      <Header />
      <main className="flex-1 w-full px-3 sm:px-4 py-4 pb-20 overflow-x-hidden">
        {children}
      </main>
      <BottomNav />
    </div>
  );
};

export default Layout;