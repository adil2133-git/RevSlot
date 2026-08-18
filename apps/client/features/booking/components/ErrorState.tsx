type ErrorStateProps = {
  message: string | null;
};

export default function ErrorState({ message }: ErrorStateProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="max-w-sm text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
          <svg
            className="h-6 w-6 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
            />
          </svg>
        </div>
        <h1 className="text-base font-semibold text-on-surface">
          This booking page isn&apos;t available
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          {message ?? "Double-check the link and try again."}
        </p>
      </div>
    </div>
  );
}