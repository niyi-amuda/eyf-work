import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/server";
export async function POST(){
 const token=(await cookies()).get("eyf_session")?.value;
 if(token){const supabase=await createClient();await supabase.rpc("eyf_experience_logout",{p_token:token});}
 const res=NextResponse.json({ok:true});res.cookies.set("eyf_session","",{httpOnly:true,expires:new Date(0),path:"/"});return res;
}
