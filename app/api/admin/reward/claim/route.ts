import { NextResponse } from "next/server";
import { createClient } from "@/lib/server";
export async function POST(req: Request) {
  try {
    const { winId } = await req.json();
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("eyf_admin_claim_win_v2", { p_win_id: winId });
    if (error) return NextResponse.json({ message: error.message === "unauthorized" ? "You do not have permission to access this area." : "The reward could not be claimed." }, { status: error.message === "unauthorized" ? 403 : 400 });
    if (!data?.ok) return NextResponse.json(data, { status: 400 });
    return NextResponse.json(data);
  } catch { return NextResponse.json({ message: "The reward could not be claimed." }, { status: 400 }); }
}
