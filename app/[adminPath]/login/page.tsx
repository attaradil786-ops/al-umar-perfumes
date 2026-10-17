'use client';

import React, { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage({
  params,
}: {
  params: { adminPath: string };
}) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    try {
      const res = await signIn('credentials', {
        email: email.trim(),
        password,
        totpCode: totpCode.trim(),
        redirect: false,
      });

      if (!res || res.error || !res.ok) {
        // Strict Rule: Generic error message, never disclose which field is incorrect
        setErrorMessage('Invalid credentials. Please verify and try again.');
        setIsLoading(false);
        return;
      }

      // Successful login -> Navigate to callbackUrl or admin root dashboard
      const searchParams = new URLSearchParams(window.location.search);
      const callbackUrl = searchParams.get('callbackUrl') || `/${params.adminPath}`;
      router.push(callbackUrl);
      router.refresh();
    } catch {
      setErrorMessage('Invalid credentials. Please verify and try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF8EC] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#553E23] text-[#D4AF37] font-serif text-3xl font-bold flex items-center justify-center mx-auto shadow-md">
          ع
        </div>
        <h2 className="mt-4 font-serif text-3xl font-bold text-[#553E23] tracking-wide">
          AL UMAR
        </h2>
        <p className="mt-1 text-xs uppercase tracking-widest text-[#7A5B37] font-semibold">
          Restricted Administration Gateway
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl rounded-2xl border border-[#E8DCC8] sm:px-10">
          <form className="space-y-5" onSubmit={handleSubmit}>
            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <span>{errorMessage}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-[#553E23] uppercase tracking-wider mb-1.5">
                Admin Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@alumarperfumes.com"
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#E8DCC8] bg-[#FFF8EC]/30 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E6B5C] focus:border-transparent transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#553E23] uppercase tracking-wider mb-1.5">
                Master Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#E8DCC8] bg-[#FFF8EC]/30 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E6B5C] focus:border-transparent transition"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-[#553E23] uppercase tracking-wider">
                  2FA Authenticator Code
                </label>
                <span className="text-[11px] text-[#7A5B37]">(if 2FA enabled)</span>
              </div>
              <input
                type="text"
                maxLength={6}
                value={totpCode}
                onChange={e => setTotpCode(e.target.value.replace(/\D/g, ''))}
                placeholder="6-digit code (e.g. 123456)"
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#E8DCC8] bg-[#FFF8EC]/30 text-sm tracking-widest text-center font-mono focus:outline-none focus:ring-2 focus:ring-[#1E6B5C] focus:border-transparent transition"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#1E6B5C] hover:bg-[#165A4A] text-white py-3 rounded-lg text-sm font-bold tracking-wide transition shadow-md hover:shadow-lg disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <span>Sign In to Admin Portal</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="5" y1="12" x2="19" y2="12"/>
                    <polyline points="12 5 19 12 12 19"/>
                  </svg>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-[11px] text-[#7A5B37]">
            Unauthorized access attempts are monitored and recorded with client IP.
          </div>
        </div>
      </div>
    </div>
  );
}
