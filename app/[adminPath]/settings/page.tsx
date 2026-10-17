'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

export default function AdminSettingsPage({
  params,
}: {
  params: { adminPath: string };
}) {
  const [data, setData] = useState<{
    email: string;
    totpEnabled: boolean;
    lastLoginAt?: string;
    lastLoginIp?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const basePath = `/${params.adminPath}`;

  useEffect(() => {
    fetch('/api/admin/2fa/status')
      .then(r => r.json())
      .then(res => {
        if (res.success) setData(res);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-bold text-[#553E23]">
          System & Security Settings
        </h1>
        <p className="text-sm text-[#7A5B37] mt-1">
          Store governance, authentication controls & administrative preferences
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Security Card */}
        <div className="bg-white rounded-2xl border border-[#E8DCC8] p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-2xl">🔐</span>
              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                  data?.totpEnabled
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    : 'bg-amber-100 text-amber-800 border-amber-300'
                }`}
              >
                {loading ? '...' : data?.totpEnabled ? '2FA Enabled' : '2FA Recommended'}
              </span>
            </div>
            <h3 className="font-serif text-lg font-bold text-[#553E23] mb-1">
              Two-Factor Authentication
            </h3>
            <p className="text-xs text-[#7A5B37] leading-relaxed">
              Require an authenticator app (Google Authenticator, Authy, or 1Password) to confirm every administrator login.
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-[#E8DCC8]">
            <Link
              href={`${basePath}/settings/2fa`}
              className="inline-block bg-[#1E6B5C] hover:bg-[#165A4A] text-white px-4 py-2 rounded-lg text-xs font-bold transition shadow-sm"
            >
              Configure 2FA Settings →
            </Link>
          </div>
        </div>

        {/* Security Policies */}
        <div className="bg-white rounded-2xl border border-[#E8DCC8] p-6 shadow-sm">
          <div className="text-2xl mb-4">🛡️</div>
          <h3 className="font-serif text-lg font-bold text-[#553E23] mb-1">
            Active Security Protocols
          </h3>
          <ul className="mt-3 space-y-2.5 text-xs text-[#553E23]">
            <li className="flex items-center justify-between py-1 border-b border-[#E8DCC8]/60">
              <span className="text-[#7A5B37]">Admin Route:</span>
              <span className="font-mono font-bold text-[#1E6B5C]">/{params.adminPath}</span>
            </li>
            <li className="flex items-center justify-between py-1 border-b border-[#E8DCC8]/60">
              <span className="text-[#7A5B37]">Unauthenticated Access:</span>
              <span className="font-bold text-red-600">Silent HTTP 404</span>
            </li>
            <li className="flex items-center justify-between py-1 border-b border-[#E8DCC8]/60">
              <span className="text-[#7A5B37]">Session Expiry:</span>
              <span className="font-semibold">30 Min (Sliding)</span>
            </li>
            <li className="flex items-center justify-between py-1 border-b border-[#E8DCC8]/60">
              <span className="text-[#7A5B37]">Brute-Force Lockout:</span>
              <span className="font-semibold">5 Fails / 30 Min Lock</span>
            </li>
            <li className="flex items-center justify-between py-1">
              <span className="text-[#7A5B37]">Last Logged IP:</span>
              <span className="font-mono text-xs">{data?.lastLoginIp || '127.0.0.1'}</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
