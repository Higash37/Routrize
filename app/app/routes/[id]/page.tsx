export default async function RouteEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div>
      <h1 className="text-2xl font-semibold">Route Editor</h1>
      <p className="mt-2 text-muted-foreground">
        ルート {id} のログイン版ビルダー（自動保存・A4/A3 PDF・テンプレ化・生徒割当）
      </p>
    </div>
  );
}
