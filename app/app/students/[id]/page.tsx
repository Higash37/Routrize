export default async function StudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div>
      <h1 className="text-2xl font-semibold">Student Detail</h1>
      <p className="mt-2 text-muted-foreground">
        生徒 {id} の基本情報・割当ルート・学習ログ・PIN再発行
      </p>
    </div>
  );
}
