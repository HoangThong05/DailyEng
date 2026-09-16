import Anthropic from "@anthropic-ai/sdk";
import {
  AI_DAILY_LIMIT,
  AI_HISTORY_TURNS,
  AI_MAX_MESSAGE_CHARS,
  AI_MAX_OUTPUT_TOKENS,
  AI_MINUTE_LIMIT,
  AI_SYSTEM_PROMPT,
  aiProvider,
  CLAUDE_MODEL,
  type ChatTurn,
  countAiLastMinute,
  countAiToday,
  getAiQuota,
  streamGemini,
  type Usage,
} from "@/lib/ai";
import { todayInAppZone } from "@/lib/leitner";
import { createClient, getCurrentUser } from "@/lib/supabase/server";

export const runtime = "nodejs";
/** Phản hồi dài có thể mất vài chục giây khi stream. */
export const maxDuration = 60;

function bad(status: number, error: string) {
  return Response.json({ error }, { status });
}

/** Hạn mức còn lại, cho widget con vịt hiện số trước khi hỏi. */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ enabled: false, used: 0, limit: AI_DAILY_LIMIT });
  return Response.json(await getAiQuota());
}

/**
 * POST { messages: [{role, content}] } → stream chữ thuần (text/plain).
 * Khoá API chỉ ở server; client không bao giờ thấy. Mỗi lần gọi thành công
 * ghi một dòng ai_chat_log để đếm hạn mức ngày.
 */
export async function POST(request: Request) {
  const provider = aiProvider();
  if (!provider) return bad(503, "Tính năng Hỏi AI chưa được bật.");

  const user = await getCurrentUser();
  if (!user) return bad(401, "Bạn cần đăng nhập.");

  let body: { messages?: ChatTurn[] };
  try {
    body = await request.json();
  } catch {
    return bad(400, "Dữ liệu không hợp lệ.");
  }

  const history: ChatTurn[] = (body.messages ?? [])
    .filter(
      (m): m is ChatTurn =>
        !!m &&
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string" &&
        m.content.trim().length > 0,
    )
    .slice(-AI_HISTORY_TURNS)
    .map((m) => ({ role: m.role, content: m.content.slice(0, AI_MAX_MESSAGE_CHARS) }));

  if (history.length === 0 || history[history.length - 1].role !== "user") {
    return bad(400, "Chưa có câu hỏi.");
  }

  const [used, lastMinute] = await Promise.all([countAiToday(), countAiLastMinute()]);
  if (used >= AI_DAILY_LIMIT) {
    return bad(429, `Hôm nay bạn đã dùng hết ${AI_DAILY_LIMIT} tin. Mai hỏi tiếp nhé.`);
  }
  if (lastMinute >= AI_MINUTE_LIMIT) {
    return bad(429, "Bạn hỏi hơi nhanh — đợi khoảng một phút rồi hỏi tiếp nhé.");
  }

  const supabase = await createClient();
  const day = todayInAppZone();
  const encoder = new TextEncoder();

  async function log(usage: Usage) {
    await supabase.from("ai_chat_log").insert({
      user_id: user!.id,
      day,
      input_tokens: usage.input,
      output_tokens: usage.output,
    });
  }

  const readable = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        if (provider === "gemini") {
          let usage: Usage = { input: 0, output: 0 };
          for await (const text of streamGemini(history, (u) => (usage = u))) {
            controller.enqueue(encoder.encode(text));
          }
          await log(usage);
        } else {
          const client = new Anthropic();
          const stream = client.messages.stream({
            model: CLAUDE_MODEL,
            max_tokens: AI_MAX_OUTPUT_TOKENS,
            system: AI_SYSTEM_PROMPT,
            messages: history,
          });
          for await (const event of stream) {
            if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
              controller.enqueue(encoder.encode(event.delta.text));
            }
          }
          const final = await stream.finalMessage();
          await log({ input: final.usage.input_tokens, output: final.usage.output_tokens });
        }
      } catch (error) {
        console.error("ai chat:", error);
        // Thông báo đã dịch sang tiếng Việt ở lib/ai.ts; log giữ bản gốc của Google.
        const detail = error instanceof Error ? error.message.slice(0, 200) : "";
        controller.enqueue(
          encoder.encode(`\n\n[${detail || "Có lỗi khi trả lời. Thử lại nhé."}]`),
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Ai-Used": String(used + 1),
      "X-Ai-Limit": String(AI_DAILY_LIMIT),
    },
  });
}
