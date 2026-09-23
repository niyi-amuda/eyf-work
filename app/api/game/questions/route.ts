import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/server";

export async function GET(req: Request) {
  const token = (await cookies()).get("eyf_session")?.value;
  if (!token) return NextResponse.json({ message: "Your session has expired. Please enter your EYF Code again." }, { status: 401 });
  const limit = Math.min(50, Math.max(1, Number(new URL(req.url).searchParams.get("limit") || 10)));
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("eyf_get_quiz_questions_for_session", { p_token: token, p_limit: limit });
  if (error) return NextResponse.json({ message: "We could not load the quiz right now." }, { status: 500 });
  return NextResponse.json({ questions: data || [] });
}
