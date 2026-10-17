'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import Tiptap to avoid SSR issues
const TiptapEditor = dynamic(() => import('@/components/TiptapEditor'), {
  ssr: false,
  loading: () => (
    <div className="p-8 text-center text-xs text-[#7A5B37] border border-[#E8DCC8] rounded-2xl bg-white animate-pulse">
      Loading Rich Text Editor...
    </div>
  ),
});

type ContentTab = 'contact' | 'announcement' | 'homepage' | 'policies' | 'footer';

interface PolicyOption {
  key: string;
  label: string;
  description: string;
}

const POLICY_OPTIONS: PolicyOption[] = [
  { key: 'shipping_policy', label: 'Shipping & Delivery Policy', description: 'Dispatch times, domestic courier partners, and free shipping terms' },
  { key: 'return_policy', label: 'Returns & Refund Policy', description: 'Return eligibility window, hygiene rules, and refund timelines' },
  { key: 'cancellation_policy', label: 'Order Cancellation Policy', description: 'Pre-dispatch full refund and post-dispatch return rules' },
  { key: 'privacy_policy', label: 'Privacy Policy (DPDP Act)', description: 'Customer data privacy, DPDP Act 2023, cookies, and processors' },
  { key: 'terms_of_service', label: 'Terms of Service', description: 'Store rules, intellectual property, pricing, and Mumbai jurisdiction' },
];

