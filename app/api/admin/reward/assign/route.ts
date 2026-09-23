import { NextResponse } from "next/server";
import { createClient } from "@/lib/server";
export async function POST(req:Request){
 const {code,rewardType,rewardLabel}=await req.json();
 if(!code||!rewardLabel)return NextResponse.json({message:"Code and reward are required."},{status:400});
 const supabase=await createClient(); const {data,error}=await supabase.rpc("eyf_admin_assign_reward_v2",{p_code:code,p_reward_type:rewardType,p_reward_label:rewardLabel});
 if(error||!data?.ok)return NextResponse.json({message:data?.message||"Reward could not be recorded."},{status:403}); return NextResponse.json(data);
}
