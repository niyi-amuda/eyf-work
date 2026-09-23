export type Checkin = { day: string; checked_in_at: string | null };
export type Win = {
  id: string; reward_type: string; reward_label: string; created_at: string;
  claim_status: "pending"|"claimed"; can_claim: boolean;
};
export type Experience = {
  registration_id: string; registration_no: string; full_name: string; branch: string;
  paid: boolean; payment_verified: boolean; payment_status: "PAYMENT VERIFIED" | "PAYMENT PENDING"; points: number; games_played: number; checkins: Checkin[]; wins: Win[];
};