export default function AdminContentPage() {
  const [activeTab, setActiveTab] = useState<ContentTab>('contact');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activePolicy, setActivePolicy] = useState<string>('shipping_policy');

  // Key-value store of all content
  const [values, setValues] = useState<Record<string, string>>({
    // Contact
    contact_phone: '+91 98765 43210',
    contact_whatsapp: '+91 98765 43210',
    contact_email: 'wholesale@umarperfumes.com',
    contact_hours: 'Mon - Sat: 10:00 AM - 8:00 PM IST',
    contact_address: 'Bhendi Bazaar, South Mumbai, Maharashtra 400003',

    // Announcement
    announcement_bar: 'Welcome to our store • Free Shipping Across India on Orders Above ₹1500',
    announcement_link: '/collections',

    // Homepage
    hero_badge: 'Exclusive Artisanal Attars & Rare Ouds',
    hero_title: 'Pure & Natural Essential Oils',
    hero_subtitle: 'Experience the power of nature with our premium botanical essential oils. Carefully sourced and crafted to bring purity, relaxation and wellness.',
    hero_cta_text: 'Explore Oud Collection',
    hero_cta_link: '/collections',

    // Policies (HTML)
    shipping_policy: '<p>All orders are processed and dispatched within 24 to 48 hours from our Mumbai atelier. Standard domestic delivery across India takes 3 to 5 business days via BlueDart, DTDC, and Delhivery. Free shipping applies on all orders above ₹1500.</p>',
    return_policy: '<p>We accept returns for damaged, defective, or incorrect items within 7 days of package delivery. Due to cosmetic hygiene standards, opened perfume oils cannot be returned. Refunds are credited within 5 to 7 business days.</p>',
    privacy_policy: '<p>We collect only essential details (Name, Address, Phone, Email) required to fulfill your orders and provide delivery tracking updates. We do not sell or rent personal information to third parties.</p>',
    terms_policy: '<p>By browsing and purchasing from Al Umar Perfumes, you agree to our terms of service, fair pricing guidelines, and domestic delivery protocols.</p>',

    // Footer
    footer_mission: 'Curating the finest oriental fragrances, pure Cambodian Oud oil, Taif rose extracts, and inspiring Islamic texts to enrich your spiritual lifestyle.',
    gstin: '27ABCDE1234F1Z5',
    footer_copyright: '© 2026 Al Umar Perfumes. All rights reserved.',
    instagram_url: 'https://instagram.com',
    whatsapp_url: 'https://wa.me/919876543210',
  });

  useEffect(() => {
    fetch('/api/admin/content')
      .then((r) => r.json())
      .then((res) => {
        if (res.success && res.contentMap) {
          setValues((prev) => ({
            ...prev,
            ...res.contentMap,
          }));
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (key: string, val: string) => {
    setValues((prev) => ({ ...prev, [key]: val }));
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/content', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (data.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        alert(data.error || 'Failed to save changes');
      }
    } catch {
      alert('Error updating site content');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-[#553E23]">Store Content & Policies</h1>
          <p className="text-sm text-[#7A5B37] mt-1">
            Customize storefront announcements, hero messaging, legal terms, and contact credentials
          </p>
        </div>
        <div className="flex items-center gap-3">
          {saveSuccess && (
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-sm animate-pulse">
              ✓ All Changes Saved
            </span>
          )}
          <button
            onClick={handleSaveAll}
            disabled={saving || loading}
            className="bg-[#1E6B5C] hover:bg-[#165A4A] text-white px-5 py-2.5 rounded-xl text-xs font-bold transition shadow-sm disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? (
              <>
                <span className="animate-spin text-sm">⏳</span> Saving...
              </>
            ) : (
              <>
                <span>💾</span> Save All Changes
              </>
            )}
          </button>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-2 border-b border-[#E8DCC8] pb-1 overflow-x-auto">
        {(
          [
            { id: 'contact', label: 'Contact', icon: '📞' },
            { id: 'announcement', label: 'Announcement', icon: '📢' },
            { id: 'homepage', label: 'Homepage', icon: '✨' },
            { id: 'policies', label: 'Policies', icon: '📜' },
            { id: 'footer', label: 'Footer', icon: '🏛️' },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-xs font-bold rounded-xl transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-[#553E23] text-white shadow-sm'
                : 'text-[#7A5B37] hover:bg-white hover:text-[#553E23]'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* 2-Column Split: Editor Form (Left) & Live Preview (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Form Controls (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-[#E8DCC8] p-6 shadow-sm space-y-6">
          {loading ? (
            <div className="py-16 text-center text-xs text-[#7A5B37]">Loading content settings...</div>
          ) : (
            <>
              {/* Tab 1: Contact */}
              {activeTab === 'contact' && (
                <div className="space-y-4">
                  <div className="border-b border-[#E8DCC8]/60 pb-3">
                    <h2 className="font-serif text-lg font-bold text-[#553E23]">Contact & Support Details</h2>
                    <p className="text-xs text-[#7A5B37]">Shown across header contact triggers, checkout questions, and footer</p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#553E23]">Support Phone Number</label>
                    <input
                      type="text"
                      value={values.contact_phone || ''}
                      onChange={(e) => handleChange('contact_phone', e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full px-3.5 py-2 rounded-xl border border-[#E8DCC8] bg-[#FFF8EC]/30 text-xs focus:ring-2 focus:ring-[#1E6B5C] outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#553E23]">WhatsApp Business Number</label>
                    <input
                      type="text"
                      value={values.contact_whatsapp || ''}
                      onChange={(e) => handleChange('contact_whatsapp', e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full px-3.5 py-2 rounded-xl border border-[#E8DCC8] bg-[#FFF8EC]/30 text-xs focus:ring-2 focus:ring-[#1E6B5C] outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#553E23]">Customer Care Email</label>
                    <input
                      type="email"
                      value={values.contact_email || ''}
                      onChange={(e) => handleChange('contact_email', e.target.value)}
                      placeholder="wholesale@umarperfumes.com"
                      className="w-full px-3.5 py-2 rounded-xl border border-[#E8DCC8] bg-[#FFF8EC]/30 text-xs focus:ring-2 focus:ring-[#1E6B5C] outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#553E23]">Working / Support Hours</label>
                    <input
                      type="text"
                      value={values.contact_hours || ''}
                      onChange={(e) => handleChange('contact_hours', e.target.value)}
                      placeholder="Mon - Sat: 10:00 AM - 8:00 PM IST"
                      className="w-full px-3.5 py-2 rounded-xl border border-[#E8DCC8] bg-[#FFF8EC]/30 text-xs focus:ring-2 focus:ring-[#1E6B5C] outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#553E23]">Atelier / Storefront Address</label>
                    <textarea
                      rows={2}
                      value={values.contact_address || ''}
                      onChange={(e) => handleChange('contact_address', e.target.value)}
                      placeholder="Bhendi Bazaar, South Mumbai, Maharashtra 400003"
                      className="w-full px-3.5 py-2 rounded-xl border border-[#E8DCC8] bg-[#FFF8EC]/30 text-xs focus:ring-2 focus:ring-[#1E6B5C] outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Tab 2: Announcement */}
              {activeTab === 'announcement' && (
                <div className="space-y-4">
                  <div className="border-b border-[#E8DCC8]/60 pb-3">
                    <h2 className="font-serif text-lg font-bold text-[#553E23]">Top Announcement Bar</h2>
                    <p className="text-xs text-[#7A5B37]">The marquee strip pinned to the top of all storefront pages</p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#553E23]">Announcement Text</label>
                    <textarea
                      rows={3}
                      value={values.announcement_bar || ''}
                      onChange={(e) => handleChange('announcement_bar', e.target.value)}
                      placeholder="Welcome to our store • Free Shipping Across India on Orders Above ₹1500"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8DCC8] bg-[#FFF8EC]/30 text-xs focus:ring-2 focus:ring-[#1E6B5C] outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#553E23]">Link Destination (Optional)</label>
                    <input
                      type="text"
                      value={values.announcement_link || ''}
                      onChange={(e) => handleChange('announcement_link', e.target.value)}
                      placeholder="/collections"
                      className="w-full px-3.5 py-2 rounded-xl border border-[#E8DCC8] bg-[#FFF8EC]/30 text-xs focus:ring-2 focus:ring-[#1E6B5C] outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Tab 3: Homepage */}
              {activeTab === 'homepage' && (
                <div className="space-y-4">
                  <div className="border-b border-[#E8DCC8]/60 pb-3">
                    <h2 className="font-serif text-lg font-bold text-[#553E23]">Homepage Hero Section</h2>
                    <p className="text-xs text-[#7A5B37]">Main visual headline, introductory copy, and primary action button</p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#553E23]">Hero Top Badge</label>
                    <input
                      type="text"
                      value={values.hero_badge || ''}
                      onChange={(e) => handleChange('hero_badge', e.target.value)}
                      placeholder="Exclusive Artisanal Attars"
                      className="w-full px-3.5 py-2 rounded-xl border border-[#E8DCC8] bg-[#FFF8EC]/30 text-xs focus:ring-2 focus:ring-[#1E6B5C] outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#553E23]">Hero Main Title</label>
                    <input
                      type="text"
                      value={values.hero_title || ''}
                      onChange={(e) => handleChange('hero_title', e.target.value)}
                      placeholder="Pure & Natural Essential Oils"
                      className="w-full px-3.5 py-2 rounded-xl border border-[#E8DCC8] bg-[#FFF8EC]/30 text-xs focus:ring-2 focus:ring-[#1E6B5C] outline-none font-serif font-bold text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#553E23]">Hero Subtitle Copy</label>
                    <textarea
                      rows={3}
                      value={values.hero_subtitle || ''}
                      onChange={(e) => handleChange('hero_subtitle', e.target.value)}
                      placeholder="Experience the power of nature with our premium botanical essential oils..."
                      className="w-full px-3.5 py-2 rounded-xl border border-[#E8DCC8] bg-[#FFF8EC]/30 text-xs focus:ring-2 focus:ring-[#1E6B5C] outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#553E23]">Call To Action Button</label>
                      <input
                        type="text"
                        value={values.hero_cta_text || ''}
                        onChange={(e) => handleChange('hero_cta_text', e.target.value)}
                        placeholder="Explore Oud Collection"
                        className="w-full px-3.5 py-2 rounded-xl border border-[#E8DCC8] bg-[#FFF8EC]/30 text-xs focus:ring-2 focus:ring-[#1E6B5C] outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#553E23]">Button Link</label>
                      <input
                        type="text"
                        value={values.hero_cta_link || ''}
                        onChange={(e) => handleChange('hero_cta_link', e.target.value)}
                        placeholder="/collections"
                        className="w-full px-3.5 py-2 rounded-xl border border-[#E8DCC8] bg-[#FFF8EC]/30 text-xs focus:ring-2 focus:ring-[#1E6B5C] outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 4: Policies (Tiptap Rich Text Editor) */}
              {activeTab === 'policies' && (
                <div className="space-y-4">
                  <div className="border-b border-[#E8DCC8]/60 pb-3 flex items-center justify-between">
                    <div>
                      <h2 className="font-serif text-lg font-bold text-[#553E23]">Store Policies & Legal Terms</h2>
                      <p className="text-xs text-[#7A5B37]">Formatted via Tiptap rich-text editor and stored as clean HTML</p>
                    </div>
                  </div>

                  {/* Policy Switcher */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {POLICY_OPTIONS.map((opt) => (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => setActivePolicy(opt.key)}
                        className={`p-2.5 rounded-xl text-left border transition ${
                          activePolicy === opt.key
                            ? 'bg-[#FFF8EC] border-[#1E6B5C] text-[#1E6B5C] shadow-sm font-bold'
                            : 'bg-white border-[#E8DCC8] text-[#553E23] hover:bg-[#FFF8EC]/40 font-medium'
                        }`}
                      >
                        <div className="text-xs truncate">{opt.label}</div>
                      </button>
                    ))}
                  </div>

                  {/* Tiptap Editor */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-[#553E23]">
                        {POLICY_OPTIONS.find((p) => p.key === activePolicy)?.label}
                      </label>
                      <span className="text-[11px] text-[#7A5B37]">Saved as HTML</span>
                    </div>

                    <TiptapEditor
                      key={activePolicy}
                      content={values[activePolicy] || '<p></p>'}
                      onChange={(html) => handleChange(activePolicy, html)}
                    />
                  </div>
                </div>
              )}

              {/* Tab 5: Footer */}
              {activeTab === 'footer' && (
                <div className="space-y-4">
                  <div className="border-b border-[#E8DCC8]/60 pb-3">
                    <h2 className="font-serif text-lg font-bold text-[#553E23]">Footer & Compliance Credentials</h2>
                    <p className="text-xs text-[#7A5B37]">Global brand narrative, tax identification, and social channels</p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#553E23]">Brand Mission Statement</label>
                    <textarea
                      rows={3}
                      value={values.footer_mission || ''}
                      onChange={(e) => handleChange('footer_mission', e.target.value)}
                      placeholder="Curating the finest oriental fragrances..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8DCC8] bg-[#FFF8EC]/30 text-xs focus:ring-2 focus:ring-[#1E6B5C] outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#553E23]">Registered GSTIN</label>
                      <input
                        type="text"
                        value={values.gstin || ''}
                        onChange={(e) => handleChange('gstin', e.target.value)}
                        placeholder="27ABCDE1234F1Z5"
                        className="w-full px-3.5 py-2 rounded-xl border border-[#E8DCC8] bg-[#FFF8EC]/30 text-xs focus:ring-2 focus:ring-[#1E6B5C] outline-none font-mono"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#553E23]">Copyright Notice</label>
                      <input
                        type="text"
                        value={values.footer_copyright || ''}
                        onChange={(e) => handleChange('footer_copyright', e.target.value)}
                        placeholder="© 2026 Al Umar Perfumes"
                        className="w-full px-3.5 py-2 rounded-xl border border-[#E8DCC8] bg-[#FFF8EC]/30 text-xs focus:ring-2 focus:ring-[#1E6B5C] outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#553E23]">Instagram URL</label>
                      <input
                        type="url"
                        value={values.instagram_url || ''}
                        onChange={(e) => handleChange('instagram_url', e.target.value)}
                        placeholder="https://instagram.com/alumarperfumes"
                        className="w-full px-3.5 py-2 rounded-xl border border-[#E8DCC8] bg-[#FFF8EC]/30 text-xs focus:ring-2 focus:ring-[#1E6B5C] outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#553E23]">WhatsApp Channel / Link</label>
                      <input
                        type="url"
                        value={values.whatsapp_url || ''}
                        onChange={(e) => handleChange('whatsapp_url', e.target.value)}
                        placeholder="https://wa.me/919876543210"
                        className="w-full px-3.5 py-2 rounded-xl border border-[#E8DCC8] bg-[#FFF8EC]/30 text-xs focus:ring-2 focus:ring-[#1E6B5C] outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Right Column: Live Preview Panel (5 cols) */}
        <div className="lg:col-span-5 sticky top-6 space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[#553E23] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              Live Storefront Preview
            </span>
            <span className="text-[10px] text-[#7A5B37] font-semibold bg-[#FFF8EC] border border-[#E8DCC8] px-2 py-0.5 rounded-full">
              {activeTab.toUpperCase()} TAB
            </span>
          </div>

          <div className="bg-[#FAF7F2] rounded-2xl border-2 border-[#E8DCC8] p-5 shadow-md overflow-hidden min-h-[460px]">
            {/* Live Preview based on tab */}

            {/* 1. Contact Tab Preview */}
            {activeTab === 'contact' && (
              <div className="space-y-4">
                <div className="text-center pb-3 border-b border-[#E8DCC8]">
                  <div className="font-serif text-lg font-bold text-[#553E23]">Contact Our Atelier</div>
                  <div className="text-[11px] text-[#7A5B37]">We are here to assist with artisanal perfumes & wholesale</div>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="bg-white p-3.5 rounded-xl border border-[#E8DCC8] flex items-start gap-3">
                    <span className="text-base">📞</span>
                    <div>
                      <div className="font-bold text-[#553E23]">Phone Inquiries</div>
                      <div className="text-[#7A5B37] font-mono">{values.contact_phone || 'Not set'}</div>
                      <div className="text-[10px] text-gray-400 mt-0.5">{values.contact_hours}</div>
                    </div>
                  </div>

                  <div className="bg-white p-3.5 rounded-xl border border-[#E8DCC8] flex items-start gap-3">
                    <span className="text-base">💬</span>
                    <div>
                      <div className="font-bold text-[#553E23]">WhatsApp Concierge</div>
                      <div className="text-[#1E6B5C] font-mono font-bold">{values.contact_whatsapp || 'Not set'}</div>
                      <div className="text-[10px] text-gray-400 mt-0.5">Instant ordering & scent consultation</div>
                    </div>
                  </div>

                  <div className="bg-white p-3.5 rounded-xl border border-[#E8DCC8] flex items-start gap-3">
                    <span className="text-base">✉️</span>
                    <div>
                      <div className="font-bold text-[#553E23]">Email Address</div>
                      <div className="text-[#7A5B37]">{values.contact_email || 'Not set'}</div>
                    </div>
                  </div>

                  <div className="bg-white p-3.5 rounded-xl border border-[#E8DCC8] flex items-start gap-3">
                    <span className="text-base">📍</span>
                    <div>
                      <div className="font-bold text-[#553E23]">Boutique Address</div>
                      <div className="text-[#7A5B37] leading-relaxed">{values.contact_address || 'Not set'}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 2. Announcement Tab Preview */}
            {activeTab === 'announcement' && (
              <div className="space-y-4">
                <div className="text-xs font-bold text-[#7A5B37]">STOREFRONT TOP STRIP</div>
                <div className="bg-[#553E23] text-[#FFF8EC] py-2.5 px-4 rounded-xl text-center text-xs font-medium tracking-wide shadow-sm flex items-center justify-center gap-2">
                  <span>{values.announcement_bar || 'Your announcement will appear here'}</span>
                  {values.announcement_link && <span className="text-[10px] text-[#D4AF37] underline">→</span>}
                </div>

                <div className="mt-8 p-4 rounded-xl bg-white border border-[#E8DCC8] text-xs text-[#7A5B37] space-y-2">
                  <div className="font-bold text-[#553E23]">Behavior note:</div>
                  <p>
                    This announcement bar renders at the very top of the desktop & mobile storefront navigation. If an active
                    Offer Banner with <code className="bg-[#FFF8EC] px-1 py-0.5 rounded text-[#1E6B5C]">top_bar</code> placement is scheduled, it temporarily takes precedence over this text.
                  </p>
                </div>
              </div>
            )}

            {/* 3. Homepage Tab Preview */}
            {activeTab === 'homepage' && (
              <div className="space-y-4">
                <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-[#553E23] to-[#362615] text-[#FFF8EC] p-6 shadow-inner text-center space-y-3">
                  {values.hero_badge && (
                    <span className="inline-block bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#D4AF37] text-[10px] font-bold tracking-widest uppercase px-2.5 py-0.5 rounded-full">
                      {values.hero_badge}
                    </span>
                  )}
                  <h3 className="font-serif text-xl font-bold text-white tracking-wide leading-tight">
                    {values.hero_title || 'Hero Title Goes Here'}
                  </h3>
                  <p className="text-xs text-[#FFF8EC]/80 leading-relaxed max-w-sm mx-auto">
                    {values.hero_subtitle || 'Hero subtitle will appear here and describe your perfumes.'}
                  </p>
                  <div className="pt-2">
                    <span className="inline-block bg-[#1E6B5C] text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md">
                      {values.hero_cta_text || 'Shop Now'} →
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* 4. Policies Tab Preview */}
            {activeTab === 'policies' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-[#E8DCC8] pb-2">
                  <div className="font-serif font-bold text-sm text-[#553E23]">
                    {POLICY_OPTIONS.find((p) => p.key === activePolicy)?.label}
                  </div>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                    Rendered HTML
                  </span>
                </div>

                <div className="bg-white rounded-xl border border-[#E8DCC8] p-4 text-xs leading-relaxed max-h-[360px] overflow-y-auto">
                  <div
                    className="prose prose-sm max-w-none text-[#4A3F33]"
                    dangerouslySetInnerHTML={{
                      __html: values[activePolicy] || '<p className="text-gray-400 italic">No content written yet.</p>',
                    }}
                  />
                </div>
              </div>
            )}

            {/* 5. Footer Tab Preview */}
            {activeTab === 'footer' && (
              <div className="space-y-4">
                <div className="bg-[#362615] text-[#FFF8EC] p-5 rounded-2xl space-y-3 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-[#D4AF37] flex items-center justify-center text-[#553E23] font-bold font-serif text-xs">
                      ع
                    </div>
                    <div className="font-serif font-bold text-white tracking-wider">AL UMAR</div>
                  </div>

                  <p className="text-[11px] text-[#FFF8EC]/80 leading-relaxed">
                    {values.footer_mission || 'Brand mission text here...'}
                  </p>

                  <div className="pt-2 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-[10px] text-[#FFF8EC]/60">
                    <div className="font-mono">GSTIN: {values.gstin || '27XXXXX'}</div>
                    <div className="flex gap-2 text-white">
                      <span>📷 Instagram</span>
                      <span>💬 WhatsApp</span>
                    </div>
                  </div>

                  <div className="text-[10px] text-[#FFF8EC]/40 text-center pt-1">
                    {values.footer_copyright}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
