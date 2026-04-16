export default function Footer() {
  return (
    <footer className="w-full py-6 mt-auto bg-white border-t border-slate-100 flex flex-col md:flex-row justify-between items-center px-8">
      <div className="font-body text-xs text-slate-500">
        © 2026 parkET. All rights reserved.
      </div>
      <div className="flex gap-6 mt-4 md:mt-0 font-body text-xs">
        <a
          className="text-slate-400 hover:text-primary underline underline-offset-4 transition-colors"
          href="#"
        >
          Privacy Policy
        </a>
        <a
          className="text-slate-400 hover:text-primary underline underline-offset-4 transition-colors"
          href="#"
        >
          Terms of Service
        </a>
        <a
          className="text-slate-400 hover:text-primary underline underline-offset-4 transition-colors"
          href="#"
        >
          Support
        </a>
      </div>
    </footer>
  );
}
