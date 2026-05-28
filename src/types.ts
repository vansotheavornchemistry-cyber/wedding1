export interface Admin {
  id: string;
  username: string;
  password?: string;
}

export interface Wedding {
  id: string;
  title: string;
  host_username: string;
  host_password?: string;
  khqr_img_url: string;
  created_at?: string;
}

export interface Guest {
  id: string;
  wedding_id: string;
  name: string;
  phone: string;
  companions: number;
  relation_type: string; // 'ខាងកូនកំលោះ' | 'ខាងកូនក្រមុំ' | 'មិត្តភក្តិ' | 'ផ្សេងៗ'
  amount: number;
  note: string;
  status: 'pending' | 'approved';
  created_at?: string;
}
