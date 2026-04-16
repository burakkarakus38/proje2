import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import RoleCard from "@/components/portal/RoleCard";
import DecorativeBlobs from "@/components/portal/DecorativeBlobs";
import type { RoleCardProps } from "@/types";

const roles: RoleCardProps[] = [
  {
    title: "Şoför Girişi",
    subtitle: "User Access",
    icon: "directions_car",
    href: "/login?role=driver",
    colorScheme: "primary",
  },
  {
    title: "Otopark Yöneticisi",
    subtitle: "Facility Control",
    icon: "apartment",
    href: "/login?role=manager",
    colorScheme: "secondary",
  },
  {
    title: "Sistem Admini",
    subtitle: "Global Configuration",
    icon: "admin_panel_settings",
    href: "/login?role=admin",
    colorScheme: "dark",
  },
];

export default function RoleSelectionPage() {
  return (
    <>
      <Header />
      <DecorativeBlobs />

      <main className="flex-grow portal-gradient flex items-center justify-center px-6 py-24">
        <div className="max-w-2xl w-full flex flex-col items-center">
          {/* Hero */}
          <div className="text-center mb-16 space-y-4">
            <h1 className="text-5xl md:text-6xl font-extrabold font-headline text-primary tracking-tight leading-tight">
              Otopark Yönetim Sistemi
            </h1>
            <p className="text-xl md:text-2xl text-on-surface-variant font-medium max-w-lg mx-auto leading-relaxed">
              Lütfen devam etmek için giriş türünüzü seçin.
            </p>
          </div>

          {/* Role Cards */}
          <div className="w-full space-y-6">
            {roles.map((role) => (
              <RoleCard key={role.href} {...role} />
            ))}
          </div>

          {/* Divider */}
          <div className="mt-16 flex items-center gap-3 text-outline">
            <span className="h-px w-12 bg-outline-variant block" />
            <span className="text-sm font-medium tracking-widest uppercase">
              Secured Infrastructure
            </span>
            <span className="h-px w-12 bg-outline-variant block" />
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
