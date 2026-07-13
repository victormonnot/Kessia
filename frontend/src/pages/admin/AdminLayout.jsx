import { NavLink, Outlet } from "react-router-dom";
import {
  ClipboardList,
  FileText,
  Flag,
  LayoutDashboard,
  ScrollText,
  ShoppingBag,
  Star,
  Users,
} from "lucide-react";

import { cn } from "@/lib/utils";

const LINKS = [
  { to: "/admin", end: true, label: "Tableau de bord", icon: LayoutDashboard },
  { to: "/admin/users", label: "Utilisateurs", icon: Users },
  { to: "/admin/listings", label: "Annonces", icon: FileText },
  { to: "/admin/requests", label: "Demandes", icon: ClipboardList },
  { to: "/admin/reviews", label: "Avis", icon: Star },
  { to: "/admin/orders", label: "Commandes", icon: ShoppingBag },
  { to: "/admin/reports", label: "Signalements", icon: Flag },
  { to: "/admin/audit-log", label: "Journal", icon: ScrollText },
];

export default function AdminLayout() {
  return (
    <div className="container py-8">
      <h1 className="mb-6 font-display text-2xl font-semibold tracking-tight">Administration</h1>
      <div className="grid gap-6 md:grid-cols-[220px_1fr]">
        <aside className="h-max md:sticky md:top-20">
          <nav className="flex flex-row flex-wrap gap-1 md:flex-col">
            {LINKS.map(({ to, end, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-secondary text-foreground"
                      : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground",
                  )
                }
              >
                <Icon className="size-4" /> {label}
              </NavLink>
            ))}
          </nav>
        </aside>
        <main className="min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
