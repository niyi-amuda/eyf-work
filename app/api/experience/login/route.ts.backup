import { NextResponse } from "next/server";
import { createClient } from "@/lib/server";

export async function POST(req: Request) {
  try {
    const { code } = await req.json();
    if (typeof code !== "string" || !/^EYF[-\s]*\d{1,5}$/i.test(code.trim())) {
      return NextResponse.json({message:"Please enter a valid EYF Code."},{status:400});
    }
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("eyf_experience_login", { p_code: code.trim() });
    if (error || !data?.ok) return NextResponse.json({message:data?.message||"EYF Code not found. Please check your code and try again."},{status:401});
    const res = NextResponse.json({ok:true});
    res.cookies.set("eyf_session", data.token, {httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"lax",path:"/",maxAge:60*60*8});
    return res;
  } catch { return NextResponse.json({message:"We couldn't connect right now. Please try again."},{status:500}); }
}
