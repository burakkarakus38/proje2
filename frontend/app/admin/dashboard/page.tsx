"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import MaterialIcon from "@/components/ui/MaterialIcon";
import { useAuth } from "@/hooks/useAuth";
import type { User } from "@/types";

export default function AdminDashboard() {
  const router = useRouter();
  const { logout, getCurrentUser } = useAuth();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser) { router.replace("/login?role=admin"); return; }
    if (currentUser.role !== "ADMIN") { router.replace("/"); return; }
    setUser(currentUser);
  }, [getCurrentUser, router]);

  if (!user) return null;

  return (
    <>
      <Header />
      <main className="flex-grow portal-gradient pt-24 pb-12 px-6">
        <div className="max-w-4xl mx-auto">
          {/* Welcome */}
          <div className="bg-inverse-surface rounded-xl p-8 text-white mb-8 flex items-center justify-between">
            <div>
              <p className="text-outline-variant text-sm font-label uppercase tracking-widest">Sistem Yöneticisi</p>
              <h1 className="text-3xl font-extrabold font-headline mt-1">
                Hoş Geldiniz, {user.name || user.email}!
              </h1>
              <p className="text-white/60 text-sm mt-2">{user.email}</p>
            </div>
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center border border-white/10">
              <MaterialIcon name="shield_person" className="text-4xl text-white" />
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {[
              { icon: "group", label: "Kullanıcılar", desc: "Tüm kullanıcıları yönet" },
              { icon: "local_parking", label: "Otopark Yönetimi", desc: "Tüm otoparkları görüntüle" },
              { icon: "bar_chart", label: "Sistem Raporu", desc: "Genel istatistikler ve analizler" },
            ].map((item) => (
              <div key={item.label} className="bg-white rounded-xl p-6 border border-outline-variant/20 hover:shadow-md transition-shadow cursor-pointer group">
                <MaterialIcon name={item.icon} className="text-3xl text-primary mb-3 group-hover:scale-110 transition-transform" />
                <h3 className="font-headline font-bold text-on-surface">{item.label}</h3>
                <p className="text-xs text-on-surface-variant mt-1">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* Logout */}
          <div className="flex justify-end">
            <button
              onClick={logout}
              className="flex items-center gap-2 text-sm text-outline hover:text-error transition-colors font-medium"
            >
              <MaterialIcon name="logout" className="text-xl" />
              Çıkış Yap
            </button>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
