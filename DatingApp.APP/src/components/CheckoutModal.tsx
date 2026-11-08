'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  QrCode,
  Smartphone,
  Building,
  Upload,
  Sparkles,
  ShieldCheck,
  Lock,
  ArrowRight,
  FileText,
  Printer,
  RefreshCw,
  Crown,
  ChevronRight,
  Calendar,
  Percent,
  Copy,
  Check
} from 'lucide-react';
import { apiService, SubscriptionInfo } from '../services/api';
import { pricingPlans } from '../data/mockData';

interface CheckoutModalProps {
  isOpen: boolean;
  initialPlanId?: string;
  onClose: () => void;
  onSuccess: (subscription: SubscriptionInfo) => void;
}

type DurationType = '1m' | '3m' | '6m';
type PaymentMethodType = 'card' | 'lankaqr' | 'mobile_money' | 'bank_transfer';
type CheckoutStep = 'configure' | 'processing' | 'success' | 'failed' | 'slip_pending';

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  initialPlanId = 'premium',
  onClose,
  onSuccess,
}) => {
  // Plan & Duration selection
  const [selectedPlanId, setSelectedPlanId] = useState<string>(initialPlanId || 'premium');
  const [duration, setDuration] = useState<DurationType>('3m');

  // Promo Code State
  const [promoInput, setPromoInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<{
    code: string;
    discountPercent: number;
    message: string;
  } | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);

  // Payment Method
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('card');

  // Card Form State
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardName, setCardName] = useState('');

  // Mobile Money State
  const [mobileProvider, setMobileProvider] = useState<'ezcash' | 'mcash'>('ezcash');
  const [mobileNumber, setMobileNumber] = useState('0771234567');

  // Bank Slip Upload State
  const [bankSlipFile, setBankSlipFile] = useState<File | null>(null);
  const [bankSlipPreview, setBankSlipPreview] = useState<string | null>(null);
  const [bankReference, setBankReference] = useState('');
  const [selectedBank, setSelectedBank] = useState<'combank' | 'boc'>('combank');

  // Checkout Flow Step
  const [step, setStep] = useState<CheckoutStep>('configure');
  const [completedSubscription, setCompletedSubscription] = useState<SubscriptionInfo | null>(null);
  const [simulateFailure, setSimulateFailure] = useState(false);
  const [copiedBank, setCopiedBank] = useState(false);

  // Sync initial plan
  useEffect(() => {
    if (initialPlanId) {
      setSelectedPlanId(initialPlanId === 'free' ? 'premium' : initialPlanId);
    }
  }, [initialPlanId]);

  if (!isOpen) return null;

  // Pricing configuration
  const planDetails: Record<string, { name: string; baseMonthly: number; badge: string; color: string }> = {
    premium: {
      name: 'Premium Matrimonial',
      baseMonthly: 1500,
      badge: 'Most Popular',
      color: '#801b34',
    },
    vip: {
      name: 'Elite VIP Matchmaker',
      baseMonthly: 2400,
      badge: 'VIP Dedicated Advisor',
      color: '#b45309',
    },
  };

  const currentPlan = planDetails[selectedPlanId] || planDetails['premium'];

  // Calculate pricing based on duration
  const durationMonths = duration === '1m' ? 1 : duration === '3m' ? 3 : 6;
  const durationMultiplier = duration === '1m' ? 1 : duration === '3m' ? 0.87 : 0.75; // discount for longer commitments
  const rawSubtotal = Math.round(currentPlan.baseMonthly * durationMonths * durationMultiplier);

  // Promo discount
  const promoDiscountAmount = appliedPromo
    ? Math.round((rawSubtotal * appliedPromo.discountPercent) / 100)
    : 0;

  const finalTotal = Math.max(0, rawSubtotal - promoDiscountAmount);

  // Handle Promo Code Apply
  const handleApplyPromo = () => {
    setPromoError(null);
    if (!promoInput.trim()) {
      setPromoError('Please enter a promo code');
      return;
    }
    const result = apiService.verifyPromoCode(promoInput);
    if (result.valid) {
      setAppliedPromo({
        code: promoInput.toUpperCase().trim(),
        discountPercent: result.discountPercent,
        message: result.message,
      });
      setPromoError(null);
    } else {
      setAppliedPromo(null);
      setPromoError(result.message);
    }
  };

  // Format Card Number (adds spaces every 4 digits)
  const handleCardNumberChange = (val: string) => {
    const raw = val.replace(/\D/g, '').slice(0, 16);
    const formatted = raw.match(/.{1,4}/g)?.join(' ') || raw;
    setCardNumber(formatted);
  };

  // Format Expiry (MM/YY)
  const handleExpiryChange = (val: string) => {
    const raw = val.replace(/\D/g, '').slice(0, 4);
    if (raw.length >= 3) {
      setCardExpiry(`${raw.slice(0, 2)}/${raw.slice(2, 4)}`);
    } else {
      setCardExpiry(raw);
    }
  };

  // Handle Slip Upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setBankSlipFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setBankSlipPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Compute Expiration Date
  const calculateExpiryDate = (months: number) => {
    const d = new Date();
    d.setMonth(d.getMonth() + months);
    return d.toISOString();
  };

  // Submit Payment / Activation
  const handleProcessPayment = () => {
    // If Bank Transfer -> route to slip verification pending
    if (paymentMethod === 'bank_transfer') {
      if (!bankReference.trim()) {
        alert('Please enter your Bank Deposit Reference Number or Transaction ID from your deposit slip.');
        return;
      }
      setStep('processing');
      setTimeout(() => {
        const txnId = `SLIP-${Math.floor(100000 + Math.random() * 900000)}`;
        const sub: SubscriptionInfo = {
          planId: selectedPlanId as 'premium' | 'vip',
          planName: currentPlan.name,
          durationMonths,
          startDate: new Date().toISOString(),
          expiresAt: calculateExpiryDate(durationMonths),
          status: 'pending_verification',
          autoRenew: false,
          amountLkr: finalTotal,
          paymentMethod: 'Bank Transfer (Slip Upload)',
          transactionId: txnId,
          bankSlipRef: bankReference,
          bankSlipUrl: bankSlipPreview || 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?q=80&w=400&auto=format&fit=crop',
        };
        apiService.activateSubscription(sub);
        setCompletedSubscription(sub);
        setStep('slip_pending');
      }, 1500);
      return;
    }

    // Gateway Payment (Card / LankaQR / eZ Cash)
    setStep('processing');
    setTimeout(() => {
      // Simulate failure branch for testing Flow 4 "Payment failed -> retry"
      if (simulateFailure) {
        setStep('failed');
        return;
      }

      const txnId = `TXN-${Math.floor(100000 + Math.random() * 900000)}`;
      const methodLabel =
        paymentMethod === 'card'
          ? `Credit/Debit Card (ending in ${cardNumber.slice(-4) || '4242'})`
          : paymentMethod === 'lankaqr'
          ? 'LankaQR Direct Payment'
          : `${mobileProvider === 'ezcash' ? 'Dialog eZ Cash' : 'Mobitel mCash'} (${mobileNumber})`;

      const sub: SubscriptionInfo = {
        planId: selectedPlanId as 'premium' | 'vip',
        planName: currentPlan.name,
        durationMonths,
        startDate: new Date().toISOString(),
        expiresAt: calculateExpiryDate(durationMonths),
        status: 'active',
        autoRenew: true,
        amountLkr: finalTotal,
        paymentMethod: methodLabel,
        transactionId: txnId,
      };

      apiService.activateSubscription(sub);
      setCompletedSubscription(sub);
      setStep('success');
      onSuccess(sub);
    }, 1800);
  };

  const copyBankDetails = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedBank(true);
    setTimeout(() => setCopiedBank(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-rose-100 flex flex-col max-h-[92vh]">
        
        {/* Top Header Bar */}
        <div className="bg-[#801b34] text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-amber-400 text-maroon-950 flex items-center justify-center font-bold">
              <Crown className="w-5 h-5 text-[#801b34]" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-serif leading-tight">
                Aura Matrimonial Membership
              </h2>
              <p className="text-xs text-rose-200">
                Secure 256-bit SSL encrypted checkout • Instant access
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto p-5 sm:p-7 space-y-6 flex-1">
          
          {/* STEP 1: CONFIGURE & PAY */}
          {step === 'configure' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-7">
              
              {/* Left Column: Plan, Duration & Payment Inputs (7 cols) */}
              <div className="lg:col-span-7 space-y-6">
                
                {/* 1. Plan Tier Selector */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2 block">
                    1. Choose Membership Tier
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedPlanId('premium')}
                      className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative ${
                        selectedPlanId === 'premium'
                          ? 'border-[#801b34] bg-rose-50/60 ring-2 ring-[#801b34]/20 shadow-sm'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <span className="text-[10px] uppercase font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full inline-block mb-1">
                        Most Popular
                      </span>
                      <h4 className="font-bold text-gray-900 text-sm">Premium</h4>
                      <p className="text-xs text-gray-500 mt-0.5">LKR 1,500 / mo</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedPlanId('vip')}
                      className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative ${
                        selectedPlanId === 'vip'
                          ? 'border-amber-600 bg-amber-50/60 ring-2 ring-amber-600/20 shadow-sm'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <span className="text-[10px] uppercase font-bold text-amber-800 bg-amber-200 px-2 py-0.5 rounded-full inline-block mb-1">
                        Elite VIP
                      </span>
                      <h4 className="font-bold text-gray-900 text-sm">Elite VIP Matchmaker</h4>
                      <p className="text-xs text-gray-500 mt-0.5">LKR 2,400 / mo</p>
                    </button>
                  </div>
                </div>

                {/* 2. Duration Selector */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2 block">
                    2. Select Duration
                  </label>
                  <div className="grid grid-cols-3 gap-2.5">
                    {[
                      { id: '1m', label: '1 Month', sub: 'Standard rate', savings: '' },
                      { id: '3m', label: '3 Months', sub: 'Save 13%', savings: 'Popular' },
                      { id: '6m', label: '6 Months', sub: 'Save 25%', savings: 'Best Value' },
                    ].map((d) => (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => setDuration(d.id as DurationType)}
                        className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                          duration === d.id
                            ? 'border-[#801b34] bg-[#801b34] text-white shadow-md'
                            : 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <div className="text-xs font-bold">{d.label}</div>
                        <div className={`text-[11px] mt-0.5 ${duration === d.id ? 'text-rose-200' : 'text-gray-500'}`}>
                          {d.sub}
                        </div>
                        {d.savings && (
                          <span className={`text-[9px] uppercase font-extrabold px-1.5 py-0.5 rounded-full mt-1 inline-block ${
                            duration === d.id ? 'bg-amber-400 text-maroon-950' : 'bg-rose-100 text-[#801b34]'
                          }`}>
                            {d.savings}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Promo Code Input */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2 flex items-center justify-between">
                    <span>3. Have a Promo Code?</span>
                    <span className="text-[11px] text-gray-400 font-normal">Try: <span className="font-mono text-[#801b34] font-semibold">AURA30</span></span>
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Percent className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={promoInput}
                        onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                        placeholder="ENTER CODE (e.g. AURA30)"
                        className="w-full pl-9 pr-3 py-2 text-sm uppercase font-mono tracking-wider border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#801b34] focus:border-transparent outline-none"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleApplyPromo}
                      className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                    >
                      Apply
                    </button>
                  </div>

                  {appliedPromo && (
                    <div className="mt-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg flex items-center justify-between">
                      <span className="flex items-center gap-1.5 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        {appliedPromo.message}
                      </span>
                      <button
                        onClick={() => {
                          setAppliedPromo(null);
                          setPromoInput('');
                        }}
                        className="text-gray-400 hover:text-gray-600 text-[11px] underline"
                      >
                        Remove
                      </button>
                    </div>
                  )}

                  {promoError && (
                    <div className="mt-2 text-xs text-rose-700 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                      <span>{promoError}</span>
                    </div>
                  )}
                </div>

                {/* 4. Payment Method Tabs */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2 block">
                    4. Choose Payment Method
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'card', label: 'Card', icon: CreditCard },
                      { id: 'lankaqr', label: 'LankaQR', icon: QrCode },
                      { id: 'mobile_money', label: 'eZ / mCash', icon: Smartphone },
                      { id: 'bank_transfer', label: 'Bank Slip', icon: Building },
                    ].map((m) => {
                      const Icon = m.icon;
                      const active = paymentMethod === m.id;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setPaymentMethod(m.id as PaymentMethodType)}
                          className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                            active
                              ? 'border-[#801b34] bg-rose-50 text-[#801b34] font-bold shadow-sm'
                              : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          <Icon className={`w-4 h-4 ${active ? 'text-[#801b34]' : 'text-gray-500'}`} />
                          <span className="text-xs">{m.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 5. Dynamic Payment Inputs based on selected method */}
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200/80">
                  
                  {/* METHOD A: CREDIT / DEBIT CARD */}
                  {paymentMethod === 'card' && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                        <span className="font-medium text-gray-700">Card Details</span>
                        <div className="flex items-center gap-1.5 text-[10px] font-semibold text-gray-400">
                          <span>Visa</span>
                          <span>•</span>
                          <span>Mastercard</span>
                          <span>•</span>
                          <span>Amex</span>
                        </div>
                      </div>

                      <div>
                        <input
                          type="text"
                          value={cardNumber}
                          onChange={(e) => handleCardNumberChange(e.target.value)}
                          placeholder="Card Number (4000 1234 5678 9010)"
                          className="w-full px-3 py-2 text-sm font-mono border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-[#801b34] outline-none"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={cardExpiry}
                          onChange={(e) => handleExpiryChange(e.target.value)}
                          placeholder="MM/YY"
                          className="w-full px-3 py-2 text-sm font-mono border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-[#801b34] outline-none text-center"
                        />
                        <input
                          type="password"
                          maxLength={4}
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ''))}
                          placeholder="CVV / CVC"
                          className="w-full px-3 py-2 text-sm font-mono border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-[#801b34] outline-none text-center"
                        />
                      </div>

                      <div>
                        <input
                          type="text"
                          value={cardName}
                          onChange={(e) => setCardName(e.target.value)}
                          placeholder="Cardholder Name"
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-[#801b34] outline-none"
                        />
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-gray-500 pt-1">
                        <Lock className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Protected by 3D Secure 2.0 & Sri Lanka Banking Security Guidelines</span>
                      </div>
                    </div>
                  )}

                  {/* METHOD B: LANKAQR */}
                  {paymentMethod === 'lankaqr' && (
                    <div className="text-center space-y-3 py-2">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 rounded-full text-[11px] font-bold text-amber-900">
                        <QrCode className="w-3.5 h-3.5" />
                        <span>Central Bank Certified LankaQR</span>
                      </div>

                      {/* Visual QR Code Display */}
                      <div className="mx-auto w-44 h-44 bg-white p-3 rounded-2xl border-2 border-dashed border-[#801b34]/30 shadow-inner flex flex-col items-center justify-center relative">
                        <div className="w-36 h-36 bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl flex flex-col items-center justify-center p-2 text-white text-center shadow">
                          <QrCode className="w-20 h-20 text-white mb-1" />
                          <span className="text-[10px] font-mono tracking-wider font-semibold">LANKAQR • AURA</span>
                        </div>
                      </div>

                      <div className="text-xs text-gray-600 max-w-sm mx-auto space-y-1">
                        <p className="font-semibold text-gray-900">Scan using any Sri Lankan Banking App:</p>
                        <p className="text-[11px] text-gray-500">
                          Commercial Bank Q+, Sampath Vishwa, BOC Smart, HNB SOLO, FriMi, People&apos;s Wave, eZ Cash.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* METHOD C: MOBILE MONEY (eZ Cash / mCash) */}
                  {paymentMethod === 'mobile_money' && (
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setMobileProvider('ezcash')}
                          className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                            mobileProvider === 'ezcash'
                              ? 'bg-red-600 text-white border-red-600 shadow'
                              : 'bg-white text-gray-700 border-gray-300'
                          }`}
                        >
                          Dialog eZ Cash
                        </button>
                        <button
                          type="button"
                          onClick={() => setMobileProvider('mcash')}
                          className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                            mobileProvider === 'mcash'
                              ? 'bg-blue-600 text-white border-blue-600 shadow'
                              : 'bg-white text-gray-700 border-gray-300'
                          }`}
                        >
                          Mobitel mCash
                        </button>
                      </div>

                      <div>
                        <label className="text-xs text-gray-600 block mb-1">
                          Enter your registered mobile number:
                        </label>
                        <input
                          type="tel"
                          value={mobileNumber}
                          onChange={(e) => setMobileNumber(e.target.value)}
                          placeholder="07X-XXXXXXX"
                          className="w-full px-3 py-2 text-sm font-mono border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-[#801b34] outline-none"
                        />
                      </div>

                      <p className="text-[11px] text-gray-500">
                        You will receive an instant USSD push prompt on your phone to enter your wallet PIN and authorize this payment.
                      </p>
                    </div>
                  )}

                  {/* METHOD D: BANK TRANSFER / SLIP UPLOAD */}
                  {paymentMethod === 'bank_transfer' && (
                    <div className="space-y-3 text-left">
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold">Official Aura Bank Accounts:</span>
                          <button
                            type="button"
                            onClick={() => copyBankDetails('Commercial Bank PLC, Kollupitiya, Acc: 100023456789, Aura Matrimony (Pvt) Ltd')}
                            className="text-[11px] text-[#801b34] hover:underline flex items-center gap-1 font-semibold"
                          >
                            {copiedBank ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                            <span>{copiedBank ? 'Copied!' : 'Copy Info'}</span>
                          </button>
                        </div>
                        <p className="text-[11px] font-mono">
                          <strong>Bank:</strong> Commercial Bank PLC (Kollupitiya Branch)<br />
                          <strong>Account:</strong> 1000 2345 6789 • <strong>Name:</strong> Aura Matrimony (Pvt) Ltd
                        </p>
                        <p className="text-[11px] font-mono mt-1 pt-1 border-t border-amber-200/60">
                          <strong>Alt Bank:</strong> Bank of Ceylon (Corporate Branch) • <strong>A/C:</strong> 0001 8976 5432
                        </p>
                      </div>

                      {/* Slip Upload & Reference Input */}
                      <div className="space-y-2">
                        <div>
                          <label className="text-xs font-semibold text-gray-700 block mb-1">
                            Deposit Slip / Online Transfer Reference:
                          </label>
                          <input
                            type="text"
                            value={bankReference}
                            onChange={(e) => setBankReference(e.target.value)}
                            placeholder="e.g. CB-89412 or Deposit Slip #"
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-[#801b34] outline-none"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-semibold text-gray-700 block mb-1">
                            Upload Bank Receipt / Slip Photo:
                          </label>
                          <label className="border-2 border-dashed border-gray-300 hover:border-[#801b34] rounded-xl p-3 flex flex-col items-center justify-center cursor-pointer transition-colors bg-white">
                            <Upload className="w-5 h-5 text-gray-400 mb-1" />
                            <span className="text-xs text-gray-600 font-medium">
                              {bankSlipFile ? bankSlipFile.name : 'Click to select slip image or PDF'}
                            </span>
                            <span className="text-[10px] text-gray-400">JPG, PNG or PDF under 5MB</span>
                            <input
                              type="file"
                              accept="image/*,application/pdf"
                              onChange={handleFileChange}
                              className="hidden"
                            />
                          </label>
                        </div>

                        {bankSlipPreview && (
                          <div className="relative w-24 h-16 rounded-lg overflow-hidden border border-gray-200">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={bankSlipPreview} alt="Slip Preview" className="w-full h-full object-cover" />
                            <span className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[9px] text-center py-0.5">
                              Ready
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Developer / Testing Simulator Toggle */}
                <div className="pt-1 flex items-center justify-between text-[11px] text-gray-400">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={simulateFailure}
                      onChange={(e) => setSimulateFailure(e.target.checked)}
                      className="rounded text-[#801b34] focus:ring-0"
                    />
                    <span>Test Flow 4: Simulate payment decline / failure</span>
                  </label>
                </div>
              </div>

              {/* Right Column: Order Summary & Pay Action (5 cols) */}
              <div className="lg:col-span-5 bg-rose-50/50 rounded-2xl p-5 border border-rose-100 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-gray-900 text-sm font-serif mb-4 pb-3 border-b border-rose-200/60 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#801b34]" />
                    <span>Order Summary</span>
                  </h3>

                  {/* Plan Line */}
                  <div className="space-y-2.5 text-xs text-gray-600 pb-4 border-b border-rose-200/60">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-gray-800">{currentPlan.name}</span>
                      <span className="font-bold text-gray-900">LKR {rawSubtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-gray-500 text-[11px]">
                      <span>Billing Duration:</span>
                      <span className="font-medium text-gray-700">{durationMonths} Month{durationMonths > 1 ? 's' : ''}</span>
                    </div>

                    {/* Applied Promo Row */}
                    {appliedPromo && (
                      <div className="flex justify-between items-center text-emerald-700 font-semibold text-xs pt-1">
                        <span className="flex items-center gap-1">
                          <Percent className="w-3.5 h-3.5" />
                          Promo ({appliedPromo.code} -{appliedPromo.discountPercent}%)
                        </span>
                        <span>- LKR {promoDiscountAmount.toLocaleString()}</span>
                      </div>
                    )}
                  </div>

                  {/* Total Amount Due */}
                  <div className="py-4 space-y-1">
                    <div className="flex justify-between items-baseline">
                      <span className="text-xs uppercase font-extrabold text-gray-500">Total Payable</span>
                      <div className="text-right">
                        {appliedPromo && (
                          <span className="text-xs text-gray-400 line-through mr-2">
                            LKR {rawSubtotal.toLocaleString()}
                          </span>
                        )}
                        <span className="text-2xl font-extrabold font-serif text-[#801b34]">
                          LKR {finalTotal.toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <p className="text-[11px] text-gray-500 text-right">
                      Inclusive of all Sri Lankan taxes & gateway fees
                    </p>
                  </div>

                  {/* Flow 4 Plan Running Guarantee */}
                  <div className="bg-white/80 rounded-xl p-3 border border-rose-100 text-[11px] text-gray-600 space-y-1.5 my-2">
                    <div className="flex items-start gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>
                        <strong>7-Day Expiry Alerts:</strong> You will receive SMS & email notifications 7 days and 1 day prior to any renewal.
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>
                        <strong>Zero Data Loss:</strong> If you cancel or let the plan lapse, your candidate profile and all match requests remain completely safe.
                      </span>
                    </div>
                  </div>
                </div>

                {/* Main Action Button */}
                <div className="pt-4 space-y-2">
                  <button
                    type="button"
                    onClick={handleProcessPayment}
                    className="w-full py-3.5 px-5 bg-[#801b34] hover:bg-[#681429] text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer transform hover:-translate-y-0.5"
                  >
                    <span>
                      {paymentMethod === 'bank_transfer'
                        ? 'Submit Slip for Verification'
                        : `Pay LKR ${finalTotal.toLocaleString()} Now`}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <p className="text-[10px] text-center text-gray-400">
                    By confirming, you agree to Aura Matrimony Terms of Service & Privacy Policy
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: PROCESSING ANIMATION */}
          {step === 'processing' && (
            <div className="py-16 text-center space-y-4 max-w-md mx-auto">
              <div className="w-16 h-16 rounded-full bg-rose-100 text-[#801b34] flex items-center justify-center mx-auto animate-spin">
                <RefreshCw className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold font-serif text-gray-900">
                Contacting Secure Gateway...
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Please do not close or refresh this window. We are securing your transaction with our banking partners.
              </p>
            </div>
          )}

          {/* STEP 3: PAYMENT FAILED (Flow 4 - retry / other method) */}
          {step === 'failed' && (
            <div className="py-10 text-center space-y-5 max-w-md mx-auto">
              <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                <AlertCircle className="w-9 h-9" />
              </div>
              <div>
                <h3 className="text-xl font-bold font-serif text-gray-900">
                  Payment Unsuccessful
                </h3>
                <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                  Your bank declined the transaction or network timeout occurred. No funds were debited from your account.
                </p>
              </div>

              <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-xs text-rose-800 text-left space-y-1">
                <div className="font-bold">Flow 4 Resolution Options:</div>
                <ul className="list-disc list-inside text-[11px] space-y-0.5 text-rose-700">
                  <li>Try again with the same card or ensure online e-commerce is enabled on your card.</li>
                  <li>Switch to <strong>LankaQR</strong> or <strong>eZ Cash</strong> for instant mobile clearing.</li>
                  <li>Transfer via Bank Deposit and upload the bank slip.</li>
                </ul>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  type="button"
                  onClick={() => {
                    setSimulateFailure(false);
                    setStep('configure');
                  }}
                  className="px-6 py-2.5 bg-[#801b34] hover:bg-[#681429] text-white font-bold text-xs rounded-xl shadow cursor-pointer"
                >
                  Retry Payment
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSimulateFailure(false);
                    setPaymentMethod('lankaqr');
                    setStep('configure');
                  }}
                  className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Try LankaQR / Other Method
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: BANK SLIP PENDING VERIFICATION */}
          {step === 'slip_pending' && completedSubscription && (
            <div className="py-8 text-center space-y-5 max-w-lg mx-auto">
              <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
                <Building className="w-8 h-8" />
              </div>

              <div>
                <span className="text-[10px] uppercase font-extrabold tracking-wider bg-amber-100 text-amber-800 px-3 py-1 rounded-full">
                  Finance Verification Queue
                </span>
                <h3 className="text-xl font-bold font-serif text-gray-900 mt-2">
                  Deposit Slip Submitted Successfully!
                </h3>
                <p className="text-xs text-gray-600 mt-1">
                  Tracking Reference: <span className="font-mono font-bold text-[#801b34]">{completedSubscription.transactionId}</span>
                </p>
              </div>

              <div className="bg-white border border-gray-200 rounded-2xl p-4 text-left shadow-sm text-xs space-y-2">
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-500">Plan Selected:</span>
                  <span className="font-bold text-gray-800">{completedSubscription.planName}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-500">Duration:</span>
                  <span className="font-medium text-gray-800">{completedSubscription.durationMonths} Months</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-500">Amount Paid:</span>
                  <span className="font-bold text-[#801b34]">LKR {completedSubscription.amountLkr.toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-gray-500">Slip Reference:</span>
                  <span className="font-mono text-gray-800">{completedSubscription.bankSlipRef}</span>
                </div>
              </div>

              <p className="text-[11px] text-gray-500 leading-relaxed">
                Our finance verification officers review receipts within 1-2 hours during business hours. Once verified, your account is immediately upgraded to {completedSubscription.planName} and you will receive an SMS confirmation.
              </p>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-3 bg-[#801b34] hover:bg-[#681429] text-white font-bold text-xs rounded-xl shadow cursor-pointer"
              >
                Done • View Dashboard
              </button>
            </div>
          )}

          {/* STEP 5: INSTANT SUCCESS (Flow 4 - Plan active + receipt + invoice) */}
          {step === 'success' && completedSubscription && (
            <div className="py-6 space-y-6 max-w-xl mx-auto">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
                  <CheckCircle2 className="w-9 h-9" />
                </div>
                <span className="text-[10px] uppercase font-extrabold tracking-wider bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full inline-block">
                  Plan Activated • Instant Access
                </span>
                <h3 className="text-2xl font-bold font-serif text-gray-900">
                  Welcome to {completedSubscription.planName}!
                </h3>
                <p className="text-xs text-gray-600">
                  Transaction Reference: <span className="font-mono font-bold text-gray-900">{completedSubscription.transactionId}</span>
                </p>
              </div>

              {/* Printable Invoice / Receipt Card */}
              <div className="bg-gray-50 border border-gray-200/90 rounded-2xl p-5 text-left text-xs space-y-3">
                <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm font-serif">Aura Matrimony Receipt</h4>
                    <p className="text-[11px] text-gray-500">Issued on {new Date().toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      PAID
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Tier:</span>
                    <span className="font-bold text-gray-900">{completedSubscription.planName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Validity:</span>
                    <span className="font-medium text-gray-900">
                      {new Date(completedSubscription.startDate).toLocaleDateString()} to{' '}
                      {new Date(completedSubscription.expiresAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Payment Channel:</span>
                    <span className="font-medium text-gray-900">{completedSubscription.paymentMethod}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-gray-200 font-bold text-xs text-gray-900">
                    <span>Total Paid:</span>
                    <span className="text-[#801b34]">LKR {completedSubscription.amountLkr.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex-1 py-3 px-4 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-gray-500" />
                  <span>Download / Print Receipt</span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 px-4 bg-[#801b34] hover:bg-[#681429] text-white font-bold text-xs rounded-xl shadow flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Explore Verified Matches</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
