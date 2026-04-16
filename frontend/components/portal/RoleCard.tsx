"use client";

import { useRouter } from "next/navigation";
import MaterialIcon from "@/components/ui/MaterialIcon";
import type { RoleCardProps } from "@/types";

const colorMap = {
  primary: {
    card: "bg-primary-container text-white",
    subtitle: "text-on-primary-container",
    iconBg: "bg-white/10 border border-white/20",
    arrow: "text-white",
  },
  secondary: {
    card: "bg-secondary-container text-on-secondary-fixed",
    subtitle: "text-on-secondary-fixed-variant",
    iconBg: "bg-black/5 border border-black/10",
    arrow: "text-on-secondary-fixed",
  },
  dark: {
    card: "bg-inverse-surface text-white",
    subtitle: "text-outline-variant",
    iconBg: "bg-white/5 border border-white/10",
    arrow: "text-white",
  },
};

export default function RoleCard({
  title,
  subtitle,
  icon,
  href,
  colorScheme,
}: RoleCardProps) {
  const router = useRouter();
  const colors = colorMap[colorScheme];

  return (
    <button
      onClick={() => router.push(href)}
      className={`w-full group relative overflow-hidden ${colors.card} p-8 rounded-xl flex items-center justify-between transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl active:scale-95`}
    >
      {/* Left: icon + text */}
      <div className="flex items-center gap-6">
        <div
          className={`w-16 h-16 ${colors.iconBg} rounded-full flex items-center justify-center`}
        >
          <MaterialIcon name={icon} className="text-4xl" />
        </div>
        <div className="text-left">
          <span
            className={`block text-sm font-label uppercase tracking-widest ${colors.subtitle} mb-1`}
          >
            {subtitle}
          </span>
          <h3 className="text-2xl font-bold font-headline">{title}</h3>
        </div>
      </div>

      {/* Right: arrow */}
      <MaterialIcon
        name="arrow_forward"
        className={`text-3xl opacity-50 group-hover:opacity-100 group-hover:translate-x-2 transition-all ${colors.arrow}`}
      />

      {/* Sheen effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />
    </button>
  );
}
