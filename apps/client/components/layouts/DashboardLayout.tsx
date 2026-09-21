import Sidebar from "@/components/common/Sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-surface">
      <Sidebar />
      <main className="flex-1 overflow-y-auto px-10 py-10">
        <div className="mx-auto max-w-5xl">{children}</div>
      </main>
    </div>
  );
}