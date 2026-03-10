"use client";

import { useAuth } from "@/hooks/use-auth";
import { useEffect, useState, useTransition } from "react";
import { Building2, Store, Plus, Pencil, Trash2, Check, X, Copy, UserPlus } from "lucide-react";
import type { OrganizationRow, StoreRow, MembershipRow } from "@/types/database";
import { getOrgData, updateOrgName, addStore, updateStoreName, deleteStore } from "./actions";
import { generateInviteCode } from "./invite-actions";

export default function SettingsPage() {
  const { email } = useAuth();
  const [org, setOrg] = useState<OrganizationRow | null>(null);
  const [stores, setStores] = useState<StoreRow[]>([]);
  const [membership, setMembership] = useState<MembershipRow | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = async () => {
    const data = await getOrgData();
    setOrg(data.organization);
    setStores(data.stores);
    setMembership(data.membership);
    setLoading(false);
  };

  useEffect(() => {
    reload();
  }, []);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold">設定</h1>

      {/* プロフィール */}
      <section className="rounded-lg border bg-white p-6">
        <h2 className="text-base font-semibold mb-4">プロフィール</h2>
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#1F3864] text-xl font-bold text-white">
            {email ? email[0].toUpperCase() : "?"}
          </div>
          <div>
            <p className="text-sm font-medium">{email || "---"}</p>
            <p className="text-xs text-muted-foreground">メールアドレス</p>
          </div>
        </div>
      </section>

      {/* 組織情報 */}
      <section className="rounded-lg border bg-white p-6">
        <div className="flex items-center gap-2 mb-4">
          <Building2 className="h-5 w-5 text-slate-500" />
          <h2 className="text-base font-semibold">組織</h2>
        </div>
        {loading ? (
          <div className="h-10 w-48 rounded bg-slate-100 animate-pulse" />
        ) : org ? (
          <OrgNameEditor org={org} onUpdated={reload} />
        ) : (
          <p className="text-sm text-muted-foreground">
            組織が未作成です。ログアウトして再度サインアップしてください。
          </p>
        )}
      </section>

      {/* 店舗一覧 */}
      <section className="rounded-lg border bg-white p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Store className="h-5 w-5 text-slate-500" />
            <h2 className="text-base font-semibold">店舗（校舎）</h2>
          </div>
          {org && <AddStoreButton orgId={org.id} onAdded={reload} />}
        </div>
        {loading ? (
          <div className="space-y-3">
            <div className="h-14 rounded bg-slate-100 animate-pulse" />
            <div className="h-14 rounded bg-slate-100 animate-pulse" />
          </div>
        ) : stores.length === 0 ? (
          <p className="text-sm text-muted-foreground">店舗がありません</p>
        ) : (
          <div className="space-y-2">
            {stores.map((store) => (
              <StoreCard
                key={store.id}
                store={store}
                canDelete={stores.length > 1}
                onUpdated={reload}
              />
            ))}
          </div>
        )}
      </section>

      {/* サブスクリプション */}
      <section className="rounded-lg border bg-white p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">プラン</h2>
          <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-muted-foreground">
            開発中
          </span>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          現在のプランの確認やアップグレードを行えます。
        </p>
      </section>
    </div>
  );
}

