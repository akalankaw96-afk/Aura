export interface ProfileKycDetails {
  displayName?: string | null;
  createdBy?: string | null;
  civilStatus?: string | null;
  district?: string | null;
  caste?: string | null;
  zodiacSign?: string | null;
  monthlySalaryRange?: string | null;
  weightKg?: string | null;
}

export interface Profile {
  id: string;
  code: string;
  name: string;
  gender: 'female' | 'male';
  age: number;
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

