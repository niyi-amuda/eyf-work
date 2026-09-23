import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/server";

export async function POST() {
  const token = (await cookies()).get("eyf_session")?.value;
  if (!token) return NextResponse.json({ message: "Your session has expired. Please enter your EYF Code again." }, { status: 401 });
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("eyf_record_tap_star", { p_token: token });
  if (error || !data?.ok) return NextResponse.json({ message: data?.message || "We couldn't save your game. Please try again." }, { status: 400 });
  return NextResponse.json(data);
}
