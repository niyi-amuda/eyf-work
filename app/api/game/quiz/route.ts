import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/server";

export async function POST(req: Request) {
  const token = (await cookies()).get("eyf_session")?.value;
  if (!token) return NextResponse.json({ message: "Your session has expired. Please enter your EYF Code again." }, { status: 401 });
  try {
    const body = await req.json();
    const questionId = typeof body?.questionId === "string" ? body.questionId : "";
    const answer = typeof body?.answer === "string" ? body.answer.toUpperCase() : "";
    if (!questionId || !["A", "B", "C", "D"].includes(answer)) return NextResponse.json({ message: "Invalid quiz answer." }, { status: 400 });
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("eyf_submit_quiz_answer", { p_token: token, p_question_id: questionId, p_answer: answer });
    if (error || !data?.ok) return NextResponse.json({ message: data?.message || "We couldn't save that answer. Please try again." }, { status: 400 });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ message: "We couldn't save that answer. Please try again." }, { status: 400 });
  }
}
