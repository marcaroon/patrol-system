// src/app/patrol/page.tsx
"use client";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Shield, Leaf, ArrowLeft, Loader2 } from "lucide-react";
import SecurityPatrolForm from "@/components/patrol/SecurityPatrolForm";
import HSEPatrolForm from "@/components/patrol/HSEPatrolForm";

function PatrolContent() {
  const searchParams = useSearchParams();
  const division = searchParams.get("division") as "SECURITY" | "HSE" | null;

  if (!division || (division !== "SECURITY" && division !== "HSE")) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-gray-500">Divisi tidak valid</p>
          <Link href="/" className="btn-primary">Kembali</Link>
        </div>
      </div>
    );
  }

  const isSecurity = division === "SECURITY";

  return (
    <div className="min-h-screen bg-gray-50">
      <header className={`sticky top-0 z-40 px-4 py-3 flex items-center gap-3 shadow-sm ${isSecurity ? "bg-gradient-to-r from-blue-800 to-blue-700" : "bg-gradient-to-r from-green-800 to-green-700"}`}>
        <Link href="/" className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
          <ArrowLeft className="w-4 h-4 text-white" />
        </Link>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isSecurity ? "bg-blue-500" : "bg-green-500"}`}>
          {isSecurity ? <Shield className="w-5 h-5 text-white" /> : <Leaf className="w-5 h-5 text-white" />}
        </div>
        <div>
          <h1 className="text-white font-bold text-sm leading-none">
            Laporan Patrol {isSecurity ? "Security" : "HSE"}
          </h1>
          <p className="text-white/60 text-xs mt-0.5">PT Intan Sejati Andalan</p>
        </div>
      </header>
      <main className="max-w-2xl mx-auto px-4 py-5">
        {isSecurity ? <SecurityPatrolForm /> : <HSEPatrolForm />}
      </main>
    </div>
  );
}

export default function PatrolPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-green-600" /></div>}>
      <PatrolContent />
    </Suspense>
  );
}
