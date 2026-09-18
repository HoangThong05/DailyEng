"use client";

import { useEffect, useRef, useState } from "react";
import { Mascot } from "@/app/_components/mascot";
import { SparkleIcon } from "@/app/_components/icons";

export type ChatMessage = { role: "user" | "assistant"; content: string };

/**
 * Hội thoại lưu tạm trong sessionStorage: tải lại trang hay chuyển qua lại
 * giữa khung nổi và trang /hoi-ai vẫn còn mạch. Đóng tab là mất — không gửi
 * lên máy chủ, đúng như Chính sách quyền riêng tư.
 */
const STORAGE_KEY = "dailyeng-ai-chat";
/** Giữ tối đa ngần này lượt cho nhẹ. */
const KEEP = 20;

function loadMessages(): ChatMessage[] {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ChatMessage[];
    return Array.isArray(parsed)
      ? parsed.filter(
          (m) =>
            m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string",
        )
      : [];
  } catch {
    return [];
  }
}

function saveMessages(messages: ChatMessage[]) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-KEEP)));
  } catch {
    // Chế độ ẩn danh có thể chặn — chỉ mất lịch sử tạm, không sao.
  }
}

type Props = {
  used: number;
  limit: number;
  /** Câu hỏi mở sẵn từ nút "Hỏi AI" ở thẻ học; tự gửi khi mở. */
  initialQuestion?: string;
  name: string;
  /** "page" = trang riêng, "panel" = trong khung nổi của con vịt. */
  variant?: "page" | "panel";
};

const QUICK = [
  "Phân biệt “affect” và “effect”",
  "Cho 3 câu ví dụ với “look forward to”",
  "Khi nào dùng “have been” và “had been”?",
  "Sửa câu: I have went to school yesterday",
  "Hỏi tôi một câu tiếng Anh về sở thích",
];

/**
 * Mô hình thỉnh thoảng trả về LaTeX (\\rightarrow, $...$, \\text{...}) dù prompt đã
 * cấm. Đổi các ký hiệu hay gặp thành ký tự thường rồi bỏ dấu $ còn sót, để
 * người học không phải đọc mã lạ.
 */
const LATEX: [RegExp, string][] = [
  [/\\(?:rightarrow|to|Rightarrow)\b/g, "→"],
  [/\\(?:leftarrow|gets|Leftarrow)\b/g, "←"],
  [/\\times\b/g, "×"],
  [/\\approx\b/g, "≈"],
  [/\\neq\b/g, "≠"],
  [/\\l?dots\b/g, "…"],
  [/\\(?:quad|qquad|;|,)/g, " "],
  [/\\(?:text|mathrm|mathbf|textbf)\{([^}]*)\}/g, "$1"],
];

function clean(text: string) {
  let out = text;
  for (const [pattern, replacement] of LATEX) out = out.replace(pattern, replacement);
  // Bỏ cặp $...$ bao quanh, giữ lại nội dung bên trong.
  out = out.replace(/\$\$?([^$]*)\$\$?/g, "$1");
  return out.replace(/[ \t]{2,}/g, " ");
}

/**
 * Vẽ câu trả lời: chỉ hỗ trợ **in đậm**, *nghiêng* và gạch đầu dòng — đủ cho
 * gia sư, không cần thư viện markdown.
 */
function Rich({ text }: { text: string }) {
  return (
    <div className="space-y-1.5 text-sm leading-relaxed">
      {clean(text)
        .split("\n")
        .map((line, i) => {
          const bullet = /^\s*[-•*]\s+/.test(line);
          const body = bullet ? line.replace(/^\s*[-•*]\s+/, "") : line;
          if (!body.trim()) return <div key={i} className="h-1" />;
          // **đậm** và *nghiêng*; không cần thư viện markdown.
          const parts = body.split(/(\*\*[^*]+\*\*|\*[^*\n]+\*)/g).map((part, k) => {
            if (part.startsWith("**") && part.endsWith("**")) {
              return <strong key={k}>{part.slice(2, -2)}</strong>;
            }
            if (part.length > 2 && part.startsWith("*") && part.endsWith("*")) {
              return (
                <em key={k} className="text-muted">
                  {part.slice(1, -1)}
                </em>
              );
            }
            return <span key={k}>{part}</span>;
          });
          return bullet ? (
            <p key={i} className="flex gap-2 pl-1">
              <span className="text-brand shrink-0">•</span>
              <span>{parts}</span>
            </p>
          ) : (
            <p key={i}>{parts}</p>
          );
        })}
    </div>
  );
}

