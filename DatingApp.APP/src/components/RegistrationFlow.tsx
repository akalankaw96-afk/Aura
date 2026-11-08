'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Heart,
  ShieldCheck,
  Check,
  Eye,
  EyeOff,
  Camera,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Phone,
  Mail,
  Lock,
  User,
  CheckCircle2,
  HelpCircle,
  Upload,
  Calendar,
  MapPin,
  Briefcase,
  GraduationCap
} from 'lucide-react';
import { apiService, AuthSession, CreateProfilePayload } from '../services/api';
import { Profile } from '../types';
import { DecorativeHeartBackground } from './DecorativeHeartBackground';

interface RegistrationFlowProps {
  initialScreen?: 'login' | 'register';
  targetProfile?: Profile | null;
  onFinished?: (session: AuthSession, profile: Profile) => void;
  isModal?: boolean;
  onClose?: () => void;
}

export const RegistrationFlow: React.FC<RegistrationFlowProps> = ({
  initialScreen = 'register',
  targetProfile = null,
  onFinished,
  isModal = false,
  onClose,
}) => {
  const router = useRouter();

  // Screen flow:
  // 1: Login
  // 2: Register - 1 Account
  // 3: Register - 2 Verify
  // 4: Register - 3 Profile
  // 5: Register - 4 Photos
  // 6: Welcome - Profile Live
  const [currentScreen, setCurrentScreen] = useState<number>(initialScreen === 'login' ? 1 : 2);

  // Form State - Account (Screen 1 & 2)
  const [profileFor, setProfileFor] = useState<'Self' | 'Son' | 'Daughter' | 'Brother' | 'Sister'>('Self');
  const [gender, setGender] = useState<'female' | 'male'>('female');
  const [phoneNumber, setPhoneNumber] = useState('+94 77 123 4567');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);

  // Form State - Verify OTP (Screen 3)
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [demoOtpCode, setDemoOtpCode] = useState('123456');
  const [countdown, setCountdown] = useState(45);

  // Form State - Profile (Screen 4)
  const [fullName, setFullName] = useState('');
  const [age, setAge] = useState(27);
  const [height, setHeight] = useState("5' 6\"");
  const [religion, setReligion] = useState('Buddhist');
  const [community, setCommunity] = useState('Govigama');
  const [location, setLocation] = useState('Colombo');
  const [country, setCountry] = useState('Sri Lanka');
  const [profession, setProfession] = useState('Software Architect');
  const [professionCategory, setProfessionCategory] = useState<'Doctor' | 'Engineer' | 'IT' | 'Finance' | 'Legal' | 'Business' | 'Other'>('IT');
  const [education, setEducation] = useState('BSc (Hons) in Computer Science');
  const [university, setUniversity] = useState('University of Moratuwa');
  const [bio, setBio] = useState('Grounded, ambitious professional who values Buddhist heritage, family integrity, and work-life balance.');
  const [aboutFamily, setAboutFamily] = useState('Father is a retired civil engineer, mother is a teacher. Respectable family from Colombo.');
  const [horoscopeAvailable, setHoroscopeAvailable] = useState(true);

  // Form State - Photos (Screen 5)
  const [primaryPhotoUrl, setPrimaryPhotoUrl] = useState(
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=800&auto=format&fit=crop'
  );
  const [extraPhotos, setExtraPhotos] = useState<string[]>([
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=800&auto=format&fit=crop'
  ]);

  // Photo Privacy State (Screen 5)
  const [photoPrivacy, setPhotoPrivacy] = useState<'public' | 'blurred'>('public');

  // Login Protection & Lockout State (Flow 1: 3 fails -> locked 15 min)
  const [failedLoginAttempts, setFailedLoginAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [loginMode, setLoginMode] = useState<'password' | 'otp'>('password');

  // Session & Result (Screen 6)
  const [activeSession, setActiveSession] = useState<AuthSession | null>(null);
  const [createdProfile, setCreatedProfile] = useState<Profile | null>(null);

  // Loading & Error States
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Curated photo choices for quick selection
  const curatedAvatars = [
    { label: 'Bride 1', url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=800&auto=format&fit=crop', gender: 'female' },
    { label: 'Bride 2 (Doctor)', url: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?q=80&w=800&auto=format&fit=crop', gender: 'female' },
    { label: 'Bride 3 (Creative)', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=800&auto=format&fit=crop', gender: 'female' },
    { label: 'Groom 1', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=800&auto=format&fit=crop', gender: 'male' },
    { label: 'Groom 2 (Executive)', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=800&auto=format&fit=crop', gender: 'male' },
    { label: 'Groom 3 (Doctor)', url: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?q=80&w=800&auto=format&fit=crop', gender: 'male' },
  ];

  // Helper for Stepper (Screens 2 through 6)
  const steps = [
    { num: 1, label: 'Account' },
    { num: 2, label: 'Verify' },
    { num: 3, label: 'Profile' },
    { num: 4, label: 'Photos' },
  ];

  // 1. Handle Login (Flowchart: mobile/password or OTP -> Credentials valid? -> 3 fails lock 15 min -> Account status)
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (isLocked) {
      setErrorMsg('3 fails - locked for 15 minutes for your security. Please sign in with Phone OTP or contact support.');
      return;
    }

    setLoading(true);

    try {
      if (!email.trim() || !password.trim()) {
        throw new Error('Please enter your registered email and password.');
      }

      const session = await apiService.login({ email: email.trim(), password });
      
      // Flowchart Account status: Active vs Suspended / Banned
      if (session.role === 'Banned' || session.role === 'Suspended') {
        throw new Error('Account suspended / banned - please contact matrimonial support at 011 234 5678.');
      }

      setFailedLoginAttempts(0);
      setActiveSession(session);

      if (session.hasCompletedProfile && session.profileId) {
        const prof = await apiService.getProfileById(session.profileId);
        if (prof) setCreatedProfile(prof);
      }

      setSuccessMsg('Login successful! Welcome back.');
      setTimeout(() => {
        if (onFinished && createdProfile) {
          onFinished(session, createdProfile);
        } else {
          router.push('/');
        }
      }, 1000);
    } catch (err: any) {
      const nextFails = failedLoginAttempts + 1;
      setFailedLoginAttempts(nextFails);

      if (nextFails >= 3) {
        setIsLocked(true);
        setErrorMsg('3 fails - locked for 15 minutes for your security. Please use Phone OTP to sign in or contact support.');
      } else {
        setErrorMsg(err.message || `Wrong credentials - try again (${3 - nextFails} attempt${3 - nextFails === 1 ? '' : 's'} left before 15 min lock).`);
      }
    } finally {
      setLoading(false);
    }
  };

  // 2. Handle Register - Screen 2 Submit (Send OTP)
  const handleAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!phoneNumber.trim()) {
      setErrorMsg('Please enter a valid phone number.');
      return;
    }
    if (!email.trim()) {
      setErrorMsg('Please provide your email address.');
      return;
    }
    if (!password.trim() || password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }
    if (!agreeTerms) {
      setErrorMsg('Please accept the Terms of Use and Privacy Policy.');
      return;
    }

    setLoading(true);
    try {
      const res = await apiService.sendOtp(phoneNumber);
      if (res.demoOtp) {
        setDemoOtpCode(res.demoOtp);
        const chars = res.demoOtp.split('');
        setOtpDigits(chars);
      }
      setCurrentScreen(3); // Move to Screen 3: Verify
    } catch (err: any) {
      setErrorMsg(err.message || 'Error sending verification code.');
    } finally {
      setLoading(false);
    }
  };

  // 3. Handle Verify OTP - Screen 3 Submit
  const handleVerifyOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const code = otpDigits.join('');

    if (code.length < 4) {
      setErrorMsg('Please enter the verification code.');
      return;
    }

    setLoading(true);
    try {
      const sess = await apiService.verifyOtp(phoneNumber, code, fullName || 'New Member');
      setActiveSession(sess);
      setCurrentScreen(4); // Move to Screen 4: Profile
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid verification code. Please try 123456 or the code shown.');
    } finally {
      setLoading(false);
    }
  };

  // 4. Handle Profile Details - Screen 4 Submit (Flowchart: Age 18+? -> Under 18 blocked)
  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Flowchart validation: Age 18+?
    const ageNum = Number(age);
    if (!ageNum || ageNum < 18) {
      setErrorMsg('Under 18 - registration blocked. Sri Lankan matrimonial law requires applicants to be at least 18 years old.');
      return;
    }

    if (!fullName.trim()) {
      setErrorMsg('Please enter your full name.');
      return;
    }
    if (!profession.trim()) {
      setErrorMsg('Please specify your profession.');
      return;
    }

    // Set default avatar based on gender if not set
    if (!primaryPhotoUrl) {
      setPrimaryPhotoUrl(
        gender === 'female'
          ? 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=800&auto=format&fit=crop'
          : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=800&auto=format&fit=crop'
      );
    }

    setCurrentScreen(5); // Move to Screen 5: Photos
  };

  // 5. Handle Photos & Final Submit - Screen 5 Submit
  const handlePhotosSubmit = async () => {
    setErrorMsg(null);
    setLoading(true);

    try {
      const payload: CreateProfilePayload = {
        fullName: fullName.trim() || 'Aura Member',
        gender,
        age: Number(age) || 28,
        height,
        profession: profession.trim(),
        professionCategory,
        education: education.trim(),
        university: university.trim(),
        location: location.trim(),
        country,
        religion,
        community,
        bio: bio.trim(),
        aboutFamily: aboutFamily.trim(),
        horoscopeAvailable,
        photoUrl: primaryPhotoUrl,
        interests: ['Travel', 'Reading', 'Family Gathering', 'Badminton'],
      };

      const saved = await apiService.createOrUpdateProfile(payload);
      setCreatedProfile(saved);

      const sess = activeSession || {
        token: 'active-token',
        userId: 'usr-1',
        fullName: payload.fullName,
        email: email || 'member@auramatrimony.lk',
        role: 'Member',
        hasCompletedProfile: true,
        profileId: saved.id,
      };
      setActiveSession(sess);

      // Transition to Screen 6: Welcome Live!
      setCurrentScreen(6);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error saving profile to database. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DecorativeHeartBackground isModal={isModal} showBottomHill={true}>

      {/* Top Header */}
      <header className="max-w-5xl mx-auto w-full flex items-center justify-between py-4 px-4 relative z-10">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#801b34] to-[#a32847] flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
            <Heart className="w-5 h-5 fill-white text-white" />
          </div>
          <span className="font-serif font-bold text-2xl tracking-tight text-[#801b34]">
            Aura<span className="text-amber-500 font-sans font-light text-base ml-1">Matrimony</span>
          </span>
        </Link>

        <div className="flex items-center gap-4 text-xs sm:text-sm">
          {currentScreen === 1 ? (
            <button
              onClick={() => setCurrentScreen(2)}
              className="text-[#801b34] font-medium hover:underline flex items-center gap-1"
            >
              Don&apos;t have an account? <span className="font-bold underline ml-1">Register Free</span>
            </button>
          ) : (
            <button
              onClick={() => setCurrentScreen(1)}
              className="text-gray-600 hover:text-[#801b34] font-medium transition-colors"
            >
              Already registered? <span className="font-bold text-[#801b34] underline ml-1">Sign In</span>
            </button>
          )}

          <div className="hidden sm:flex items-center gap-1 text-gray-500 hover:text-gray-700 cursor-pointer">
            <HelpCircle className="w-4 h-4 text-[#801b34]" />
            <span>Help: 011 234 5678</span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-2xl w-full mx-auto my-4 relative z-10 flex-1 flex flex-col justify-center">

        {/* Top Horizontal Stepper (Screens 2 through 6) */}
        {currentScreen >= 2 && currentScreen <= 6 && (
          <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-sm border border-rose-100/80 px-6 py-4 mb-6">
            <div className="flex items-center justify-between relative max-w-md mx-auto">
              
              {/* Connecting line */}
              <div className="absolute top-4 left-6 right-6 h-0.5 bg-rose-200 -z-0">
                <div
                  className="h-full bg-[#801b34] transition-all duration-500"
                  style={{
                    width:
                      currentScreen === 2
                        ? '0%'
                        : currentScreen === 3
                        ? '33%'
                        : currentScreen === 4
                        ? '66%'
                        : '100%',
                  }}
                />
              </div>

              {steps.map((st) => {
                const stepScreenNum = st.num + 1; // Step 1 is screen 2, Step 2 is screen 3, etc.
                const isCompleted = currentScreen > stepScreenNum || currentScreen === 6;
                const isActive = currentScreen === stepScreenNum;

                return (
                  <div key={st.num} className="flex flex-col items-center relative z-10">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                        isCompleted
                          ? 'bg-[#801b34] text-white shadow-md'
                          : isActive
                          ? 'bg-white text-[#801b34] border-2 border-[#801b34] shadow-md ring-4 ring-rose-100 scale-110'
                          : 'bg-white text-gray-400 border border-rose-200'
                      }`}
                    >
                      {isCompleted ? <Check className="w-4 h-4 stroke-[3]" /> : st.num}
                    </div>
                    <span
                      className={`text-[11px] mt-1 font-medium transition-colors ${
                        isActive ? 'text-[#801b34] font-bold' : isCompleted ? 'text-gray-700' : 'text-gray-400'
                      }`}
                    >
                      {st.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Global Error Notice */}
        {errorMsg && (
          <div className="mb-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center justify-between animate-fadeIn shadow-sm">
            <span>{errorMsg}</span>
            <button onClick={() => setErrorMsg(null)} className="text-rose-500 font-bold ml-2">✕</button>
          </div>
        )}

        {/* Global Success Notice */}
        {successMsg && (
          <div className="mb-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2 animate-fadeIn shadow-sm">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* ======================================================== */}
        {/* SCREEN 01: LOGIN                                         */}
        {/* ======================================================== */}
        {currentScreen === 1 && (
          <div className="bg-white rounded-3xl shadow-xl border border-rose-100 p-8 sm:p-10 animate-fadeIn">
            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center mx-auto mb-3 shadow-inner">
                <Heart className="w-7 h-7 text-[#801b34] fill-[#801b34]/20" />
              </div>
              <h2 className="text-2xl font-bold font-serif text-gray-900">Welcome back</h2>
              <p className="text-xs text-gray-500 mt-1">
                Enter your credentials to access your verified matrimony profile
              </p>
            </div>

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Email Address or Mobile Number
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. member@auramatrimony.lk"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#801b34]/30 focus:border-[#801b34]"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-gray-700">Password</label>
                  <a href="#" className="text-xs text-[#801b34] hover:underline">Forgot password?</a>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#801b34]/30 focus:border-[#801b34]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center">
                <input
                  id="remember"
                  type="checkbox"
                  defaultChecked
                  className="rounded border-gray-300 text-[#801b34] focus:ring-[#801b34]"
                />
                <label htmlFor="remember" className="ml-2 text-xs text-gray-600">
                  Keep me signed in on this device
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-full bg-gradient-to-r from-[#801b34] to-[#99203e] text-white font-bold text-sm shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 disabled:opacity-50 cursor-pointer"
              >
                {loading ? 'Signing in...' : 'Login'}
              </button>
            </form>

            <div className="my-6 flex items-center gap-3">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">or sign in with</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={async () => {
                  setLoading(true);
                  try {
                    const sess = await apiService.googleLogin({
                      email: 'demo.google@auramatrimony.lk',
                      fullName: 'Google Verified Member',
                    });
                    setActiveSession(sess);
                    setSuccessMsg('Signed in with Google!');
                    setTimeout(() => router.push('/'), 1000);
                  } catch (e: any) {
                    setErrorMsg(e.message);
                  } finally {
                    setLoading(false);
                  }
                }}
                className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-gray-200 hover:bg-gray-50 text-xs font-semibold text-gray-700 transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                Google
              </button>

              <button
                type="button"
                onClick={() => setCurrentScreen(2)}
                className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-gray-200 hover:bg-gray-50 text-xs font-semibold text-gray-700 transition-colors"
              >
                <Phone className="w-4 h-4 text-emerald-600" />
                Phone OTP
              </button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* SCREEN 02: REGISTER — 1 ACCOUNT                          */}
        {/* ======================================================== */}
        {currentScreen === 2 && (
          <div className="bg-white rounded-3xl shadow-xl border border-rose-100 p-8 sm:p-10 animate-fadeIn">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold font-serif text-gray-900">Create your free account</h2>
              <p className="text-xs text-gray-500 mt-1">
                Find verified professional matches according to your family values
              </p>
            </div>

            <form onSubmit={handleAccountSubmit} className="space-y-4">
              {/* Profile For */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2">Create profile for</label>
                <div className="flex flex-wrap gap-2">
                  {(['Self', 'Son', 'Daughter', 'Brother', 'Sister'] as const).map((opt) => (
                    <button
                      type="button"
                      key={opt}
                      onClick={() => setProfileFor(opt)}
                      className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                        profileFor === opt
                          ? 'bg-[#801b34] text-white shadow-sm'
                          : 'bg-rose-50 text-gray-700 border border-rose-100 hover:bg-rose-100/70'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Gender */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2">Candidate Gender</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setGender('female')}
                    className={`py-2 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                      gender === 'female'
                        ? 'bg-rose-50 border-2 border-[#801b34] text-[#801b34]'
                        : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <span>Bride (Female)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setGender('male')}
                    className={`py-2 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                      gender === 'male'
                        ? 'bg-rose-50 border-2 border-[#801b34] text-[#801b34]'
                        : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <span>Groom (Male)</span>
                  </button>
                </div>
              </div>

              {/* Mobile Number */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Mobile Number (for SMS verification)</label>
                <div className="flex rounded-xl border border-gray-200 overflow-hidden focus-within:ring-2 focus-within:ring-[#801b34]/30 focus-within:border-[#801b34]">
                  <div className="bg-gray-50 px-3 py-2.5 border-r border-gray-200 text-xs font-semibold text-gray-600 flex items-center gap-1.5">
                    <span>🇱🇰</span>
                    <span>+94</span>
                  </div>
                  <input
                    type="tel"
                    required
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="77 123 4567"
                    className="flex-1 px-3.5 py-2.5 text-sm focus:outline-none"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. member@auramatrimony.lk"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#801b34]/30 focus:border-[#801b34]"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Create Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full px-3.5 pr-10 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#801b34]/30 focus:border-[#801b34]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Terms Checkbox */}
              <div className="flex items-start">
                <input
                  id="terms"
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="mt-0.5 rounded border-gray-300 text-[#801b34] focus:ring-[#801b34]"
                />
                <label htmlFor="terms" className="ml-2 text-xs text-gray-600 leading-tight">
                  I agree to the <a href="#" className="text-[#801b34] underline">Terms of Use</a> and <a href="#" className="text-[#801b34] underline">Privacy Policy</a>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-full bg-gradient-to-r from-[#801b34] to-[#99203e] text-white font-bold text-sm shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 cursor-pointer disabled:opacity-50"
              >
                {loading ? 'Sending code...' : 'Continue'}
              </button>
            </form>
          </div>
        )}

        {/* ======================================================== */}
        {/* SCREEN 03: REGISTER — 2 VERIFY OTP                       */}
        {/* ======================================================== */}
        {currentScreen === 3 && (
          <div className="bg-white rounded-3xl shadow-xl border border-rose-100 p-8 sm:p-10 animate-fadeIn text-center">
            <div className="w-14 h-14 rounded-full bg-[#801b34] flex items-center justify-center text-white mx-auto mb-4 shadow-md">
              <ShieldCheck className="w-7 h-7" />
            </div>

            <h2 className="text-2xl font-bold font-serif text-gray-900">Verify your mobile</h2>
            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
              Please enter the 6-digit verification code sent via SMS to <span className="font-bold text-gray-800">{phoneNumber}</span>
            </p>

            <button
              onClick={() => setCurrentScreen(2)}
              className="text-xs text-[#801b34] font-semibold underline mt-1 inline-block"
            >
              Change mobile number
            </button>

            {/* Demo Helper Banner */}
            <div className="my-5 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between">
              <span>Demo OTP: <strong className="font-mono text-sm tracking-wider text-[#801b34] ml-1">{demoOtpCode}</strong></span>
              <button
                type="button"
                onClick={() => setOtpDigits(demoOtpCode.split(''))}
                className="text-[11px] bg-amber-200/80 hover:bg-amber-300 px-2.5 py-1 rounded-md font-bold text-amber-900 cursor-pointer"
              >
                Auto-fill
              </button>
            </div>

            <form onSubmit={handleVerifyOtpSubmit} className="space-y-6">
              {/* 6 OTP Input Boxes */}
              <div className="flex justify-center gap-2 sm:gap-3 my-4">
                {otpDigits.map((d, idx) => (
                  <input
                    key={idx}
                    id={`otp-box-${idx}`}
                    type="text"
                    maxLength={1}
                    value={d}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      const copy = [...otpDigits];
                      copy[idx] = val;
                      setOtpDigits(copy);
                      if (val && idx < 5) {
                        const next = document.getElementById(`otp-box-${idx + 1}`);
                        if (next) next.focus();
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Backspace' && !otpDigits[idx] && idx > 0) {
                        const prev = document.getElementById(`otp-box-${idx - 1}`);
                        if (prev) prev.focus();
                      }
                    }}
                    className="w-11 h-13 sm:w-12 sm:h-14 text-center font-bold text-lg rounded-xl border border-rose-200 focus:outline-none focus:ring-2 focus:ring-[#801b34] focus:border-[#801b34] bg-rose-50/30"
                  />
                ))}
              </div>

              <p className="text-xs text-gray-500">
                Resend code in <span className="font-mono font-bold text-[#801b34]">00:{countdown.toString().padStart(2, '0')}</span>
              </p>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-full bg-gradient-to-r from-[#801b34] to-[#99203e] text-white font-bold text-sm shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 cursor-pointer disabled:opacity-50"
              >
                {loading ? 'Verifying...' : 'Verify & Continue'}
              </button>

              <div className="flex items-center justify-center gap-4 text-xs text-gray-500 pt-2">
                <button
                  type="button"
                  onClick={async () => {
                    const res = await apiService.sendOtp(phoneNumber);
                    if (res.demoOtp) setDemoOtpCode(res.demoOtp);
                    setSuccessMsg('A new verification code was sent.');
                  }}
                  className="text-[#801b34] font-semibold hover:underline"
                >
                  Resend SMS
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={() => setCurrentScreen(4)}
                  className="text-gray-600 hover:underline"
                >
                  Skip for testing
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ======================================================== */}
        {/* SCREEN 04: REGISTER — 3 PROFILE DETAILS                  */}
        {/* ======================================================== */}
        {currentScreen === 4 && (
          <div className="bg-white rounded-3xl shadow-xl border border-rose-100 p-8 sm:p-10 animate-fadeIn">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold font-serif text-gray-900">Tell us about yourself</h2>
              <p className="text-xs text-gray-500 mt-1">
                This information will be displayed on your verified matchmaking profile
              </p>
            </div>

            <form onSubmit={handleProfileSubmit} className="space-y-4">
              {/* Row 1: Full Name & Age */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Kavinda Perera"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#801b34]/30 focus:border-[#801b34]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Age</label>
                  <input
                    type="number"
                    min={18}
                    max={75}
                    value={age}
                    onChange={(e) => setAge(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#801b34]/30 focus:border-[#801b34]"
                  />
                </div>
              </div>

              {/* Row 2: Religion & Community */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Religion</label>
                  <select
                    value={religion}
                    onChange={(e) => setReligion(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#801b34]/30 focus:border-[#801b34]"
                  >
                    <option value="Buddhist">Buddhist</option>
                    <option value="Christian">Christian</option>
                    <option value="Catholic">Catholic</option>
                    <option value="Hindu">Hindu</option>
                    <option value="Muslim">Muslim</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Community / Caste</label>
                  <input
                    type="text"
                    value={community}
                    onChange={(e) => setCommunity(e.target.value)}
                    placeholder="e.g. Sinhala Govigama"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#801b34]/30 focus:border-[#801b34]"
                  />
                </div>
              </div>

              {/* Row 3: Height & City */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Height</label>
                  <select
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#801b34]/30 focus:border-[#801b34]"
                  >
                    <option value="5' 0&quot;">5 ft 0 in (152 cm)</option>
                    <option value="5' 2&quot;">5 ft 2 in (157 cm)</option>
                    <option value="5' 4&quot;">5 ft 4 in (163 cm)</option>
                    <option value="5' 6&quot;">5 ft 6 in (168 cm)</option>
                    <option value="5' 8&quot;">5 ft 8 in (173 cm)</option>
                    <option value="5' 10&quot;">5 ft 10 in (178 cm)</option>
                    <option value="6' 0&quot;">6 ft 0 in (183 cm)</option>
                    <option value="6' 2&quot;">6 ft 2 in (188 cm)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">City / Location</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Colombo 07, Kandy"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#801b34]/30 focus:border-[#801b34]"
                  />
                </div>
              </div>

              {/* Row 4: Profession & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Profession Designation</label>
                  <input
                    type="text"
                    required
                    value={profession}
                    onChange={(e) => setProfession(e.target.value)}
                    placeholder="e.g. Consultant Radiologist"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#801b34]/30 focus:border-[#801b34]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Profession Category</label>
                  <select
                    value={professionCategory}
                    onChange={(e) => setProfessionCategory(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#801b34]/30 focus:border-[#801b34]"
                  >
                    <option value="Doctor">Doctor / Medical</option>
                    <option value="IT">Software / IT & Tech</option>
                    <option value="Engineer">Civil / Mechanical Engineering</option>
                    <option value="Finance">Chartered Accountant / CFA</option>
                    <option value="Legal">Attorney / Legal Counsel</option>
                    <option value="Business">Entrepreneur / Executive</option>
                    <option value="Other">Other Professional</option>
                  </select>
                </div>
              </div>

              {/* Row 5: Highest Education & University */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Highest Education</label>
                  <input
                    type="text"
                    value={education}
                    onChange={(e) => setEducation(e.target.value)}
                    placeholder="e.g. MBBS, MD, BSc (Hons)"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#801b34]/30 focus:border-[#801b34]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">University / College</label>
                  <input
                    type="text"
                    value={university}
                    onChange={(e) => setUniversity(e.target.value)}
                    placeholder="e.g. University of Colombo"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#801b34]/30 focus:border-[#801b34]"
                  />
                </div>
              </div>

              {/* Bio */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">About Myself & Expectations</label>
                <textarea
                  rows={2}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Share a brief overview of your hobbies, lifestyle and what kind of life partner you seek..."
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#801b34]/30 focus:border-[#801b34]"
                />
              </div>

              {/* Horoscope Toggle */}
              <div className="flex items-center">
                <input
                  id="horoscope"
                  type="checkbox"
                  checked={horoscopeAvailable}
                  onChange={(e) => setHoroscopeAvailable(e.target.checked)}
                  className="rounded border-gray-300 text-[#801b34] focus:ring-[#801b34]"
                />
                <label htmlFor="horoscope" className="ml-2 text-xs text-gray-700 font-medium">
                  Horoscope details (Nekatha, Lagna) available upon mutual request
                </label>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setCurrentScreen(3)}
                  className="text-xs text-gray-600 hover:text-gray-900 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back
                </button>
                <button
                  type="submit"
                  className="px-8 py-3 rounded-full bg-gradient-to-r from-[#801b34] to-[#99203e] text-white font-bold text-sm shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 cursor-pointer"
                >
                  Continue to Photos
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ======================================================== */}
        {/* SCREEN 05: REGISTER — 4 PHOTOS                           */}
        {/* ======================================================== */}
        {currentScreen === 5 && (
          <div className="bg-white rounded-3xl shadow-xl border border-rose-100 p-8 sm:p-10 animate-fadeIn">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold font-serif text-gray-900">Add your best photos</h2>
              <p className="text-xs text-gray-500 mt-1">
                Profiles with photos receive up to 5x more responses from verified professionals
              </p>
            </div>

            {/* Photo Grid Matching Screen 05 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              
              {/* Primary Large Photo Slot */}
              <div className="relative aspect-[3/4] rounded-2xl overflow-hidden border-2 border-dashed border-[#801b34]/40 bg-rose-50/50 group flex flex-col items-center justify-center">
                {primaryPhotoUrl ? (
                  <>
                    <img
                      src={primaryPhotoUrl}
                      alt="Primary Profile"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const url = prompt('Enter image URL:', primaryPhotoUrl);
                          if (url) setPrimaryPhotoUrl(url);
                        }}
                        className="px-3 py-1.5 rounded-full bg-white text-[#801b34] text-xs font-bold shadow-md cursor-pointer"
                      >
                        Change Photo
                      </button>
                    </div>
                    <div className="absolute top-3 left-3 bg-[#801b34] text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow">
                      Main Photo
                    </div>
                  </>
                ) : (
                  <div className="text-center p-4">
                    <Camera className="w-8 h-8 text-[#801b34] mx-auto mb-2" />
                    <span className="text-xs font-bold text-gray-700 block">Upload Main Photo</span>
                    <span className="text-[10px] text-gray-500">JPG or PNG (max 5MB)</span>
                  </div>
                )}
              </div>

              {/* 4 Additional Slots Grid */}
              <div className="grid grid-cols-2 gap-2.5">
                {[0, 1, 2, 3].map((slotIdx) => {
                  const url = extraPhotos[slotIdx];
                  return (
                    <div
                      key={slotIdx}
                      onClick={() => {
                        const newUrl = prompt('Enter photo URL for slot ' + (slotIdx + 1) + ':');
                        if (newUrl) {
                          const copy = [...extraPhotos];
                          copy[slotIdx] = newUrl;
                          setExtraPhotos(copy);
                        }
                      }}
                      className="aspect-square rounded-xl border border-dashed border-rose-200 bg-rose-50/30 hover:bg-rose-50 flex flex-col items-center justify-center p-2 text-center cursor-pointer transition-colors relative overflow-hidden group"
                    >
                      {url ? (
                        <img src={url} alt={`Slot ${slotIdx + 1}`} className="w-full h-full object-cover rounded-lg" />
                      ) : (
                        <>
                          <div className="w-7 h-7 rounded-full bg-rose-100 flex items-center justify-center text-[#801b34] mb-1 group-hover:scale-110 transition-transform">
                            <Upload className="w-3.5 h-3.5" />
                          </div>
                          <span className="text-[10px] font-semibold text-gray-600">+ Add</span>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick 1-Click Curated Avatars Picker */}
            <div className="mb-6 bg-rose-50/50 rounded-2xl p-3 border border-rose-100">
              <span className="text-[11px] font-bold text-gray-700 block mb-2">
                Or select a high-resolution professional portrait:
              </span>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {curatedAvatars.map((item, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setPrimaryPhotoUrl(item.url)}
                    className={`flex-shrink-0 relative rounded-xl overflow-hidden border-2 transition-all ${
                      primaryPhotoUrl === item.url ? 'border-[#801b34] ring-2 ring-rose-300 scale-105' : 'border-transparent opacity-75 hover:opacity-100'
                    }`}
                  >
                    <img src={item.url} alt={item.label} className="w-12 h-12 object-cover" />
                  </button>
                ))}
              </div>
            </div>

            {/* Flowchart step: Upload photos + privacy */}
            <div className="mb-5 p-3 rounded-2xl bg-rose-50/60 border border-rose-200/70 text-left">
              <span className="text-xs font-bold text-gray-800 block mb-2">Photo Privacy Setting:</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setPhotoPrivacy('public')}
                  className={`py-2 px-3 rounded-xl border font-medium text-left transition-all cursor-pointer ${
                    photoPrivacy === 'public'
                      ? 'bg-white border-[#801b34] text-[#801b34] shadow-xs'
                      : 'bg-white/50 border-gray-200 text-gray-600 hover:bg-white'
                  }`}
                >
                  <span className="block font-bold">Public to Members</span>
                  <span className="text-[10px] text-gray-500">Visible to verified community</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPhotoPrivacy('blurred')}
                  className={`py-2 px-3 rounded-xl border font-medium text-left transition-all cursor-pointer ${
                    photoPrivacy === 'blurred'
                      ? 'bg-white border-[#801b34] text-[#801b34] shadow-xs'
                      : 'bg-white/50 border-gray-200 text-gray-600 hover:bg-white'
                  }`}
                >
                  <span className="block font-bold">Protected / Blurred</span>
                  <span className="text-[10px] text-gray-500">Unlocked on mutual consent</span>
                </button>
              </div>
            </div>

            {/* Trust and Privacy Tips Box */}
            <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-100 text-[11px] text-blue-900 space-y-1 mb-6 text-left">
              <div className="flex items-center gap-1.5 font-semibold text-blue-800">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <span>Photo privacy is 100% in your hands</span>
              </div>
              <p className="text-gray-600 leading-relaxed">
                ✓ Clear face portrait with good lighting &bull; ✓ Solo photo without sunglasses &bull; 🔒 Privacy settings can be updated anytime in your dashboard.
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setCurrentScreen(4)}
                className="text-xs text-gray-600 hover:text-gray-900 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={handlePhotosSubmit}
                className="px-8 py-3.5 rounded-full bg-gradient-to-r from-[#801b34] to-[#99203e] text-white font-bold text-sm shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 cursor-pointer disabled:opacity-50"
              >
                {loading ? 'Publishing Profile...' : 'Complete & Publish Profile'}
              </button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* SCREEN 06: WELCOME — PROFILE LIVE                        */}
        {/* ======================================================== */}
        {currentScreen === 6 && (
          <div className="bg-white rounded-3xl shadow-xl border border-rose-100 p-8 sm:p-10 animate-fadeIn text-center">
            
            {/* Illustrated Couple Icon */}
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-rose-100 to-amber-100 flex items-center justify-center mx-auto mb-4 shadow-sm border border-rose-200">
              <span className="text-2xl">👩‍❤️‍👨</span>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200 mb-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>PROFILE ACTIVE & VERIFIED</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold font-serif text-gray-900">Your profile is live!</h2>
            <p className="text-xs sm:text-sm text-gray-600 mt-1.5 max-w-md mx-auto leading-relaxed">
              Congratulations, <strong className="text-gray-900">{fullName || 'Member'}</strong>! Your verified profile code is{' '}
              <span className="font-mono font-bold text-[#801b34] bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                {createdProfile?.code || 'LK-2026'}
              </span>
              . You are now discoverable by matching professionals.
            </p>

            {/* Next Steps Checklist Cards */}
            <div className="space-y-2.5 my-6 text-left max-w-md mx-auto">
              <div className="p-3.5 rounded-2xl bg-rose-50/60 border border-rose-100 flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[#801b34] text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                  1
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900">Explore Matching Professionals</h4>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Browse Doctors, Software Engineers, and Chartered Accountants tailored to your lifestyle.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-rose-50/60 border border-rose-100 flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[#801b34] text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                  2
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900">Send Direct Expressions of Interest</h4>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Initiate family-friendly connect requests with candidates you admire.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-rose-50/60 border border-rose-100 flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[#801b34] text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                  3
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900">Family & Horoscope Compatibility</h4>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Request Porondam horoscope matching reports and parent contacts.
                  </p>
                </div>
              </div>
            </div>

            {/* Go to Matches Button */}
            <button
              onClick={() => {
                if (onFinished && createdProfile && activeSession) {
                  onFinished(activeSession, createdProfile);
                } else {
                  router.push('/');
                }
              }}
              className="w-full max-w-md py-3.5 rounded-full bg-gradient-to-r from-[#801b34] to-[#99203e] text-white font-bold text-sm shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 cursor-pointer"
            >
              Browse Matching Candidates
            </button>

            {/* Hotline Support Note */}
            <div className="mt-5 p-3 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-900 text-xs max-w-md mx-auto">
              <span>Need confidential assistance? Call our Senior Matrimonial Advisors: </span>
              <strong className="underline text-[#801b34]">011 234 5678</strong>
            </div>
          </div>
        )}

      </main>

    </DecorativeHeartBackground>
  );
};
