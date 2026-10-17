import React from 'react';
import AnnouncementBar from '@/components/AnnouncementBar';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import QuickViewModal from '@/components/QuickViewModal';
import SearchModal from '@/components/SearchModal';
import OfferBanner from '@/components/OfferBanner';

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AnnouncementBar />
      <Navbar />
      <div className="flex-1">
        {children}
      </div>
      <Footer />
      <CartDrawer />
      <QuickViewModal />
      <SearchModal />
      <OfferBanner placement="popup" />
    </>
  );
}
