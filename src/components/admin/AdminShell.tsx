// src/components/admin/AdminShell.tsx
"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  FileText,
  Users,
  MapPin,
  LogOut,
  Shield,
  Leaf,
  Menu,
  ChevronRight,
} from "lucide-react";
import type { AdminRoleType } from "@/lib/auth";

// Nav items per role
function getNavItems(role: AdminRoleType) {
  if (role === "SECURITY_ADMIN") {
    return [
      {
        href: "/admin/security",
        label: "Dashboard Security",
        icon: LayoutDashboard,
      },
      {
        href: "/admin/security/reports",
        label: "Laporan Security",
        icon: FileText,
      },
      {
        href: "/admin/security/users",
        label: "Personel Security",
        icon: Users,
      },
      { href: "/admin/security/areas", label: "Area Patrol", icon: MapPin },
    ];
  }
  if (role === "HSE_ADMIN") {
    return [
      { href: "/admin/hse", label: "Dashboard EHS&FS", icon: LayoutDashboard },
      { href: "/admin/hse/reports", label: "Laporan EHS&FS", icon: FileText },
      { href: "/admin/hse/users", label: "Personel EHS&FS", icon: Users },
    ];
  }
  // SUPER_ADMIN / VIEWER — full nav
  return [
    { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/reports", label: "Laporan", icon: FileText },
    { href: "/admin/users", label: "Personel", icon: Users },
    { href: "/admin/areas", label: "Area Patrol", icon: MapPin },
  ];
}

function getRoleBadge(role: AdminRoleType) {
  switch (role) {
    case "SUPER_ADMIN":
      return { label: "Super Admin", color: "text-green-400" };
    case "VIEWER":
      return { label: "Viewer", color: "text-blue-400" };
    case "SECURITY_ADMIN":
      return { label: "Security Admin", color: "text-blue-400" };
    case "HSE_ADMIN":
      return { label: "EHS&FS Admin", color: "text-emerald-400" };
  }
}

function getRoleIcon(role: AdminRoleType) {
  if (role === "SECURITY_ADMIN") return Shield;
  if (role === "HSE_ADMIN") return Leaf;
  return Shield;
}

interface Session {
  username: string;
  role: AdminRoleType;
}

export default function AdminShell({
  children,
  requiredRoles,
}: {
  children: React.ReactNode;
  requiredRoles?: AdminRoleType[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSession] = useState<Session | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => {
        const role = data.role as AdminRoleType;

        // Role access check
        if (requiredRoles && requiredRoles.length > 0) {
          if (!requiredRoles.includes(role)) {
            // Redirect to their proper dashboard
            if (role === "SECURITY_ADMIN") router.replace("/admin/security");
            else if (role === "HSE_ADMIN") router.replace("/admin/hse");
            else router.replace("/admin/dashboard");
            return;
          }
        }

        setSession({ username: data.username, role });
      })
      .catch(() => router.replace("/admin"));
  }, [router, requiredRoles]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin");
  };

  if (!session)
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="w-6 h-6 rounded-full border-2 border-green-500 border-t-transparent animate-spin" />
      </div>
    );

  const navItems = getNavItems(session.role);
  const badge = getRoleBadge(session.role);
  const RoleIcon = getRoleIcon(session.role);

  const headerTitle =
    session.role === "SECURITY_ADMIN"
      ? "Admin Security"
      : session.role === "HSE_ADMIN"
        ? "Admin EHS&FS"
        : "Admin Panel";

  const accentColor =
    session.role === "SECURITY_ADMIN"
      ? "text-blue-400"
      : session.role === "HSE_ADMIN"
        ? "text-emerald-400"
        : "text-green-400";

  return (
    <div className="min-h-screen flex bg-slate-950">
      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky lg:top-0 inset-y-0 left-0 z-50 w-60 h-screen flex flex-col overflow-y-auto transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
        style={{
          background: "linear-gradient(180deg,#0a1628 0%,#0f2040 100%)",
          borderRight: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        <div className="p-4 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <img src="/mahkota.png" alt="Logo" className="w-8 h-8 rounded-xl" />
            <div>
              <p className="text-white font-bold text-sm leading-none">
                {headerTitle}
              </p>
              <p className={`text-xs mt-0.5 ${accentColor}`}>Mahkota Group</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-0.5">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isExactMatch = pathname === href;
            const isNestedMatch =
              pathname.startsWith(href + "/") &&
              !href.endsWith("/dashboard") &&
              !href.endsWith("/hse") &&
              !href.endsWith("/security");

            const active = isExactMatch || isNestedMatch;

            const activeStyle =
              session.role === "SECURITY_ADMIN"
                ? "bg-blue-600/20 text-blue-400 border border-blue-500/20"
                : session.role === "HSE_ADMIN"
                  ? "bg-emerald-600/20 text-emerald-400 border border-emerald-500/20"
                  : "bg-green-600/20 text-green-400 border border-green-500/20";
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${active ? activeStyle : "text-gray-400 hover:text-white hover:bg-white/5"}`}
              >
                <Icon className="w-4 h-4" />
                {label}
                {active && (
                  <ChevronRight className={`w-3 h-3 ml-auto ${accentColor}`} />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-white/5">
          <div className="flex items-center gap-2.5 px-2 mb-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold uppercase ${session.role === "SECURITY_ADMIN" ? "bg-blue-800" : session.role === "HSE_ADMIN" ? "bg-emerald-800" : "bg-green-800"}`}
            >
              {session.username[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">
                {session.username}
              </p>
              <p className={`text-xs ${badge.color}`}>{badge.label}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="w-4 h-4" /> Keluar
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="lg:hidden sticky top-0 z-30 flex items-center gap-3 px-4 py-3 bg-slate-900 border-b border-white/5">
          <button
            onClick={() => setSidebarOpen(true)}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/5 text-white hover:bg-white/10"
          >
            <Menu className="w-5 h-5" />
          </button>
          <RoleIcon className={`w-4 h-4 ${accentColor}`} />
          <span className="text-white font-semibold text-sm">
            {headerTitle}
          </span>
        </header>
        <main className="flex-1 p-4 lg:p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
