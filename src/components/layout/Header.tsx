import { User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const Header = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState<string>("");

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Try to get display name from user metadata or email
        const displayName = user.user_metadata?.full_name || 
                           user.user_metadata?.name || 
                           user.email?.split('@')[0] || 
                           'User';
        setUserName(displayName);
      }
    };
    getUser();
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      <div className="flex h-14 sm:h-16 items-center justify-between px-3 sm:px-4 max-w-full">
        <div className="flex items-center gap-2 min-w-0">
          <img src="/logo.jpg" alt="AI Campus Logo" className="h-7 w-7 sm:h-8 sm:w-8 rounded object-cover flex-shrink-0" />
          <h1 className="text-lg sm:text-xl font-bold text-primary truncate">AI Campus</h1>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          {userName && (
            <span className="hidden sm:inline text-sm text-muted-foreground truncate max-w-[120px]">
              {userName}
            </span>
          )}
          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => navigate("/profile")}>
            <User className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;