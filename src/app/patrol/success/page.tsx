// src/app/patrol/success/page.tsx
"use client";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, Home, Plus } from "lucide-react";

function SuccessContent() {
  const searchParams = useSearchParams();
  const type = searchParams.get("type") as "SECURITY" | "HSE" | null;
  return (
    <div className="min-h-screen flex items-center justify-center px-6"
      style={{ background: "linear-gradient(135deg,#0a1628 0%,#0d2e1a 50%,#0a1628 100%)" }}>
      <div className="max-w-sm w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="w-24 h-24 rounded-full bg-green-500/20 flex items-center justify-center border-2 border-green-400/30 animate-pulse-slow">
            <CheckCircle className="w-12 h-12 text-green-400" />
          </div>
        </div>
        <div>
          <h1 className="text-white text-2xl font-bold mb-2">Laporan Terkirim!</h1>
          <p className="text-green-300/70 text-sm">
            Laporan patrol {type === "SECURITY" ? "Security" : "HSE"} berhasil dikirim dan tersimpan ke database.
          </p>
        </div>
        <div className="bg-white/5 rounded-2xl p-4 border border-white/10 text-left space-y-2">
          <p className="text-green-400 text-xs font-semibold uppercase tracking-wider">Detail Pengiriman</p>
          <div className="flex justify-between text-sm"><span className="text-gray-400">Divisi</span><span className="text-white font-medium">{type === "SECURITY" ? "Security" : "HSE"}</span></div>
          <div className="flex justify-between text-sm"><span className="text-gray-400">Waktu</span><span className="text-white font-medium">{new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB</span></div>
          <div className="flex justify-between text-sm"><span className="text-gray-400">Status</span><span className="text-green-400 font-medium">✓ Tersimpan di Database</span></div>
        </div>
        <div className="flex flex-col gap-3">
          <Link href={`/patrol?division=${type ?? "SECURITY"}`}
            className="flex items-center justify-center gap-2 w-full py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-colors">
            <Plus className="w-4 h-4" /> Buat Laporan Baru
          </Link>
          <Link href="/"
            className="flex items-center justify-center gap-2 w-full py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl transition-colors">
            <Home className="w-4 h-4" /> Kembali ke Beranda
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-900"><CheckCircle className="w-8 h-8 text-green-400 animate-pulse" /></div>}>
      <SuccessContent />
    </Suspense>
  );
}
