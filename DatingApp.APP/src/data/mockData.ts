import { Profile, SuccessStory, PricingPlan, FaqItem } from '../types';

export const mockProfiles: Profile[] = [
  {
    id: 'p1',
    code: 'LK-9021',
    name: 'Dr. Kavinda Perera',
    gender: 'male',
    age: 29,
    height: "5' 10\"",
    profession: 'Medical Officer (MBBS)',
    professionCategory: 'Doctor',
    education: 'MBBS, Faculty of Medicine, Colombo',
    location: 'Colombo 07',
    country: 'Sri Lanka',
    religion: 'Buddhist',
    community: 'Sinhala Govigama',
    verified: true,
    premium: true,
    photoUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?q=80&w=800&auto=format&fit=crop',
    bio: 'Practicing doctor at National Hospital Colombo. Values family, traditional culture, and outdoor hiking. Looking for an educated, caring life partner.',
    aboutFamily: 'Father is a retired civil engineer, mother is a teacher. Younger sister is reading for her degree.',
    horoscopeAvailable: true,
    interests: ['Medicine', 'Hiking', 'Photography', 'Volunteering']
  },
  {
    id: 'p2',
    code: 'LK-8834',
    name: 'Nilushi Senanayake',
    gender: 'female',
    age: 26,
    height: "5' 5\"",
    profession: 'Senior Software Engineer',
    professionCategory: 'IT',
    education: 'BSc (Hons) in Computer Science, University of Moratuwa',
    location: 'Colombo / Remote',
    country: 'Sri Lanka',
    religion: 'Buddhist',
    community: 'Sinhala Govigama',
    verified: true,
    premium: false,
    photoUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=800&auto=format&fit=crop',
    bio: 'Software engineer at a leading US tech firm. Passionate about art, reading, and gentle family lifestyle. Seeking an ambitious and honest professional.',
    aboutFamily: 'Respectable Buddhist family from Kandy. Parents are government pensioners.',
    horoscopeAvailable: true,
    interests: ['Tech & AI', 'Classical Music', 'Cooking', 'Reading']
  },
  {
    id: 'p3',
    code: 'LK-7102',
    name: 'Eng. Amila Fernando',
    gender: 'male',
    age: 31,
    height: "6' 0\"",
    profession: 'Civil Structural Engineer',
    professionCategory: 'Engineer',
    education: 'BSc Eng (Hons) Moratuwa, MSc Melbourne',
    location: 'Melbourne / Colombo',
    country: 'Australia',
    religion: 'Christian',
    community: 'Sinhala',
    verified: true,
    premium: true,
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=800&auto=format&fit=crop',
    bio: 'Chartered civil engineer working in Melbourne with Australian PR. Non-smoker, active athlete, balanced spiritual life. Open to settling in Australia or Sri Lanka.',
    aboutFamily: 'Well-established family in Moratuwa. Both parents are university lecturers.',
    horoscopeAvailable: false,
    interests: ['Cricket', 'Travel', 'Architecture', 'Badminton']
  },
  {
    id: 'p4',
    code: 'LK-6549',
    name: 'Dr. Priya Wickramasinghe',
    gender: 'female',
    age: 28,
    height: "5' 4\"",
    profession: 'Dental Surgeon (BDS)',
    professionCategory: 'Doctor',
    education: 'BDS University of Peradeniya',
    location: 'Kandy',
    country: 'Sri Lanka',
    religion: 'Buddhist',
    community: 'Sinhala',
    verified: true,
    premium: true,
    photoUrl: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?q=80&w=800&auto=format&fit=crop',
    bio: 'Senior Dental Surgeon practicing in Central Province. Enjoys classical singing, traditional culinary arts, and family gatherings.',
    aboutFamily: 'Father is an attorney-at-law, mother manages family tea estate in Nuwara Eliya.',
    horoscopeAvailable: true,
    interests: ['Classical Arts', 'Gardening', 'Travel', 'Health']
  },
  {
    id: 'p5',
    code: 'LK-5921',
    name: 'Sachintha Jayawardena',
    gender: 'male',
    age: 30,
    height: "5' 9\"",
    profession: 'Chartered Accountant (ACA)',
    professionCategory: 'Finance',
    education: 'BSc Finance (USJ), CA Sri Lanka & CIMA Passed Finalist',
    location: 'Colombo',
    country: 'Sri Lanka',
    religion: 'Buddhist',
    community: 'Sinhala',
    verified: true,
    premium: false,
    photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=800&auto=format&fit=crop',
    bio: 'Finance Manager at a multinational conglomerate. Enjoys investment research, swimming, and meaningful conversations with loved ones.',
    aboutFamily: 'Respectable Kandyan family. Father is a retired bank manager.',
    horoscopeAvailable: true,
    interests: ['Economics', 'Swimming', 'Table Tennis', 'Investments']
  },
  {
    id: 'p6',
    code: 'LK-4819',
    name: 'Dileka Ratnayake',
    gender: 'female',
    age: 27,
    height: "5' 6\"",
    profession: 'Attorney-at-Law & LL.M',
    professionCategory: 'Legal',
    education: 'LL.B (Hons) London, Attorney-at-Law Sri Lanka Law College',
    location: 'Colombo 03',
    country: 'Sri Lanka',
    religion: 'Buddhist',
    community: 'Sinhala',
    verified: true,
    premium: true,
    photoUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=800&auto=format&fit=crop',
    bio: 'Corporate counsel at a premier commercial law firm. Lover of literature, world cinema, and volunteering for animal rescue.',
    aboutFamily: 'Prestigious legal and medical family based in Colombo. Both parents are professionals.',
    horoscopeAvailable: true,
    interests: ['Debating', 'Animal Welfare', 'Piano', 'Literature']
  },
  {
    id: 'p7',
    code: 'LK-3944',
    name: 'Dr. Sanjeewa Silva',
    gender: 'male',
    age: 32,
    height: "5' 11\"",
    profession: 'Consultant Radiologist',
    professionCategory: 'Doctor',
    education: 'MBBS, MD (Radiology), FRCR (UK)',
    location: 'London / Colombo',
    country: 'United Kingdom',
    religion: 'Catholic',
    community: 'Sinhala',
    verified: true,
    premium: true,
    photoUrl: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?q=80&w=800&auto=format&fit=crop',
    bio: 'Currently in NHS Fellowship training in London. Values kindness, intellectual curiosity, and balanced work-life harmony.',
    aboutFamily: 'Devout Catholic family from Negombo with strong ethical values.',
    horoscopeAvailable: false,
    interests: ['Medical Research', 'Tennis', 'Jazz', 'Global Travel']
  },
  {
    id: 'p8',
    code: 'LK-2810',
    name: 'Tharushi Alahakoon',
    gender: 'female',
    age: 25,
    height: "5' 3\"",
    profession: 'UX Design Lead & Lecturer',
    professionCategory: 'IT',
    education: 'BSc in Design & Interaction, Singapore',
    location: 'Galle / Colombo',
    country: 'Sri Lanka',
    religion: 'Buddhist',
    community: 'Sinhala',
    verified: true,
    premium: false,
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=800&auto=format&fit=crop',
    bio: 'Creative digital design leader and visiting university lecturer. Loves minimalist aesthetics, coastal road trips, and culinary experiments.',
    aboutFamily: 'Mother is a school principal, father runs a boutique hospitality firm in the South.',
    horoscopeAvailable: true,
    interests: ['UI/UX Design', 'Baking', 'Nature Walks', 'Yoga']
  }
];

