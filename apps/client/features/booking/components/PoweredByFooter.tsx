const BoltIcon = () => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path d="M13 2 3 14h7l-1 8 10-12h-7l1-8Z" />
  </svg>
);

export default function PoweredByFooter() {
  return (
    <div className="mt-8 flex items-center justify-center gap-1.5 pb-4 text-xs text-slate-400">
      <span>Powered by</span>

      <a
        href="https://revslot.com"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 font-semibold text-slate-500 transition-colors hover:text-primary"
      >
        <span className="text-primary">
          <BoltIcon />
        </span>

        revSlot.com
      </a>
    </div>
  );
}