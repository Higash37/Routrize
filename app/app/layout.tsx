import Link from "next/link";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-60 shrink-0 border-r bg-sidebar p-4 md:block">
        <div className="mb-8 text-lg font-semibold">Routrize</div>
        <nav className="flex flex-col gap-1 text-sm">
          <Link
            href="/app/dashboard"
            className="rounded-md px-3 py-2 hover:bg-sidebar-accent"
          >
            Dashboard
          </Link>
          <Link
            href="/app/routes"
            className="rounded-md px-3 py-2 hover:bg-sidebar-accent"
          >
            Routes
          </Link>
          <Link
            href="/app/students"
            className="rounded-md px-3 py-2 hover:bg-sidebar-accent"
          >
            Students
          </Link>
        </nav>
      </aside>
      <main className="flex-1 overflow-auto">
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
