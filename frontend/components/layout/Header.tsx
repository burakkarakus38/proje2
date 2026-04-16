import Link from "next/link";

export default function Header() {
  return (
    <header className="fixed top-0 w-full z-50 glass-header shadow-sm h-16 flex items-center px-8 justify-between">
      <Link
        href="/"
        className="text-2xl font-bold tracking-tight text-primary font-headline hover:opacity-80 transition-opacity"
      >
        parkET
      </Link>
      <div className="flex items-center gap-3">
        <span className="material-symbols-outlined text-outline">language</span>
        <span className="text-sm font-medium text-on-surface-variant">TR</span>
      </div>
    </header>
  );
}
