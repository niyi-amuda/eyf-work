import { NextResponse } from "next/server";
import { createClient } from "@/lib/server";
export async function POST(req:Request){
 const {code,paid}=await req.json(); const supabase=await createClient();
 const {data,error}=await supabase.rpc("eyf_admin_set_paid_v2",{p_code:code,p_paid:Boolean(paid)});
 if(error||!data?.ok)return NextResponse.json({message:data?.message||"Payment status could not be changed."},{status:400}); return NextResponse.json(data);
}
