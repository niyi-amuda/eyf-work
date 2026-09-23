import { NextResponse } from "next/server";
import { createClient } from "@/lib/server";
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("eyf_admin_spin_v2", { p_reward_type: body.rewardType, p_reward_label: body.rewardLabel });
    if (error) return NextResponse.json({ message: error.message === "unauthorized" ? "You do not have permission to access this area." : "We couldn't complete the draw. No reward was recorded." }, { status: error.message === "unauthorized" ? 403 : 400 });
    return NextResponse.json(data);
  } catch { return NextResponse.json({ message: "We couldn't complete the draw. No reward was recorded." }, { status: 400 }); }
}
