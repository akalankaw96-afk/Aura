'use client';

import React from 'react';
import { X } from 'lucide-react';
import { AuthSession } from '../services/api';
import { Profile } from '../types';
import { RegistrationFlow } from './RegistrationFlow';

interface AuthOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetProfile?: Profile | null;
  onCompleted: (session: AuthSession, createdProfile: Profile) => void;
}

export const AuthOnboardingModal: React.FC<AuthOnboardingModalProps> = ({
  isOpen,
  onClose,
  targetProfile,
  onCompleted,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div
        className="bg-white rounded-3xl max-w-3xl w-full max-h-[94vh] overflow-y-auto shadow-2xl border border-rose-100 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Floating Close Button */}
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 z-30 w-9 h-9 rounded-full bg-white/80 hover:bg-white text-gray-700 shadow-md flex items-center justify-center transition-all cursor-pointer border border-rose-100"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Embedded Registration & Profile Flow matching Figma screens */}
        <RegistrationFlow
          initialScreen="register"
          targetProfile={targetProfile}
          isModal={true}
          onClose={onClose}
          onFinished={(sess, prof) => {
            onCompleted(sess, prof);
            onClose();
          }}
        />
      </div>
    </div>
  );
};
