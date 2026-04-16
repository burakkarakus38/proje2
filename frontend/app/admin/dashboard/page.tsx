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
  const [stats, setStats] = useState([
    { label: "Toplam Kullanıcı", value: "1,284", icon: "group", color: "bg-blue-500" },
    { label: "Aktif Rezervasyonlar", value: "452", icon: "bookmark", color: "bg-green-500" },
    { label: "Toplam Otopark", value: "42", icon: "local_parking", color: "bg-purple-500" },
    { label: "Günlük Gelir", value: "₺12,450", icon: "payments", color: "bg-orange-500" },
  ]);

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      router.replace("/login?role=admin");
      return;
    }
    if (currentUser.role !== "ADMIN") {
      router.replace("/");
      return;
    }
    setUser(currentUser);
  }, [getCurrentUser, router]);

  if (!user) return null;

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <Header />
      
      <main className="flex-grow pt-24 pb-12 px-4 md:px-8">
        <div className="max-w-7xl mx-auto space-y-8">
          
          {/* Hero Header */}
          <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 to-slate-800 rounded-3xl p-8 md:p-12 text-white shadow-2xl">
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-medium tracking-wider uppercase mb-4">
                <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse"></span>
                Sistem Kontrol Paneli
              </div>
              <h1 className="text-4xl md:text-5xl font-extrabold font-headline mb-4 tracking-tight">
                Hoş Geldiniz, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">{user.name || "Admin"}</span>
              </h1>
              <p className="text-slate-400 max-w-xl text-lg">
                ParkET akıllı otopark sisteminin tüm kontrolü parmaklarınızın ucunda. Kullanıcıları, otoparkları ve finansal verileri buradan yönetebilirsiniz.
              </p>
            </div>
            {/* Abstract Background Element */}
            <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl"></div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat) => (
              <div key={stat.label} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-all duration-300 group">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 ${stat.color} bg-opacity-10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <MaterialIcon name={stat.icon} className={`text-2xl text-slate-800`} />
                  </div>
                  <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg">
                    +%12.5
                  </span>
                </div>
                <h3 className="text-slate-500 text-sm font-medium">{stat.label}</h3>
                <p className="text-2xl font-bold text-slate-900 mt-1 tracking-tight">{stat.value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Management Area */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                  <h2 className="text-xl font-bold text-slate-900">Son Aktiviteler</h2>
                  <button className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors">Tümünü Gör</button>
                </div>
                <div className="p-0">
                  {[
                    { user: "Ahmet Y.", action: "Yeni Rezervasyon", time: "2 dk önce", amount: "₺45.00" },
                    { user: "Mehmet K.", action: "Üyelik İptali", time: "15 dk önce", amount: "-" },
                    { user: "Beşiktaş Otopark", action: "Kapasite Güncelleme", time: "1 saat önce", amount: "120 Slot" },
                    { user: "Sistem", action: "Yedekleme Tamamlandı", time: "3 saat önce", amount: "64MB" },
                  ].map((log, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors border-b last:border-0 border-slate-50">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-500 text-sm">
                          {log.user[0]}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">{log.action}</p>
                          <p className="text-xs text-slate-500">{log.user} • {log.time}</p>
                        </div>
                      </div>
                      <span className="text-sm font-mono font-medium text-slate-600">{log.amount}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Side Actions */}
            <div className="space-y-6">
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
                <h2 className="text-lg font-bold text-slate-900 mb-4">Hızlı Erişim</h2>
                <div className="space-y-3">
                  {[
                    { icon: "person_add", label: "Yeni Yönetici Ekle", color: "text-blue-600" },
                    { icon: "add_business", label: "Otopark Ekle", color: "text-purple-600" },
                    { icon: "file_download", label: "Rapor İndir", color: "text-slate-700" },
                    { icon: "settings", label: "Genel Ayarlar", color: "text-slate-700" },
                  ].map((item) => (
                    <button key={item.label} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-200 active:scale-95">
                      <MaterialIcon name={item.icon} className={`text-xl ${item.color}`} />
                      <span className="text-sm font-semibold text-slate-700">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Security Status */}
              <div className="bg-blue-600 rounded-3xl p-6 text-white shadow-lg shadow-blue-500/20">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <MaterialIcon name="verified_user" className="text-xl" />
                  </div>
                  <h3 className="font-bold">Sistem Durumu</h3>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-blue-100">Güvenlik Duvarı</span>
                    <span className="font-bold">AKTİF</span>
                  </div>
                  <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-white w-[98%] h-full"></div>
                  </div>
                  <p className="text-[10px] text-blue-200 pt-1">Son güvenlik taraması: 10 dk önce</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {/* Logout Floating Button */}
      <div className="fixed bottom-8 right-8">
        <button
          onClick={logout}
          className="bg-white text-slate-900 px-6 py-3 rounded-2xl shadow-xl border border-slate-200 flex items-center gap-2 font-bold hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all active:scale-95 group"
        >
          <MaterialIcon name="logout" className="text-xl group-hover:-translate-x-1 transition-transform" />
          Güvenli Çıkış
        </button>
      </div>
    </div>
  );
}