export function AiChat({
  used: initialUsed,
  limit,
  initialQuestion,
  name,
  variant = "page",
}: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [restored, setRestored] = useState(false);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [used, setUsed] = useState(initialUsed);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const autoSent = useRef(false);

  const panel = variant === "panel";
  const left = Math.max(0, limit - used);

  // Nạp lại hội thoại cũ sau khi hydrate (sessionStorage chỉ có ở trình duyệt).
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const saved = loadMessages();
      if (saved.length > 0) setMessages(saved);
      setRestored(true);
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    // Chỉ lưu khi đã nạp xong và câu trả lời đã chạy hết, tránh ghi đè bằng mảng rỗng.
    if (restored && !busy) saveMessages(messages);
  }, [messages, restored, busy]);

  useEffect(() => {
    if (initialQuestion && !autoSent.current) {
      autoSent.current = true;
      const frame = requestAnimationFrame(() => void send(initialQuestion));
      return () => cancelAnimationFrame(frame);
    }
    // send đọc state hiện tại; chỉ chạy lần đầu.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuestion]);

  async function send(text: string) {
    const question = text.trim();
    if (!question || busy) return;
    if (left <= 0) {
      setError(`Hôm nay đã dùng hết ${limit} tin. Mai hỏi tiếp nhé.`);
      return;
    }
    setError(null);
    setInput("");
    const history: ChatMessage[] = [...messages, { role: "user", content: question }];
    setMessages([...history, { role: "assistant", content: "" }]);
    setBusy(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
      });
      if (!res.ok || !res.body) {
        const data = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        setMessages(history);
        setError(data?.error ?? "Không gọi được AI. Thử lại nhé.");
        return;
      }
      setUsed(Number(res.headers.get("X-Ai-Used") ?? used + 1));

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let answer = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        answer += decoder.decode(value, { stream: true });
        const snapshot = answer;
        setMessages([...history, { role: "assistant", content: snapshot }]);
      }
      // Kết nối đóng mà chưa nhận được chữ nào (máy chủ bị cắt giữa chừng).
      if (!answer.trim()) {
        setMessages(history);
        setError("Máy chủ AI không trả lời kịp. Thử hỏi lại nhé.");
      }
    } catch {
      setMessages(history);
      setError("Mất kết nối giữa chừng. Thử lại nhé.");
    } finally {
      setBusy(false);
      inputRef.current?.focus();
    }
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void send(input);
    }
  }

  return (
    <div
      className={
        panel ? "flex min-h-0 flex-1 flex-col" : "flex min-h-[60dvh] flex-col px-5 pt-2 pb-4"
      }
    >
      <div
        className={
          panel ? "min-h-0 flex-1 space-y-3 overflow-y-auto px-3 py-3" : "flex-1 space-y-3"
        }
      >
        {messages.length === 0 ? (
          <div className={panel ? "" : "border-border bg-card rounded-3xl border p-5"}>
            <div className="flex items-center gap-3">
              <Mascot variant="ai" size={panel ? 64 : 84} className="shrink-0" />
              <div className="text-sm leading-relaxed">
                <p className="font-semibold">Chào {name}, mình ở đây để giúp bạn học tiếng Anh.</p>
                <p className="text-muted mt-1">
                  Cứ hỏi thoải mái: nghĩa từ, ngữ pháp, sửa câu, giải thích đáp án TOEIC, hay luyện
                  hội thoại.
                </p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {QUICK.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => void send(q)}
                  className="border-border bg-bg hover:border-brand/60 hover:text-brand rounded-full border px-3 py-1.5 text-left text-xs font-medium transition-colors press"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {messages.map((message, i) => (
          <div
            key={i}
            className={`flex items-end gap-2 ${message.role === "user" ? "justify-end" : ""}`}
          >
            {message.role === "assistant" ? (
              // Chưa có chữ = đang soạn → vịt đổi sang tư thế suy nghĩ.
              <Mascot
                variant={message.content ? "ai-tron" : "ai-nghi"}
                size={34}
                className="mb-1 shrink-0 rounded-lg"
              />
            ) : null}
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                message.role === "user"
                  ? "bg-brand rounded-br-md text-white"
                  : "border-border bg-card rounded-bl-md border"
              }`}
            >
              {message.role === "user" ? (
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              ) : message.content ? (
                <Rich text={message.content} />
              ) : (
                <span className="text-muted flex gap-1 text-sm" aria-label="Đang trả lời">
                  <span className="animate-bounce">•</span>
                  <span className="animate-bounce [animation-delay:120ms]">•</span>
                  <span className="animate-bounce [animation-delay:240ms]">•</span>
                </span>
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {error ? (
        <p
          role="alert"
          className={`text-sm font-medium text-red-500 ${panel ? "px-3 pb-1" : "mt-3"}`}
        >
          {error}
        </p>
      ) : null}

      {messages.length > 0 ? (
        <button
          type="button"
          onClick={() => {
            setMessages([]);
            saveMessages([]);
            setError(null);
          }}
          className={`text-muted hover:text-brand self-end text-xs font-semibold ${panel ? "pr-3 pb-1" : "mt-3"}`}
        >
          Xoá hội thoại
        </button>
      ) : null}

      <form
        onSubmit={(event) => {
          event.preventDefault();
          void send(input);
        }}
        className={
          panel
            ? "border-border flex shrink-0 items-end gap-2 border-t p-2"
            : "border-border bg-card sticky bottom-[calc(4rem+env(safe-area-inset-bottom))] mt-4 flex items-end gap-2 rounded-2xl border p-2 md:bottom-4"
        }
      >
        <textarea
          ref={inputRef}
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={onKeyDown}
          rows={1}
          placeholder={left > 0 ? "Hỏi về một từ, một câu…" : "Hết lượt hôm nay"}
          disabled={busy || left <= 0}
          aria-label="Câu hỏi"
          className="max-h-32 min-h-11 flex-1 resize-none bg-transparent px-3 py-2.5 text-sm outline-none"
        />
        <button
          type="submit"
          disabled={busy || !input.trim() || left <= 0}
          className="bg-brand flex h-11 shrink-0 items-center gap-1.5 rounded-xl px-4 text-sm font-bold text-white press disabled:opacity-50"
        >
          <SparkleIcon className="h-4 w-4" />
          Hỏi
        </button>
      </form>
      <p
        className={`text-muted text-xs tabular-nums ${panel ? "px-3 pb-2 text-center" : "mt-2 text-right"}`}
      >
        Còn {left}/{limit} tin hôm nay
        {panel ? "" : " · Enter để gửi, Shift+Enter xuống dòng"}
      </p>
    </div>
  );
}
