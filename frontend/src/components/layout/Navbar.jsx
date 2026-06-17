import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  BadgeCheck,
  Heart,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Settings,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { fullName, initials } from "@/lib/format";
import { useAuthStore } from "@/store/authStore";
import { useLogout } from "@/hooks/useAuth";
import { useConversations } from "@/hooks/useMessaging";

const NAV_LINKS = [
  { to: "/listings", label: "Annonces" },
  { to: "/requests", label: "Demandes" },
];

const linkClass = ({ isActive }) =>
  cn(
    "rounded-md px-3 py-2 text-sm font-medium transition-colors",
    isActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
  );

export default function Navbar() {
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const { data: conversations } = useConversations(Boolean(user));
  const unreadTotal = (conversations?.results || []).reduce(
    (sum, c) => sum + (c.unread_count || 0),
    0,
  );

  const dashboardPath = user?.is_writer ? "/dashboard/writer" : "/dashboard/doctor";

  const handleLogout = async () => {
    setMobileOpen(false);
    try {
      await logout.mutateAsync();
    } catch {
      // The store is cleared regardless; nothing actionable for the user.
    }
    toast.success("Vous êtes déconnecté.");
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container flex h-16 items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {/* Mobile menu */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden" aria-label="Ouvrir le menu">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72">
              <SheetHeader>
                <SheetTitle className="font-display text-xl font-semibold tracking-tight">
                  Kessia<span className="text-primary">.</span>
                </SheetTitle>
              </SheetHeader>
              <nav className="mt-6 flex flex-col gap-1">
                {NAV_LINKS.map((l) => (
                  <SheetClose asChild key={l.to}>
                    <NavLink to={l.to} className={linkClass}>
                      {l.label}
                    </NavLink>
                  </SheetClose>
                ))}
                {user && (
                  <>
                    <SheetClose asChild>
                      <NavLink to={dashboardPath} className={linkClass}>
                        Tableau de bord
                      </NavLink>
                    </SheetClose>
                    <SheetClose asChild>
                      <NavLink to="/messages" className={linkClass}>
                        Messagerie {unreadTotal > 0 && `(${unreadTotal})`}
                      </NavLink>
                    </SheetClose>
                    <SheetClose asChild>
                      <NavLink to="/favoris" className={linkClass}>
                        Mes favoris
                      </NavLink>
                    </SheetClose>
                    <SheetClose asChild>
                      <NavLink to="/settings" className={linkClass}>
                        Paramètres
                      </NavLink>
                    </SheetClose>
                  </>
                )}
              </nav>
              <div className="mt-6 border-t pt-6">
                {user ? (
                  <Button variant="outline" className="w-full" onClick={handleLogout}>
                    <LogOut className="size-4" /> Déconnexion
                  </Button>
                ) : (
                  <div className="flex flex-col gap-2">
                    <SheetClose asChild>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => navigate("/login")}
                      >
                        Se connecter
                      </Button>
                    </SheetClose>
                    <SheetClose asChild>
                      <Button className="w-full" onClick={() => navigate("/register")}>
                        S'inscrire
                      </Button>
                    </SheetClose>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>

          <Link to="/" className="font-display text-xl font-semibold tracking-tight text-foreground">
            Kessia<span className="text-primary">.</span>
          </Link>

          <nav className="ml-4 hidden items-center gap-1 md:flex">
            {NAV_LINKS.map((l) => (
              <NavLink key={l.to} to={l.to} className={linkClass}>
                {l.label}
              </NavLink>
            ))}
            {user && (
              <NavLink to={dashboardPath} className={linkClass}>
                Tableau de bord
              </NavLink>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-1.5">
          {user ? (
            <>
              <Button
                asChild
                variant="ghost"
                size="icon"
                className="relative"
                aria-label="Messagerie"
              >
                <Link to="/messages">
                  <MessageSquare className="size-5" />
                  {unreadTotal > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 flex min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
                      {unreadTotal > 9 ? "9+" : unreadTotal}
                    </span>
                  )}
                </Link>
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2 px-2" aria-label="Menu du compte">
                    <Avatar className="size-8">
                      <AvatarImage src={user.avatar || undefined} alt="" />
                      <AvatarFallback className="bg-secondary text-xs font-semibold text-foreground">
                        {initials(user)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden max-w-[10rem] truncate text-sm font-medium lg:inline">
                      {fullName(user)}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="flex flex-col">
                    <span className="flex items-center gap-1 truncate">
                      {fullName(user)}
                      {user.is_verified && <BadgeCheck className="size-4 text-primary" />}
                    </span>
                    <span className="text-xs font-normal text-muted-foreground">
                      {user.is_writer ? "Rédacteur" : "Médecin"}
                    </span>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate(dashboardPath)}>
                    <LayoutDashboard className="size-4" /> Tableau de bord
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/messages")}>
                    <MessageSquare className="size-4" /> Messagerie
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/favoris")}>
                    <Heart className="size-4" /> Mes favoris
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/settings")}>
                    <Settings className="size-4" /> Paramètres
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="size-4" /> Déconnexion
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" className="hidden sm:inline-flex">
                <Link to="/login">Se connecter</Link>
              </Button>
              <Button asChild>
                <Link to="/register">S'inscrire</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
