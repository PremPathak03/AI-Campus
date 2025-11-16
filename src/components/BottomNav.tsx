import { Home, Calendar, MessageSquare, Navigation } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { cn } from "@/lib/utils";

const BottomNav = () => {
  const navItems = [
    { to: "/", icon: Home, label: "Home" },
    { to: "/schedule", icon: Calendar, label: "Schedule" },
    { to: "/chat", icon: MessageSquare, label: "Chat" },
    { to: "/navigate", icon: Navigation, label: "Navigate" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-around h-16">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className="flex flex-col items-center justify-center gap-1 px-3 py-2 text-muted-foreground transition-colors hover:text-foreground"
              activeClassName="text-primary"
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs">{label}</span>
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default BottomNav;