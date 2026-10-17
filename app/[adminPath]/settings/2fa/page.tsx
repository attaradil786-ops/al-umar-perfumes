'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

export default function TwoFactorSetupPage({
  params,
}: {
  params: { adminPath: string };
}) {
  const [totpEnabled, setTotpEnabled] = useState<boolean | null>(null);
  const [adminEmail, setAdminEmail] = useState('');
  const [loading, setLoading] = useState(true);

  // Setup state
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [generatedSecret, setGeneratedSecret] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [verifyToken, setVerifyToken] = useState('');
  const [setupError, setSetupError] = useState('');
  const [setupSuccess, setSetupSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Disable state
  const [isDisabling, setIsDisabling] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [disableToken, setDisableToken] = useState('');
  const [disableError, setDisableError] = useState('');

  const basePath = `/${params.adminPath}`;

  const fetchStatus = () => {
    setLoading(true);
    fetch('/api/admin/2fa/status')
      .then(r => r.json())
      .then(res => {
        if (res.success) {
          setTotpEnabled(res.totpEnabled);
          setAdminEmail(res.email);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleStartSetup = async () => {
    setSetupError('');
    setSetupSuccess('');
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/2fa/generate', { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        setGeneratedSecret(json.secret);
        setQrCodeUrl(json.qrCodeUrl);
        setIsSettingUp(true);
      } else {
        setSetupError(json.error || 'Failed to generate 2FA secret');
      }
    } catch {
      setSetupError('Connection failed while generating secret');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifySetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSetupError('');
    setSetupSuccess('');
    setSubmitting(true);

    try {
      const res = await fetch('/api/admin/2fa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          secret: generatedSecret,
          token: verifyToken,
        }),
      });
      const json = await res.json();

      if (json.success) {
        setSetupSuccess('Two-Factor Authentication is now enabled on your account!');
        setTotpEnabled(true);
        setIsSettingUp(false);
        setVerifyToken('');
        // Reload status
        fetchStatus();
      } else {
        setSetupError(json.error || 'Verification code failed. Please check your app.');
      }
    } catch {
      setSetupError('An error occurred during verification.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDisable2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setDisableError('');
    setSubmitting(true);

    try {
      const res = await fetch('/api/admin/2fa/disable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password: currentPassword,
          token: disableToken,
        }),
      });
      const json = await res.json();

      if (json.success) {
        setIsDisabling(false);
        setCurrentPassword('');
        setDisableToken('');
        fetchStatus();
      } else {
        setDisableError(json.error || 'Failed to disable 2FA. Verify password and code.');
      }
    } catch {
      setDisableError('An error occurred while disabling 2FA.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-8">
      {/* Breadcrumb & Header */}
      <div>
        <div className="text-xs text-[#7A5B37] mb-2 flex items-center gap-2">
          <Link href={basePath} className="hover:underline">Dashboard</Link>
          <span>/</span>
          <Link href={`${basePath}/settings`} className="hover:underline">Settings</Link>
          <span>/</span>
          <span className="text-[#1E6B5C] font-semibold">Two-Factor Authentication</span>
        </div>
        <h1 className="font-serif text-3xl font-bold text-[#553E23]">
          Two-Factor Authentication (TOTP 2FA)
        </h1>
        <p className="text-sm text-[#7A5B37] mt-1">
          Enforce high-grade cryptographic security for administrator accounts via Google Authenticator or Authy
        </p>
      </div>

      {/* Main Status Card */}
      <div className="bg-white rounded-2xl border border-[#E8DCC8] p-8 shadow-sm">
        {loading ? (
          <div className="py-8 text-center text-sm text-[#7A5B37]">
            Querying security parameters...
          </div>
        ) : totpEnabled ? (
          /* 2FA ENABLED STATE */
          <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 rounded-xl bg-emerald-50 border border-emerald-200">
              <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-2xl font-bold">
                ✓
              </div>
              <div>
                <div className="font-bold text-emerald-950 text-base flex items-center gap-2">
                  <span>Two-Factor Authentication is Active</span>
                  <span className="bg-emerald-200 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                    Protected
                  </span>
                </div>
                <div className="text-xs text-emerald-800 mt-0.5">
                  Your administrator login ({adminEmail}) requires a 6-digit TOTP token on every session creation.
                </div>
              </div>
            </div>

            <div className="text-sm text-[#553E23] leading-relaxed">
              <h3 className="font-bold mb-1">Security Protocols Active:</h3>
              <ul className="list-disc list-inside space-y-1 text-xs text-[#7A5B37]">
                <li>AES-256-GCM secret encryption at rest</li>
                <li>Silent 404 response on unauthenticated requests</li>
                <li>Brute-force lockout: 5 failures locks IP for 30 minutes</li>
                <li>Instant new-IP email notification dispatched via Resend</li>
              </ul>
            </div>

            {!isDisabling ? (
              <div className="pt-4 border-t border-[#E8DCC8]">
                <button
                  onClick={() => setIsDisabling(true)}
                  className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 px-4 py-2 rounded-lg text-xs font-bold transition"
                >
                  Disable 2FA Protection
                </button>
              </div>
            ) : (
              <form onSubmit={handleDisable2FA} className="pt-4 border-t border-[#E8DCC8] space-y-4 bg-red-50/50 p-5 rounded-xl border border-red-100">
                <div className="font-bold text-sm text-red-900">
                  Confirm 2FA Deactivation
                </div>
                <p className="text-xs text-red-700">
                  Enter your current master password and current 6-digit authenticator code to remove 2FA.
                </p>

                {disableError && (
                  <div className="text-xs text-red-700 font-semibold bg-red-100 p-2.5 rounded-lg border border-red-200">
                    {disableError}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#553E23] mb-1">
                      Current Password
                    </label>
                    <input
                      type="password"
                      required
                      value={currentPassword}
                      onChange={e => setCurrentPassword(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-[#E8DCC8] text-xs bg-white"
                      placeholder="••••••••••••"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#553E23] mb-1">
                      Current 6-Digit 2FA Code
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={disableToken}
                      onChange={e => setDisableToken(e.target.value.replace(/\D/g, ''))}
                      className="w-full px-3 py-2 rounded-lg border border-[#E8DCC8] text-xs bg-white font-mono"
                      placeholder="123456"
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-xs font-bold transition disabled:opacity-60"
                  >
                    {submitting ? 'Verifying...' : 'Confirm Deactivation'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsDisabling(false)}
                    className="bg-white border border-[#E8DCC8] text-[#553E23] px-4 py-2 rounded-lg text-xs font-bold"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        ) : (
          /* 2FA DISABLED STATE */
          <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 rounded-xl bg-amber-50 border border-amber-200">
              <div className="w-12 h-12 rounded-xl bg-amber-500 text-white flex items-center justify-center text-2xl font-bold">
                !
              </div>
              <div>
                <div className="font-bold text-amber-950 text-base">
                  Two-Factor Authentication is Currently Disabled
                </div>
                <div className="text-xs text-amber-800 mt-0.5">
                  Protect your boutique store and sensitive client orders by activating TOTP 2FA.
                </div>
              </div>
            </div>

            {setupSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
                {setupSuccess}
              </div>
            )}

            {!isSettingUp ? (
              <div>
                <button
                  onClick={handleStartSetup}
                  disabled={submitting}
                  className="bg-[#1E6B5C] hover:bg-[#165A4A] text-white px-6 py-3 rounded-lg text-xs font-bold tracking-wide transition shadow-sm disabled:opacity-60 flex items-center gap-2"
                >
                  <span>{submitting ? 'Generating Secret...' : 'Begin 2FA Setup Flow →'}</span>
                </button>
              </div>
            ) : (
              <div className="space-y-6 pt-4 border-t border-[#E8DCC8]">
                {setupError && (
                  <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
                    {setupError}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center bg-[#FFF8EC]/40 p-6 rounded-2xl border border-[#E8DCC8]">
                  {/* QR Code */}
                  <div className="flex flex-col items-center justify-center text-center">
                    <div className="bg-white p-3 rounded-xl border border-[#E8DCC8] shadow-sm">
                      {qrCodeUrl ? (
                        <img
                          src={qrCodeUrl}
                          alt="2FA QR Code"
                          className="w-48 h-48 block"
                        />
                      ) : (
                        <div className="w-48 h-48 flex items-center justify-center text-xs text-[#7A5B37]">
                          Generating QR...
                        </div>
                      )}
                    </div>
                    <div className="text-[11px] text-[#7A5B37] mt-3 font-semibold">
                      Scan with Google Authenticator or Authy
                    </div>
                  </div>

                  {/* Manual Key & Confirm */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-[#553E23] uppercase tracking-wider mb-1">
                        Manual Entry Secret Key
                      </label>
                      <div className="p-2.5 rounded-lg bg-white border border-[#E8DCC8] font-mono text-xs text-[#1E6B5C] font-bold select-all break-all">
                        {generatedSecret}
                      </div>
                    </div>

                    <form onSubmit={handleVerifySetup} className="space-y-3">
                      <div>
                        <label className="block text-xs font-bold text-[#553E23] uppercase tracking-wider mb-1">
                          Enter 6-Digit App Code
                        </label>
                        <input
                          type="text"
                          required
                          maxLength={6}
                          value={verifyToken}
                          onChange={e => setVerifyToken(e.target.value.replace(/\D/g, ''))}
                          placeholder="e.g. 123456"
                          className="w-full px-3.5 py-2.5 rounded-lg border border-[#E8DCC8] bg-white text-base tracking-widest text-center font-mono font-bold focus:ring-2 focus:ring-[#1E6B5C] outline-none"
                        />
                      </div>

                      <div className="flex gap-3 pt-2">
                        <button
                          type="submit"
                          disabled={submitting || verifyToken.length !== 6}
                          className="flex-1 bg-[#1E6B5C] hover:bg-[#165A4A] text-white py-2.5 rounded-lg text-xs font-bold transition shadow-sm disabled:opacity-50"
                        >
                          {submitting ? 'Verifying...' : 'Verify & Enable 2FA'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsSettingUp(false)}
                          className="bg-white border border-[#E8DCC8] text-[#553E23] px-4 py-2.5 rounded-lg text-xs font-bold"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
