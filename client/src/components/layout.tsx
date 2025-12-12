import { Link } from "wouter";
import { useLocation } from "wouter";
import { useBeverage } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { LogOut, LayoutDashboard, User as UserIcon } from "lucide-react";
import background from "@assets/generated_images/abstract_dark_industrial_tech_background_with_neon_accents.png";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { currentUser, isAdmin, logoutUser, logoutAdmin } = useBeverage();

  const handleLogout = () => {
    if (isAdmin) logoutAdmin();
    if (currentUser) logoutUser();
  };

  return (
    <div className="min-h-screen w-full bg-background text-foreground relative overflow-hidden font-sans selection:bg-primary selection:text-primary-foreground">
      {/* Background Image with Overlay */}
      <div 
        className="fixed inset-0 z-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: `url(${background})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      <div className="fixed inset-0 z-0 bg-gradient-to-b from-transparent via-background/80 to-background pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 flex flex-col min-h-screen">
        <header className="border-b border-border/40 backdrop-blur-md bg-background/50 sticky top-0 z-50">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 bg-primary rounded-sm flex items-center justify-center text-background font-bold font-display text-xl group-hover:scale-105 transition-transform">
                R
              </div>
              <span className="font-display font-bold text-xl tracking-wide">
                RECRIA <span className="text-primary">CORE</span>
              </span>
            </Link>

            <div className="flex items-center gap-4">
              {(currentUser || isAdmin) && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground hidden sm:inline-block">
                    {isAdmin ? "Administrator" : `Olá, ${currentUser?.name}`}
                  </span>
                  <Button variant="ghost" size="icon" onClick={handleLogout} title="Sair">
                    <LogOut className="w-4 h-4" />
                  </Button>
                </div>
              )}
              
              {!isAdmin && !currentUser && location !== "/admin" && (
                <Link href="/admin">
                  <Button variant="ghost" size="sm" className="text-muted-foreground text-xs">
                    Admin Access
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 container mx-auto px-4 py-8 max-w-5xl">
          {children}
        </main>

        <footer className="border-t border-border/40 py-6 text-center text-xs text-muted-foreground">
          <p>© 2025 Recria Core. Internal Consumption System.</p>
        </footer>
      </div>
    </div>
  );
}
