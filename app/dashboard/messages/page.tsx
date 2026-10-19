"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Send, Users, HeartHandshake, ShieldCheck, MessageCircleOff } from "lucide-react";
import { apiFetch, API_BASE_URL, getAccessToken } from "@/lib/api";

type Contact = { user_id: number; name: string; role: string };
type Conversation = Contact & {
  last_message: string | null;
  last_message_at: string | null;
  unread_count: number;
};
type Message = {
  id: number;
  sender_id: number;
  recipient_id: number;
  content: string;
  is_read: boolean;
  created_at: string | null;
};

const roleIcon: Record<string, typeof Users> = {
  family: Users,
  caregiver: HeartHandshake,
  admin: ShieldCheck,
  nurse: ShieldCheck,
};

const roleIconClass: Record<string, string> = {
  family: "bg-brand-blue-light text-brand-blue",
  caregiver: "bg-brand-green-light text-brand-green",
  admin: "bg-status-amber-bg text-status-amber",
  nurse: "bg-status-amber-bg text-status-amber",
};

function formatTime(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso.endsWith("Z") ? iso : `${iso}Z`);
  return d.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
}

export default function MessagesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<Contact | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const selectedRef = useRef<Contact | null>(null);

  useEffect(() => {
    selectedRef.current = selected;
  }, [selected]);

  async function refreshConversations() {
    try {
      const data = await apiFetch("/api/messages/conversations");
      setConversations(data);
    } catch {
      // conversation list is best-effort — the thread view still works without it
    }
  }

  useEffect(() => {
    async function loadInitial() {
      try {
        const [me, contactList] = await Promise.all([
          apiFetch("/api/auth/me"),
          apiFetch("/api/messages/contacts"),
        ]);
        setCurrentUserId(me.id);
        setContacts(contactList);
        await refreshConversations();
      } catch {
        router.replace("/login");
        return;
      } finally {
        setLoading(false);
      }
    }
    loadInitial();
  }, [router]);

  // Live updates over WebSocket — the backend pushes every new message to
  // both sender and recipient the instant it's created, so this is a true
  // real-time chat rather than polling.
  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;

    const wsUrl = `${API_BASE_URL.replace(/^http/, "ws")}/api/ws/messages?token=${encodeURIComponent(token)}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload?.type !== "message") return;
        const incoming: Message = payload.message;

        const partner = selectedRef.current;
        if (
          partner &&
          (incoming.sender_id === partner.user_id || incoming.recipient_id === partner.user_id)
        ) {
          setMessages((current) => (current.some((m) => m.id === incoming.id) ? current : [...current, incoming]));
        }
        refreshConversations();
      } catch {
        // ignore malformed frames
      }
    };

    return () => {
      ws.close();
      wsRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function openConversation(contact: Contact) {
    setSelected(contact);
    try {
      const data = await apiFetch(`/api/messages?with_user_id=${contact.user_id}`);
      setMessages(data.items ?? []);
      await apiFetch("/api/messages/read", {
        method: "POST",
        body: JSON.stringify({ with_user_id: contact.user_id }),
      });
      refreshConversations();
    } catch {
      setMessages([]);
    }
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!selected || !draft.trim() || sending) return;

    setSending(true);
    try {
      const sent: Message = await apiFetch("/api/messages", {
        method: "POST",
        body: JSON.stringify({ recipient_id: selected.user_id, content: draft.trim() }),
      });
      setMessages((current) => (current.some((m) => m.id === sent.id) ? current : [...current, sent]));
      setDraft("");
      refreshConversations();
    } catch {
      // leave the draft text in place so the user can retry
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return <div className="text-ink-muted">กำลังโหลดข้อความ...</div>;
  }

  // merge: every contact appears, conversations add preview/unread on top
  const list: Conversation[] = contacts.map((c) => {
    const convo = conversations.find((x) => x.user_id === c.user_id);
    return convo ?? { ...c, last_message: null, last_message_at: null, unread_count: 0 };
  });
  list.sort((a, b) => {
    if (!a.last_message_at && !b.last_message_at) return 0;
    if (!a.last_message_at) return 1;
    if (!b.last_message_at) return -1;
    return new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime();
  });

  return (
    <div className="flex h-[calc(100vh-9.5rem)] gap-4">
      <div className={`w-full shrink-0 overflow-y-auto rounded-2xl border border-surface-line bg-surface md:w-80 ${selected ? "hidden md:block" : "block"}`}>
        <div className="border-b border-surface-line p-4">
          <h2 className="text-lg font-bold text-ink">ข้อความ</h2>
          <p className="text-sm text-ink-muted">พูดคุยกับผู้ดูแล ครอบครัว หรือทีมงาน</p>
        </div>

        {list.length === 0 ? (
          <div className="p-5 text-sm text-ink-muted">ยังไม่มีผู้ติดต่อที่คุยด้วยได้</div>
        ) : (
          <div className="divide-y divide-surface-line">
            {list.map((item) => {
              const Icon = roleIcon[item.role] ?? Users;
              const active = selected?.user_id === item.user_id;
              return (
                <button
                  key={item.user_id}
                  type="button"
                  onClick={() => openConversation(item)}
                  className={`flex w-full cursor-pointer items-center gap-3 p-4 text-left transition-colors hover:bg-surface-soft ${active ? "bg-brand-blue-light/40" : ""}`}
                >
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${roleIconClass[item.role] ?? "bg-surface-soft text-ink-muted"}`}>
                    <Icon size={18} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate font-semibold text-ink">{item.name}</span>
                      {item.last_message_at ? (
                        <span className="shrink-0 text-xs text-ink-muted">{formatTime(item.last_message_at)}</span>
                      ) : null}
                    </span>
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm text-ink-muted">{item.last_message ?? "เริ่มการสนทนา"}</span>
                      {item.unread_count > 0 ? (
                        <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-status-red px-1.5 text-xs font-semibold text-white">
                          {item.unread_count}
                        </span>
                      ) : null}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className={`flex min-w-0 flex-1 flex-col rounded-2xl border border-surface-line bg-surface ${selected ? "flex" : "hidden md:flex"}`}>
        {!selected ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 text-ink-muted">
            <MessageCircleOff size={32} />
            <p>เลือกการสนทนาทางซ้ายเพื่อเริ่มแชท</p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 border-b border-surface-line p-4">
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="cursor-pointer rounded-full p-1.5 text-ink-soft hover:bg-surface-soft md:hidden"
              >
                <ArrowLeft size={20} />
              </button>
              <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${roleIconClass[selected.role] ?? "bg-surface-soft text-ink-muted"}`}>
                {(() => {
                  const Icon = roleIcon[selected.role] ?? Users;
                  return <Icon size={16} />;
                })()}
              </span>
              <p className="font-semibold text-ink">{selected.name}</p>
            </div>

            <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
              {messages.length === 0 ? (
                <p className="text-center text-sm text-ink-muted">ยังไม่มีข้อความ เริ่มทักทายกันเลย</p>
              ) : (
                messages.map((m) => {
                  const isMine = m.sender_id === currentUserId;
                  return (
                    <div key={m.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                          isMine ? "bg-brand-blue text-white" : "bg-surface-soft text-ink"
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words">{m.content}</p>
                        <p className={`mt-1 text-right text-[11px] ${isMine ? "text-white/70" : "text-ink-muted"}`}>
                          {formatTime(m.created_at)}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <form onSubmit={handleSend} className="flex items-center gap-2 border-t border-surface-line p-3">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="พิมพ์ข้อความ..."
                className="input-field flex-1"
              />
              <button
                type="submit"
                disabled={!draft.trim() || sending}
                className="btn-primary px-4"
                aria-label="ส่งข้อความ"
              >
                <Send size={18} />
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
