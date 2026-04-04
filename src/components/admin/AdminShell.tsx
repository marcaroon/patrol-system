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
  Menu,
  ChevronRight,
} from "lucide-react";

const NAV = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/reports", label: "Laporan", icon: FileText },
  { href: "/admin/users", label: "Personel", icon: Users },
  { href: "/admin/areas", label: "Area Patrol", icon: MapPin },
];

interface Session {
  username: string;
  role: string;
}

export default function AdminShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSession] = useState<Session | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => setSession({ username: data.username, role: data.role }))
      .catch(() => router.replace("/admin"));
  }, [router]);

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
            <img
              src="/mahkota.png"
              alt="Logo"
              className="w-8 h-8 rounded-xl"
            />
            <div>
              <p className="text-white font-bold text-sm leading-none">
                Admin Panel
              </p>
              <p className="text-green-400 text-xs mt-0.5">Mahkota Group</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-0.5">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${active ? "bg-green-600/20 text-green-400 border border-green-500/20" : "text-gray-400 hover:text-white hover:bg-white/5"}`}
              >
                <Icon className="w-4 h-4" />
                {label}
                {active && (
                  <ChevronRight className="w-3 h-3 ml-auto text-green-400" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-white/5">
          <div className="flex items-center gap-2.5 px-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-green-800 flex items-center justify-center text-white text-xs font-bold uppercase">
              {session.username[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">
                {session.username}
              </p>
              <p className="text-gray-500 text-xs capitalize">
                {session.role.toLowerCase().replace("_", " ")}
              </p>
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
          <Shield className="w-4 h-4 text-green-400" />
          <span className="text-white font-semibold text-sm">Admin Panel</span>
        </header>
        <main className="flex-1 p-4 lg:p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
