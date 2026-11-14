export interface ProfileKycDetails {
  displayName?: string | null;
  createdBy?: string | null;
  civilStatus?: string | null;
  district?: string | null;
  caste?: string | null;
  zodiacSign?: string | null;
  monthlySalaryRange?: string | null;
  weightKg?: string | null;
  /** Myself / Son / Daughter … (sign-up step 1) */
  profileFor?: string | null;
  /** private — only returned in the member's own profile */
  whatsApp?: string | null;
}

export interface Profile {
  id: string;
  code: string;
  name: string;
  gender: 'female' | 'male';
  age: number;
  /** "yyyy-MM-dd" — only in the member's own profile */
  dateOfBirth?: string | null;
  height: string;
  profession: string;
  professionCategory: 'Doctor' | 'Engineer' | 'IT' | 'Finance' | 'Legal' | 'Business' | 'Other';
  education: string;
  location: string;
  country: string;
  religion: string;
  community: string;
  verified: boolean;
  premium: boolean;
  photoUrl: string;
  bio: string;
  aboutFamily: string;
  horoscopeAvailable: boolean;
  interests: string[];
  details?: ProfileKycDetails | null;
}

export interface SuccessStory {
  id: string;
  coupleNames: string;
  title: string;
  quote: string;
  story: string;
  weddingDate: string;
  location: string;
  photoUrl: string;
  professionInfo: string;
}

export interface PricingPlan {
  id: string;
  name: string;
  price: string;
  period: string;
  popular: boolean;
  description: string;
  features: string[];
  ctaText: string;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}


/** An interest between two members (API MatchRequestDto). */
export interface MatchRequest {
  id: string;
  senderProfileId: string;
  senderName: string;
  senderProfession: string;
  senderPhotoUrl: string;
  receiverProfileId: string;
  receiverName: string;
  status: 'Pending' | 'Accepted' | 'Declined';
  note?: string | null;
  createdAt: string;
}