export const successStories: SuccessStory[] = [
  {
    id: 's1',
    coupleNames: 'Dr. Ashan & Dr. Tharushi',
    title: 'Our hearts are full of love & mutual respect',
    quote: '"Being medical doctors with round-the-clock emergency shifts, finding someone who genuinely understands the sacrifices of our profession seemed nearly impossible. Through this platform, our families connected respectfully, we matched our values, and today we are happily married for over a year."',
    story: 'Matched in March 2024, married in Colombo with family blessings.',
    weddingDate: 'December 2024',
    location: 'Colombo, Sri Lanka',
    photoUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=800&auto=format&fit=crop',
    professionInfo: 'Consultant Physician & Pediatric Surgeon'
  },
  {
    id: 's2',
    coupleNames: 'Eng. Dilshan & Shenali',
    title: 'Two engineers across continents united',
    quote: '"I was living in Sydney while Shenali was working as a Cloud Architect in Colombo. The verified background and family involvement gave both our parents tremendous peace of mind. We are now building our dream life in Melbourne!"',
    story: 'Long-distance courtship supported by verified identity and sincere family communication.',
    weddingDate: 'September 2025',
    location: 'Melbourne, Australia',
    photoUrl: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=800&auto=format&fit=crop',
    professionInfo: 'Civil Engineer & Cloud Architect'
  },
  {
    id: 's3',
    coupleNames: 'Malik & Dr. Zainab',
    title: 'A blessed partnership founded on shared faith & career goals',
    quote: '"The privacy filters gave us complete dignity. We loved the detailed criteria matching education and religious values. It was seamless from our first verified greeting to our Nikah."',
    story: 'Matched with matching cultural expectations and verified professional credentials.',
    weddingDate: 'November 2025',
    location: 'Kandy, Sri Lanka',
    photoUrl: 'https://images.unsplash.com/photo-1606800052052-a08af7148866?q=80&w=800&auto=format&fit=crop',
    professionInfo: 'Corporate Banker & Medical Registrar'
  }
];

