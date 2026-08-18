import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-slate-100">
      <div className="container-page flex flex-col items-center justify-between gap-4 py-8 text-sm text-slate-600 md:flex-row">
        <Link href="/" className="font-medium text-primary hover:opacity-80">
          RevSlot
        </Link>
        <span>© {new Date().getFullYear()} RevSlot. Academic review scheduling, simplified.</span>
      </div>
    </footer>
  );
}