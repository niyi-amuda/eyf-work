import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/server";

// Backwards-compatible game endpoint. It never accepts a client-supplied score.
export async function POST(req: Request) {
  const token = (await cookies()).get("eyf_session")?.value;
  if (!token) return NextResponse.json({ message: "Your session has expired." }, { status: 401 });
  try {
    const body = await req.json();
    const game = body?.game;
    const supabase = await createClient();
    if (game === "tap_star") {
      const { data, error } = await supabase.rpc("eyf_record_tap_star", { p_token: token });
      if (error || !data?.ok) return NextResponse.json({ message: data?.message || "We couldn't save your game. Please try again." }, { status: 400 });
      return NextResponse.json(data);
    }
    if (game === "bible_quiz") {
      const questionId = typeof body?.questionId === "string" ? body.questionId : "";
      const answer = typeof body?.answer === "string" ? body.answer.toUpperCase() : "";
      if (!questionId || !["A", "B", "C", "D"].includes(answer)) return NextResponse.json({ message: "Invalid quiz answer." }, { status: 400 });
      const { data, error } = await supabase.rpc("eyf_submit_quiz_answer", { p_token: token, p_question_id: questionId, p_answer: answer });
      if (error || !data?.ok) return NextResponse.json({ message: data?.message || "We couldn't save that answer. Please try again." }, { status: 400 });
      return NextResponse.json(data);
    }
    return NextResponse.json({ message: "Invalid game action." }, { status: 400 });
  } catch {
    return NextResponse.json({ message: "We couldn't save your game. Please try again." }, { status: 400 });
  }
}
