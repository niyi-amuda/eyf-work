import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/server";
export async function GET(req:Request){
 const token=(await cookies()).get("eyf_session")?.value;
 const supabase=await createClient();
 if(new URL(req.url).searchParams.get("view")==="leaderboard"){
   const {data,error}=await supabase.rpc("eyf_experience_leaderboard");
   if(error)return NextResponse.json({message:"Unable to load leaderboard."},{status:500}); return NextResponse.json(data||[]);
 }
 if(!token)return NextResponse.json({message:"Not signed in."},{status:401});
 const {data,error}=await supabase.rpc("eyf_experience_me",{p_token:token});
 if(error||!data?.ok)return NextResponse.json({message:"Your session has expired. Please enter your EYF Code again."},{status:401});
 return NextResponse.json(data);
}
