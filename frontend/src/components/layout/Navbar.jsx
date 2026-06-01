import { Link, NavLink, useNavigate } from "react-router-dom";

import Button from "@/components/ui/Button";
import { useAuthStore } from "@/store/authStore";
import { useLogout } from "@/hooks/useAuth";
import { useConversations } from "@/hooks/useMessaging";

export default function Navbar() {
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();
  const navigate = useNavigate();
  const { data: conversations } = useConversations(Boolean(user));
  const unreadTotal = (conversations?.results || []).reduce(
    (sum, c) => sum + (c.unread_count || 0),
    0,
  );

  const linkClass = ({ isActive }) =>
    `px-3 py-2 text-sm font-medium ${
      isActive ? "text-primary-700" : "text-neutral-700 hover:text-primary-700"
    }`;

  return (
    <nav className="border-b border-neutral-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="text-xl font-bold text-primary-700">
          Kessia
        </Link>
        <div className="flex items-center gap-1">
          <NavLink to="/listings" className={linkClass}>
            Annonces
          </NavLink>
          <NavLink to="/requests" className={linkClass}>
            Demandes
          </NavLink>
          {user ? (
            <>
              <NavLink
                to={user.is_writer ? "/dashboard/writer" : "/dashboard/doctor"}
                className={linkClass}
              >
                Tableau de bord
              </NavLink>
              <NavLink to="/messages" className={linkClass}>
                Messagerie
                {unreadTotal > 0 && (
                  <span className="ml-1 rounded-full bg-primary-600 px-1.5 text-xs text-white">
                    {unreadTotal}
                  </span>
                )}
              </NavLink>
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  await logout.mutateAsync();
                  navigate("/");
                }}
              >
                Déconnexion
              </Button>
            </>
          ) : (
            <>
              <NavLink to="/login" className={linkClass}>
                Se connecter
              </NavLink>
              <Link to="/register">
                <Button size="sm">S'inscrire</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