export const communityCategories = [
  {
    title: 'Doctors & Medical Specialists',
    count: '1,450+ Profiles',
    image: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?q=80&w=600&auto=format&fit=crop',
    badge: 'MBBS, MD, Dental, Pharma'
  },
  {
    title: 'Software Engineers & IT Leaders',
    count: '2,920+ Profiles',
    image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=600&auto=format&fit=crop',
    badge: 'Tech Leads, Data Scientists, Architects'
  },
  {
    title: 'Civil & Chartered Engineers',
    count: '1,780+ Profiles',
    image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?q=80&w=600&auto=format&fit=crop',
    badge: 'IESL, Chartered, Mech, Structural'
  },
  {
    title: 'Chartered Accountants & Finance',
    count: '1,230+ Profiles',
    image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=600&auto=format&fit=crop',
    badge: 'CA Sri Lanka, CIMA, CFA, ACCA'
  },
  {
    title: 'Sri Lankan Expats (UK, Aus, USA)',
    count: '3,450+ Profiles',
    image: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=600&auto=format&fit=crop',
    badge: 'PR Holders, Citizens, Overseas Residents'
  },
  {
    title: 'Lawyers & Academic Scholars',
    count: '910+ Profiles',
    image: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?q=80&w=600&auto=format&fit=crop',
    badge: 'Attorneys, Senior Counsel, PhDs'
  }
];

export const pricingPlans: PricingPlan[] = [
  {
    id: 'free',
    name: 'Basic Explorer',
    price: 'LKR 0',
    period: 'Free Forever',
    popular: false,
    description: 'Perfect for creating your profile and exploring verified matches.',
    features: [
      'Create and manage your verified profile',
      'Browse all verified professional singles',
      'Receive matchmaking interests & requests',
      'Limited daily profile views',
      'Standard customer care support'
    ],
    ctaText: 'Get Started Free'
  },
  {
    id: 'premium',
    name: 'Premium Matrimonial',
    price: 'LKR 3,900',
    period: 'for 3 Months (LKR 1,300/mo)',
    popular: true,
    description: 'The most popular plan for active individuals and families seeking serious matches.',
    features: [
      'Everything in Basic Explorer',
      'Unlimited direct messaging & contact requests',
      'View verified phone numbers & parents contact',
      'Complete horoscope matching & Porondam',
      'Priority profile badge & 5x visibility boost',
      'Dedicated relationship helpline'
    ],
    ctaText: 'Upgrade to Premium'
  },
  {
    id: 'vip',
    name: 'Elite VIP Matchmaker',
    price: 'LKR 8,500',
    period: 'for 6 Months',
    popular: false,
    description: 'Bespoke, confidential service with a dedicated matrimonial advisor.',
    features: [
      'Everything in Premium Matrimonial',
      'Dedicated Personal Relationship Matchmaker',
      'Hand-curated monthly match recommendations',
      'Confidential background & degree verification',
      'Private photos only unlocked on mutual approval',
      'Direct family-to-family coordination'
    ],
    ctaText: 'Join Elite VIP'
  }
];

export const faqs: FaqItem[] = [
  {
    id: 'f1',
    question: 'How does profile verification work on this platform?',
    answer: 'Every candidate undergoes a mandatory 3-tier verification check: 1) Government photo identity (NIC/Passport), 2) Professional qualification documents (Medical council registration, Engineering charter, CA membership, University degree), and 3) Active phone number confirmation. Only fully verified profiles receive our verified trust badge.'
  },
  {
    id: 'f2',
    question: 'How is my privacy protected?',
    answer: 'We provide granular privacy controls. You can choose whether your photo is public, visible only to verified logged-in users, or visible strictly upon mutual consent. Your direct phone number and family contact details are never shown publicly and require mutual approval.'
  },
  {
    id: 'f3',
    question: 'Can parents or guardians manage the profile?',
    answer: 'Yes! A significant number of our members have their profiles created and jointly managed by parents, siblings, or guardians. When registering, simply select "Profile for Son/Daughter/Sibling", and both family and candidate details can be included.'
  },
  {
    id: 'f4',
    question: 'Is horoscope compatibility (Porondam) supported?',
    answer: 'Yes. For families who consider traditional astrology, candidates can securely upload birth chart details (Nekatha, Lagna, Rasi). Premium members can generate instant 20 Porondam compatibility reports alongside modern lifestyle matching.'
  },
  {
    id: 'f5',
    question: 'Can I connect with Sri Lankan professionals living abroad?',
    answer: 'Absolutely. We have over 3,500+ active Sri Lankan doctors, software architects, corporate executives, and postgraduates living across Australia, the UK, the United States, Canada, New Zealand, and the UAE.'
  }
];

