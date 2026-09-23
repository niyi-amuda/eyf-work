import { NextResponse } from "next/server";
import { createClient } from "@/lib/server";
export async function GET(){
 const supabase=await createClient(); const {data,error}=await supabase.rpc("eyf_admin_overview_v2");
 if(error)return NextResponse.json({message:"Unable to load admin overview."},{status:403}); return NextResponse.json(data);
}
