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

  // Security questions modal/update state
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [sportAnswer, setSportAnswer] = useState('');
  const [teacherAnswer, setTeacherAnswer] = useState('');
  const [qLoading, setQLoading] = useState(false);
  const [qMessage, setQMessage] = useState('');
  const [qError, setQError] = useState('');

  // Shiprocket & Delivery Settings state
  const [shippingMode, setShippingMode] = useState<'live_rates' | 'flat'>('live_rates');
  const [flatRate, setFlatRate] = useState<number>(79);
  const [freeAbove, setFreeAbove] = useState<number>(1500);
  const [codEnabled, setCodEnabled] = useState<boolean>(true);
  const [codFee, setCodFee] = useState<number>(0);
  const [autoShipOnPayment, setAutoShipOnPayment] = useState<boolean>(false);
  const [shippingLoading, setShippingLoading] = useState(false);
  const [shippingMsg, setShippingMsg] = useState('');
  const [shippingError, setShippingError] = useState('');

  const basePath = `/${params.adminPath}`;

  useEffect(() => {
    fetch('/api/admin/2fa/status')
      .then(r => r.json())
      .then(res => {
        if (res.success) setData(res);
      })
      .catch(console.error)
      .finally(() => setLoading(false));

    fetch('/api/admin/settings/shipping')
      .then(r => r.json())
      .then(res => {
        if (res.success && res.settings) {
          setShippingMode(res.settings.shipping_mode || 'live_rates');
          setFlatRate(res.settings.flat_rate ?? 79);
          setFreeAbove(res.settings.free_above ?? 1500);
          setCodEnabled(Boolean(res.settings.cod_enabled));
          setCodFee(res.settings.cod_fee ?? 0);
          setAutoShipOnPayment(Boolean(res.settings.auto_ship_on_payment));
        }
      })
      .catch(console.error);
  }, []);

  const handleSaveShipping = async (e: React.FormEvent) => {
    e.preventDefault();
    setShippingLoading(true);
    setShippingMsg('');
    setShippingError('');
    try {
      const res = await fetch('/api/admin/settings/shipping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shipping_mode: shippingMode,
          flat_rate: Number(flatRate),
          free_above: Number(freeAbove),
          cod_enabled: Boolean(codEnabled),
          cod_fee: Number(codFee),
          auto_ship_on_payment: Boolean(autoShipOnPayment),
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setShippingMsg('Shipping & Shiprocket logistics settings successfully saved!');
        setTimeout(() => setShippingMsg(''), 4000);
      } else {
        setShippingError(data.error || 'Failed to save shipping settings');
      }
    } catch {
      setShippingError('Network error while saving settings');
    } finally {
      setShippingLoading(false);
    }
  };

  const handleUpdateQuestions = async (e: React.FormEvent) => {
    e.preventDefault();
    setQError('');
    setQMessage('');
    setQLoading(true);

    try {
      const res = await fetch('/api/admin/security-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, sportAnswer, teacherAnswer }),
      });
      const result = await res.json();
      if (!res.ok || !result.success) {
        setQError(result.error || 'Failed to update security questions');
        setQLoading(false);
        return;
      }
      setQMessage('Security questions successfully updated!');
      setCurrentPassword('');
      setSportAnswer('');
      setTeacherAnswer('');
      setQLoading(false);
      setTimeout(() => {
        setShowQuestionModal(false);
        setQMessage('');
      }, 2000);
    } catch {
      setQError('Network error while updating questions');
      setQLoading(false);
    }
  };

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
        {/* Security Card: 2FA */}
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

        {/* Security Card: Security Questions */}
        <div className="bg-white rounded-2xl border border-[#E8DCC8] p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-2xl">❓</span>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border bg-emerald-100 text-emerald-800 border-emerald-300">
                2 Questions Active
              </span>
            </div>
            <h3 className="font-serif text-lg font-bold text-[#553E23] mb-1">
              Password Recovery Questions
            </h3>
            <p className="text-xs text-[#7A5B37] leading-relaxed mb-3">
              Used to reset your administrator password if you ever forget it:
            </p>
            <ul className="text-xs text-[#553E23] space-y-1 bg-[#FAF6EF] p-2.5 rounded-lg border border-[#E8DCC8]">
              <li>• <strong>Q1:</strong> What is your favorite sport?</li>
              <li>• <strong>Q2:</strong> Who is your favorite teacher?</li>
            </ul>
          </div>
          <div className="mt-6 pt-4 border-t border-[#E8DCC8]">
            <button
              onClick={() => {
                setQError('');
                setQMessage('');
                setShowQuestionModal(true);
              }}
              className="inline-block bg-[#553E23] hover:bg-[#3E2D1A] text-white px-4 py-2 rounded-lg text-xs font-bold transition shadow-sm"
            >
              Update Security Answers →
            </button>
          </div>
        </div>

        {/* Shipping & Shiprocket Logistics Configuration Card */}
        <div className="bg-white rounded-2xl border border-[#E8DCC8] p-6 shadow-sm md:col-span-2 space-y-6">
          <div className="flex items-center justify-between border-b border-[#E8DCC8] pb-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🚚</span>
              <div>
                <h3 className="font-serif text-lg font-bold text-[#553E23]">
                  Shiprocket Logistics &amp; Delivery Rules
                </h3>
                <p className="text-xs text-[#7A5B37]">
                  Control live rates, free shipping threshold, COD policies, and automatic order creation.
                </p>
              </div>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border bg-emerald-100 text-emerald-800 border-emerald-300">
              API Active
            </span>
          </div>

          {shippingMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
              ✓ {shippingMsg}
            </div>
          )}
          {shippingError && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
              ✕ {shippingError}
            </div>
          )}

          <form onSubmit={handleSaveShipping} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Shipping Rate Calculation Mode */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-[#553E23] uppercase tracking-wider">
                  Shipping Calculation Mode
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setShippingMode('live_rates')}
                    className={`p-3 rounded-xl border text-left text-xs font-bold transition flex flex-col gap-1 cursor-pointer ${
                      shippingMode === 'live_rates'
                        ? 'border-[#1E6B5C] bg-[#F2FAF7] text-[#1E6B5C]'
                        : 'border-[#E8DCC8] bg-white text-[#7A5B37] hover:border-[#1E6B5C]'
                    }`}
                  >
                    <span>⚡ Live Courier Rates</span>
                    <span className="text-[10px] font-normal text-[#7A5B37]">
                      Cheapest rate from Shiprocket API (BlueDart, Delhivery, etc.)
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShippingMode('flat')}
                    className={`p-3 rounded-xl border text-left text-xs font-bold transition flex flex-col gap-1 cursor-pointer ${
                      shippingMode === 'flat'
                        ? 'border-[#1E6B5C] bg-[#F2FAF7] text-[#1E6B5C]'
                        : 'border-[#E8DCC8] bg-white text-[#7A5B37] hover:border-[#1E6B5C]'
                    }`}
                  >
                    <span>📦 Flat Shipping Fee</span>
                    <span className="text-[10px] font-normal text-[#7A5B37]">
                      Fixed delivery charge for all domestic orders
                    </span>
                  </button>
                </div>
              </div>

              {/* Flat Rate & Free Above */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#553E23] mb-1">
                    Flat Shipping Rate (₹)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={flatRate}
                    onChange={(e) => setFlatRate(Number(e.target.value))}
                    required
                    className="w-full text-xs font-bold p-2.5 rounded-xl border border-[#D1C8BA] focus:outline-none focus:ring-1 focus:ring-[#1E6B5C]"
                  />
                  <p className="text-[10px] text-[#7A5B37] mt-1">Fallback if API is unreachable.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#553E23] mb-1">
                    Free Delivery Above (₹)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={freeAbove}
                    onChange={(e) => setFreeAbove(Number(e.target.value))}
                    required
                    className="w-full text-xs font-bold p-2.5 rounded-xl border border-[#D1C8BA] focus:outline-none focus:ring-1 focus:ring-[#1E6B5C]"
                  />
                  <p className="text-[10px] text-[#7A5B37] mt-1">Orders ≥ this amount get ₹0 delivery.</p>
                </div>
              </div>

              {/* COD Settings */}
              <div className="space-y-3 p-4 rounded-xl bg-[#FAF6EF] border border-[#E8DCC8]">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-bold text-[#553E23] block">
                      Enable Cash on Delivery (COD)
                    </label>
                    <span className="text-[10px] text-[#7A5B37]">
                      Allow customers to pay upon delivery via courier
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={codEnabled}
                    onChange={(e) => setCodEnabled(e.target.checked)}
                    className="w-4 h-4 accent-[#1E6B5C] cursor-pointer"
                  />
                </div>

                {codEnabled && (
                  <div className="pt-2 border-t border-[#E8DCC8]/60">
                    <label className="block text-[11px] font-bold text-[#553E23] mb-1">
                      COD Convenience Fee (₹)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={codFee}
                      onChange={(e) => setCodFee(Number(e.target.value))}
                      className="w-32 text-xs font-bold p-2 rounded-lg border border-[#D1C8BA] bg-white focus:outline-none focus:ring-1 focus:ring-[#1E6B5C]"
                    />
                    <span className="text-[10px] text-[#7A5B37] ml-2">Added to collectable amount</span>
                  </div>
                )}
              </div>

              {/* Automated Order Push Setting */}
              <div className="p-4 rounded-xl bg-[#FAF6EF] border border-[#E8DCC8] flex items-center justify-between">
                <div>
                  <label className="text-xs font-bold text-[#553E23] block">
                    Auto-Ship on Payment Success
                  </label>
                  <span className="text-[10px] text-[#7A5B37]">
                    Automatically create Shiprocket shipment &amp; assign AWB immediately upon online payment verification
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={autoShipOnPayment}
                  onChange={(e) => setAutoShipOnPayment(e.target.checked)}
                  className="w-4 h-4 accent-[#1E6B5C] cursor-pointer"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={shippingLoading}
                className="bg-[#1E6B5C] hover:bg-[#165A4A] text-white px-6 py-2.5 rounded-xl text-xs font-bold transition shadow-sm disabled:opacity-50"
              >
                {shippingLoading ? 'Saving Settings...' : 'Save Logistics Configuration'}
              </button>
            </div>
          </form>
        </div>

        {/* Security Policies */}
        <div className="bg-white rounded-2xl border border-[#E8DCC8] p-6 shadow-sm md:col-span-2">
          <div className="text-2xl mb-4">🛡️</div>
          <h3 className="font-serif text-lg font-bold text-[#553E23] mb-1">
            Active Security Protocols
          </h3>
          <ul className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2.5 text-xs text-[#553E23]">
            <li className="flex items-center justify-between py-1 border-b border-[#E8DCC8]/60">
              <span className="text-[#7A5B37]">Admin Email:</span>
              <span className="font-semibold">{data?.email || 'alumar8080@gmail.com'}</span>
            </li>
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
            <li className="flex items-center justify-between py-1 border-b border-[#E8DCC8]/60">
              <span className="text-[#7A5B37]">Last Logged IP:</span>
              <span className="font-mono text-xs">{data?.lastLoginIp || '127.0.0.1'}</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Modal for updating security questions */}
      {showQuestionModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#E8DCC8]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif text-lg font-bold text-[#553E23]">
                Update Security Answers
              </h3>
              <button
                onClick={() => setShowQuestionModal(false)}
                className="text-[#7A5B37] hover:text-[#553E23] text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {qError && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
                {qError}
              </div>
            )}
            {qMessage && (
              <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
                {qMessage}
              </div>
            )}

            <form onSubmit={handleUpdateQuestions} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#553E23] mb-1">
                  Current Master Password
                </label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  placeholder="Verify your identity"
                  className="w-full px-3 py-2 rounded-lg border border-[#E8DCC8] bg-[#FFF8EC]/30 text-xs focus:outline-none focus:ring-2 focus:ring-[#1E6B5C]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#553E23] mb-1">
                  Q1: Favorite Sport
                </label>
                <input
                  type="text"
                  required
                  value={sportAnswer}
                  onChange={e => setSportAnswer(e.target.value)}
                  placeholder="e.g. Football"
                  className="w-full px-3 py-2 rounded-lg border border-[#E8DCC8] text-xs focus:outline-none focus:ring-2 focus:ring-[#1E6B5C]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#553E23] mb-1">
                  Q2: Favorite Teacher
                </label>
                <input
                  type="text"
                  required
                  value={teacherAnswer}
                  onChange={e => setTeacherAnswer(e.target.value)}
                  placeholder="e.g. Masterji"
                  className="w-full px-3 py-2 rounded-lg border border-[#E8DCC8] text-xs focus:outline-none focus:ring-2 focus:ring-[#1E6B5C]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowQuestionModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-[#7A5B37] hover:bg-[#FAF6EF]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={qLoading}
                  className="bg-[#1E6B5C] hover:bg-[#165A4A] text-white px-4 py-2 rounded-lg text-xs font-bold transition disabled:opacity-50"
                >
                  {qLoading ? 'Saving...' : 'Save Answers'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
