export default function StudentPortalLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex h-14 items-center justify-center border-b">
        <div className="text-lg font-semibold">Routrize - 生徒ポータル</div>
      </header>
      <main className="flex flex-1 flex-col items-center justify-center p-4">
        {children}
      </main>
    </div>
  );
}
