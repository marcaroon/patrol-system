// src/app/page.tsx
"use client";
import Link from "next/link";
import { Shield, Leaf, ChevronRight, Clock, MapPin } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(135deg,#0a1628 0%,#0d2e1a 50%,#0a1628 100%)" }}>
      {/* Header */}
      <header className="px-5 py-4 flex items-center gap-3 border-b border-white/10">
        <div className="w-9 h-9 rounded-xl bg-green-600 flex items-center justify-center">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="text-white font-bold text-sm leading-none">Mahkota Group</p>
          <p className="text-green-400 text-xs mt-0.5">Sistem Patrol & Monitoring</p>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex flex-col items-center justify-center px-5 py-10">
        <div className="w-full max-w-sm space-y-4">
          {/* Brand */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl mb-5 shadow-2xl shadow-green-900/50"
              style={{ background: "linear-gradient(135deg,#22c55e,#166534)" }}>
              <Shield className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-white text-3xl font-bold tracking-tight">Sistem Patrol</h2>
            <p className="text-green-300/60 text-sm mt-2">
              Platform pelaporan pemantauan patrol Security & EHSNF
            </p>
          </div>

          {/* Security Card */}
          <Link href="/patrol?division=SECURITY" className="block group">
            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 backdrop-blur-sm p-5 transition-all duration-300 hover:scale-[1.02]">
              <div className="flex items-center gap-4">
                <div className="w-13 h-13 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg"
                  style={{ background: "linear-gradient(135deg,#3b82f6,#1d4ed8)", width: 52, height: 52 }}>
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-blue-300 font-semibold uppercase tracking-wider mb-0.5">Divisi</p>
                  <h3 className="text-white text-xl font-bold">Security</h3>
                  <p className="text-gray-400 text-xs mt-0.5">Checklist patroli area & temuan</p>
                </div>
                <ChevronRight className="w-5 h-5 text-white/30 group-hover:text-white/70 transition-colors" />
              </div>
              <div className="mt-3 flex gap-4">
                <span className="inline-flex items-center gap-1.5 text-xs text-gray-400">
                  <Clock className="w-3 h-3" /> Waktu otomatis
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs text-gray-400">
                  <MapPin className="w-3 h-3" /> GPS otomatis
                </span>
              </div>
              <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-blue-500/10 blur-2xl" />
            </div>
          </Link>

          {/* HSE Card */}
          <Link href="/patrol?division=HSE" className="block group">
            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 backdrop-blur-sm p-5 transition-all duration-300 hover:scale-[1.02]">
              <div className="flex items-center gap-4">
                <div className="w-13 h-13 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg"
                  style={{ background: "linear-gradient(135deg,#22c55e,#166534)", width: 52, height: 52 }}>
                  <Leaf className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-green-300 font-semibold uppercase tracking-wider mb-0.5">Divisi</p>
                  <h3 className="text-white text-xl font-bold">EHSNF</h3>
                  <p className="text-gray-400 text-xs mt-0.5">Laporan kunjungan & sosialisasi K3</p>
                </div>
                <ChevronRight className="w-5 h-5 text-white/30 group-hover:text-white/70 transition-colors" />
              </div>
              <div className="mt-3 flex gap-4">
                <span className="inline-flex items-center gap-1.5 text-xs text-gray-400">
                  <Clock className="w-3 h-3" /> Waktu otomatis
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs text-gray-400">
                  <MapPin className="w-3 h-3" /> GPS otomatis
                </span>
              </div>
              <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-green-500/10 blur-2xl" />
            </div>
          </Link>

          {/* Admin link */}
          <p className="text-center pt-2">
            <Link href="/admin" className="text-xs text-gray-500 hover:text-gray-300 underline underline-offset-4 transition-colors">
              Masuk sebagai Admin
            </Link>
          </p>
        </div>
      </main>

      <footer className="text-center text-xs text-gray-600 py-4 border-t border-white/5">
        © 2026 Mahkota Group
      </footer>
    </div>
  );
}
