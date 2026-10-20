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
  const [mode, setMode] = useState<'login' | 'forgot'>('login');

  // Login form state
  const [email, setEmail] = useState('alumar8080@gmail.com');
  const [password, setPassword] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Forgot password form state
  const [resetEmail, setResetEmail] = useState('alumar8080@gmail.com');
  const [sportAnswer, setSportAnswer] = useState('');
  const [teacherAnswer, setTeacherAnswer] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setIsLoading(true);

    try {
      const res = await signIn('credentials', {
        email: email.trim().toLowerCase(),
        password,
        totpCode: totpCode.trim(),
        redirect: false,
      });

      if (!res || res.error || !res.ok) {
        setErrorMessage('Invalid credentials. Please verify your email and password.');
        setIsLoading(false);
        return;
      }

      // Successful login -> Navigate to callbackUrl or admin root dashboard
      const searchParams = new URLSearchParams(window.location.search);
      const callbackUrl = searchParams.get('callbackUrl') || `/${params.adminPath}`;
      router.push(callbackUrl);
      router.refresh();
    } catch {
      setErrorMessage('Invalid credentials. Please verify your email and password.');
      setIsLoading(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (newPassword !== confirmPassword) {
      setErrorMessage('New password and confirmation do not match.');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    setIsResetting(true);

    try {
      const res = await fetch('/api/admin/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: resetEmail.trim().toLowerCase(),
          sportAnswer,
          teacherAnswer,
          newPassword,
          confirmPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.error || 'Failed to reset password. Please check your answers.');
        setIsResetting(false);
        return;
      }

      // Reset successful!
      setSuccessMessage('Password successfully reset! Please sign in with your new password.');
      setPassword('');
      setSportAnswer('');
      setTeacherAnswer('');
      setNewPassword('');
      setConfirmPassword('');
      setMode('login');
      setIsResetting(false);
    } catch {
      setErrorMessage('Network error. Failed to reset password.');
      setIsResetting(false);
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
          {mode === 'login' ? 'Restricted Administration Gateway' : 'Security Question Password Recovery'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl rounded-2xl border border-[#E8DCC8] sm:px-10">
          {/* Success Banner */}
          {successMessage && (
            <div className="mb-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>{successMessage}</span>
            </div>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{errorMessage}</span>
            </div>
          )}

          {mode === 'login' ? (
            /* ================= LOGIN FORM ================= */
            <form className="space-y-5" onSubmit={handleLoginSubmit}>
              <div>
                <label className="block text-xs font-bold text-[#553E23] uppercase tracking-wider mb-1.5">
                  Admin Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="alumar8080@gmail.com"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#E8DCC8] bg-[#FFF8EC]/30 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E6B5C] focus:border-transparent transition"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-[#553E23] uppercase tracking-wider">
                    Master Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMessage('');
                      setSuccessMessage('');
                      setMode('forgot');
                    }}
                    className="text-xs font-medium text-[#1E6B5C] hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>
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
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </>
                )}
              </button>
            </form>
          ) : (
            /* ================= FORGOT PASSWORD FORM ================= */
            <form className="space-y-4" onSubmit={handleResetSubmit}>
              <div>
                <label className="block text-xs font-bold text-[#553E23] uppercase tracking-wider mb-1">
                  Admin Email
                </label>
                <input
                  type="email"
                  required
                  value={resetEmail}
                  onChange={e => setResetEmail(e.target.value)}
                  placeholder="alumar8080@gmail.com"
                  className="w-full px-3.5 py-2 rounded-lg border border-[#E8DCC8] bg-[#FFF8EC]/30 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E6B5C] transition"
                />
              </div>

              {/* Security Question 1 */}
              <div className="p-3 bg-[#FAF6EF] rounded-xl border border-[#E8DCC8]">
                <label className="block text-xs font-bold text-[#553E23] mb-1">
                  Security Question 1: What is your favorite sport?
                </label>
                <input
                  type="text"
                  required
                  value={sportAnswer}
                  onChange={e => setSportAnswer(e.target.value)}
                  placeholder="Enter your favorite sport"
                  className="w-full px-3 py-2 rounded-lg border border-[#E8DCC8] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1E6B5C] transition"
                />
              </div>

              {/* Security Question 2 */}
              <div className="p-3 bg-[#FAF6EF] rounded-xl border border-[#E8DCC8]">
                <label className="block text-xs font-bold text-[#553E23] mb-1">
                  Security Question 2: Who is your favorite teacher?
                </label>
                <input
                  type="text"
                  required
                  value={teacherAnswer}
                  onChange={e => setTeacherAnswer(e.target.value)}
                  placeholder="Enter your favorite teacher"
                  className="w-full px-3 py-2 rounded-lg border border-[#E8DCC8] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1E6B5C] transition"
                />
              </div>

              {/* New Password */}
              <div>
                <label className="block text-xs font-bold text-[#553E23] uppercase tracking-wider mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full px-3.5 py-2 rounded-lg border border-[#E8DCC8] bg-[#FFF8EC]/30 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E6B5C] transition"
                />
              </div>

              {/* Confirm New Password */}
              <div>
                <label className="block text-xs font-bold text-[#553E23] uppercase tracking-wider mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  className="w-full px-3.5 py-2 rounded-lg border border-[#E8DCC8] bg-[#FFF8EC]/30 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E6B5C] transition"
                />
              </div>

              <button
                type="submit"
                disabled={isResetting}
                className="w-full bg-[#1E6B5C] hover:bg-[#165A4A] text-white py-3 rounded-lg text-sm font-bold tracking-wide transition shadow-md hover:shadow-lg disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {isResetting ? (
                  <span>Verifying Answers & Updating...</span>
                ) : (
                  <span>Verify Answers & Reset Password</span>
                )}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage('');
                    setSuccessMessage('');
                    setMode('login');
                  }}
                  className="text-xs text-[#553E23] hover:text-[#1E6B5C] font-semibold underline"
                >
                  ← Back to Sign In
                </button>
              </div>
            </form>
          )}

          <div className="mt-6 text-center text-[11px] text-[#7A5B37]">
            Unauthorized access attempts are monitored and recorded with client IP.
          </div>
        </div>
      </div>
    </div>
  );
}