/** 組織名の編集 */
function OrgNameEditor({
  org,
  onUpdated,
}: {
  org: OrganizationRow;
  onUpdated: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(org.name);
  const [isPending, startTransition] = useTransition();

  const handleSave = () => {
    startTransition(async () => {
      const result = await updateOrgName(org.id, name);
      if (!result.error) {
        setEditing(false);
        onUpdated();
      }
    });
  };

  const handleCancel = () => {
    setName(org.name);
    setEditing(false);
  };

  if (!editing) {
    return (
      <div className="flex items-center gap-3">
        <p className="text-sm font-medium">{org.name}</p>
        <button
          onClick={() => setEditing(true)}
          className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
        >
          <Pencil className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="h-9 rounded border px-3 text-sm"
        autoFocus
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSave();
          if (e.key === "Escape") handleCancel();
        }}
      />
      <button
        onClick={handleSave}
        disabled={isPending}
        className="rounded p-1.5 text-green-600 hover:bg-green-50"
      >
        <Check className="h-4 w-4" />
      </button>
      <button
        onClick={handleCancel}
        className="rounded p-1.5 text-slate-400 hover:bg-slate-100"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

/** 店舗カード */
function StoreCard({
  store,
  canDelete,
  onUpdated,
}: {
  store: StoreRow;
  canDelete: boolean;
  onUpdated: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(store.name);
  const [isPending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [inviteCopied, setInviteCopied] = useState(false);

  const handleGenerateInvite = () => {
    startTransition(async () => {
      const result = await generateInviteCode(store.id);
      if (result.code) setInviteCode(result.code);
    });
  };

  const handleCopyInvite = async () => {
    if (!inviteCode) return;
    await navigator.clipboard.writeText(inviteCode);
    setInviteCopied(true);
    setTimeout(() => setInviteCopied(false), 1500);
  };

  const handleSave = () => {
    startTransition(async () => {
      const result = await updateStoreName(store.id, name);
      if (!result.error) {
        setEditing(false);
        onUpdated();
      }
    });
  };

  const handleDelete = () => {
    if (!confirm(`「${store.name}」を削除しますか？`)) return;
    startTransition(async () => {
      const result = await deleteStore(store.id);
      if (!result.error) onUpdated();
    });
  };

  const handleCopyCode = async () => {
    await navigator.clipboard.writeText(store.store_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border p-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-500">
        <Store className="h-5 w-5" />
      </div>

      <div className="flex-1 min-w-0">
        {editing ? (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-8 rounded border px-2 text-sm"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave();
                if (e.key === "Escape") {
                  setName(store.name);
                  setEditing(false);
                }
              }}
            />
            <button
              onClick={handleSave}
              disabled={isPending}
              className="rounded p-1 text-green-600 hover:bg-green-50"
            >
              <Check className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => {
                setName(store.name);
                setEditing(false);
              }}
              className="rounded p-1 text-slate-400 hover:bg-slate-100"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <p className="text-sm font-medium truncate">{store.name}</p>
        )}

        <button
          onClick={handleCopyCode}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-slate-600"
        >
          <span className="font-mono">{store.store_code}</span>
          {copied ? (
            <Check className="h-3 w-3 text-green-500" />
          ) : (
            <Copy className="h-3 w-3" />
          )}
        </button>
      </div>

      {!editing && (
        <div className="flex items-center gap-1">
          <button
            onClick={handleGenerateInvite}
            disabled={isPending}
            title="招待コードを発行"
            className="rounded p-1.5 text-slate-400 hover:bg-blue-50 hover:text-blue-500"
          >
            <UserPlus className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setEditing(true)}
            className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          {canDelete && (
            <button
              onClick={handleDelete}
              disabled={isPending}
              className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}

      {inviteCode && (
        <div className="col-span-full mt-2 flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2">
          <p className="text-xs text-blue-700">招待コード（1時間有効）:</p>
          <code className="rounded bg-white px-2 py-0.5 font-mono text-sm font-bold tracking-widest text-blue-900">
            {inviteCode}
          </code>
          <button
            onClick={handleCopyInvite}
            className="rounded p-1 text-blue-500 hover:bg-blue-100"
          >
            {inviteCopied ? (
              <Check className="h-3.5 w-3.5 text-green-500" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </button>
          <button
            onClick={() => setInviteCode(null)}
            className="ml-auto rounded p-1 text-blue-400 hover:bg-blue-100"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

/** 店舗追加ボタン */
function AddStoreButton({
  orgId,
  onAdded,
}: {
  orgId: string;
  onAdded: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleAdd = () => {
    if (!name.trim()) return;
    startTransition(async () => {
      const result = await addStore(orgId, name);
      if (!result.error) {
        setName("");
        setOpen(false);
        onAdded();
      }
    });
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
      >
        <Plus className="h-3.5 w-3.5" />
        店舗を追加
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="店舗名（例: 渋谷校）"
        className="h-8 rounded border px-2 text-sm"
        autoFocus
        onKeyDown={(e) => {
          if (e.key === "Enter") handleAdd();
          if (e.key === "Escape") {
            setName("");
            setOpen(false);
          }
        }}
      />
      <button
        onClick={handleAdd}
        disabled={isPending || !name.trim()}
        className="rounded bg-blue-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-600 disabled:opacity-50"
      >
        追加
      </button>
      <button
        onClick={() => {
          setName("");
          setOpen(false);
        }}
        className="rounded p-1 text-slate-400 hover:bg-slate-100"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
