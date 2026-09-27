"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  Menu,
  X,
  ChevronDown,
  ShieldCheck,
  MessageCircle,
} from "lucide-react";

const navItems = [
  { name: "Home", href: "/" },
  { name: "Destinations", href: "/destinations" },
  { name: "Hotels", href: "/hotels" },
  { name: "Packages", href: "/packages" },
  { name: "My Bookings", href: "/bookings" },
  { name: "About", href: "/about" },
  { name: "Contact", href: "/contact" },
];

const serviceLinks = [
  { name: "Luggage Services", href: "/lugguage/service" },
  { name: "Merchandise Services", href: "/services/luguage" },
  { name: "Family Tours", href: "/tours/family" },
  { name: "Luxury Tours", href: "/tours/luxury" },
];

// =====================================================
// WHATSAPP
// =====================================================

const whatsappNumber = "923139929970";

const whatsappMessage = encodeURIComponent(
  "Hello Haikal Tours, I would like to get more information."
);

const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;

// =====================================================
// ADJUSTABLE LAYOUT
//
//   - NAVBAR_MAX_WIDTH    -> overall width of the navbar content row
//   - LOGO_TO_NAV_GAP     -> space between the logo block and the nav links
//   - NAV_TO_BUTTONS_GAP  -> space between the nav links and the action buttons
// =====================================================

const NAVBAR_MAX_WIDTH = "max-w-[1440px]";
const NAV_ITEM_GAP = "lg:gap-1"; // spacing between individual nav links

// =====================================================
// DESIGN TOKENS (hardcoded as literal Tailwind arbitrary values
// below so the JIT compiler can pick them up — kept here as a
// single source of truth to copy from if you add new elements)
//
//   ink        #1C2420   primary text
//   muted      #6B7570   secondary text
//   teal deep  #123832   brand / active states
//   teal mid   #1B4F46   hover states
//   brass      #B8863B   the one accent — CTA + hover underline
//   brass dark #9C7430   CTA hover
//   mist       #F5F6F2   panel backgrounds
//   hairline   #E7E4D8   borders
// =====================================================

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [tourOpen, setTourOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // =====================================================
  // MOUNT
  // =====================================================

  useEffect(() => {
    setMounted(true);
  }, []);

  // =====================================================
  // SHADOW ON SCROLL — gives the header depth only once
  // there's content behind it to separate from
  // =====================================================

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // =====================================================
  // LOCK BODY SCROLL WHEN MOBILE MENU IS OPEN
  // =====================================================

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  // =====================================================
  // MOBILE MENU
  // =====================================================

  const mobileMenu = (
    <>
      {/* =====================================================
          MOBILE BACKDROP
      ====================================================== */}

      <div
        onClick={() => setMobileOpen(false)}
        className={`fixed inset-0 z-40 bg-[#12181580] backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      {/* =====================================================
          MOBILE SLIDE-IN PANEL
      ====================================================== */}

      <div
        className={`fixed inset-y-0 right-0 z-50 flex w-[85%] max-w-sm flex-col bg-[#F5F6F2] shadow-2xl transition-transform duration-300 ease-out lg:hidden ${
          mobileOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* =====================================================
            MOBILE HEADER
        ====================================================== */}

        <div className="flex h-[68px] items-center justify-between border-b border-[#E7E4D8] px-5">
          <Link
            href="/"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-3"
          >
            <div className="relative h-11 w-11 overflow-hidden rounded-xl ring-1 ring-[#B8863B]/40">
              <Image
                src="/images/haikal.jpg"
                alt="Haikal Tours logo"
                fill
                className="object-cover"
              />
            </div>

            <div className="flex flex-col leading-none">
              <span className="font-serif text-[17px] font-semibold tracking-tight text-[#123832]">
                Haikal
              </span>
              <span className="mt-1 text-[10px] font-medium tracking-wide text-[#B8863B]">
                tours &amp; travel
              </span>
            </div>
          </Link>

          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[#E7E4D8] text-[#1C2420] transition hover:border-[#123832] hover:text-[#123832]"
            aria-label="Close menu"
          >
            <X size={19} />
          </button>
        </div>

        {/* =====================================================
            MOBILE NAVIGATION
        ====================================================== */}

        <nav className="flex flex-1 flex-col overflow-y-auto px-5 py-3">

          {/* HOME */}

          <Link
            href="/"
            onClick={() => setMobileOpen(false)}
            className="border-b border-[#E7E4D8] py-4 text-[15px] font-medium text-[#1C2420] transition hover:text-[#123832]"
          >
            Home
          </Link>

          {/* =====================================================
              MOBILE SERVICES
          ====================================================== */}

          <div className="border-b border-[#E7E4D8]">
            <button
              type="button"
              onClick={() => setTourOpen((value) => !value)}
              aria-expanded={tourOpen}
              className="flex w-full items-center justify-between py-4 text-[15px] font-medium text-[#1C2420]"
            >
              Services
              <ChevronDown
                size={17}
                className={`text-[#6B7570] transition-transform duration-200 ${
                  tourOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            <div
              className={`overflow-hidden transition-all duration-300 ${
                tourOpen ? "max-h-64 pb-3" : "max-h-0"
              }`}
            >
              {serviceLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className="block rounded-lg py-2.5 pl-3 text-sm text-[#6B7570] transition hover:bg-white hover:text-[#123832]"
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>

          {/* =====================================================
              OTHER MOBILE NAV ITEMS
          ====================================================== */}

          {navItems.slice(1).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className="border-b border-[#E7E4D8] py-4 text-[15px] font-medium text-[#1C2420] transition hover:text-[#123832]"
            >
              {item.name}
            </Link>
          ))}

          {/* =====================================================
              MOBILE ACTION BUTTONS
          ====================================================== */}

          <div className="mt-auto flex flex-col gap-3 pt-6">

            {/* ADMIN */}

            <Link
              href="/admin/login"
              onClick={() => setMobileOpen(false)}
              className="flex items-center justify-center gap-2 rounded-full border border-[#E7E4D8] bg-white px-4 py-3 text-sm font-medium text-[#6B7570] transition hover:border-[#123832] hover:text-[#123832]"
            >
              <ShieldCheck size={17} />
              Admin sign in
            </Link>

            {/* WHATSAPP */}

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setMobileOpen(false)}
              className="flex items-center justify-center gap-2 rounded-full bg-[#25D366] px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#20bd5a]"
              aria-label="Chat with Haikal Tours on WhatsApp"
            >
              <MessageCircle size={18} />
              Chat on WhatsApp
            </a>

            {/* BOOK NOW */}

            <Link
              href="/booking"
              onClick={() => setMobileOpen(false)}
              className="rounded-full bg-[#B8863B] px-4 py-3 text-center text-sm font-semibold text-white shadow-[0_2px_10px_rgba(184,134,59,0.35)] transition hover:bg-[#9C7430]"
            >
              Book Now
            </Link>

          </div>
        </nav>
      </div>
    </>
  );

  // =====================================================
  // MAIN NAVBAR
  // =====================================================

  return (
    <header
      className={`sticky top-0 z-50 border-b bg-white/95 backdrop-blur-md transition-shadow duration-300 ${
        scrolled
          ? "border-[#E7E4D8] shadow-[0_4px_20px_rgba(18,56,50,0.06)]"
          : "border-transparent"
      }`}
    >
      <div
        className={`mx-auto flex h-[68px] items-center px-4 sm:px-8 lg:grid lg:grid-cols-[1fr_auto_1fr] lg:px-12 ${NAVBAR_MAX_WIDTH}`}
      >

        {/* =====================================================
            LOGO
        ====================================================== */}

        <Link
          href="/"
          onClick={() => setMobileOpen(false)}
          className="flex items-center gap-3 lg:justify-self-start"
        >
          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl ring-1 ring-[#B8863B]/40">
            <Image
              src="/images/haikal.jpg"
              alt="Haikal Tours logo"
              fill
              sizes="56px"
              className="object-cover"
            />
          </div>

          <div className="flex flex-col leading-none">
            <span className="font-serif text-[21px] font-semibold tracking-tight text-[#123832]">
              Haikal
            </span>
            <span className="mt-1 text-[11px] font-medium tracking-wide text-[#B8863B]">
              tours &amp; travel
            </span>
          </div>
        </Link>

        {/* =====================================================
            DESKTOP NAVIGATION

            Each link gets a thin brass underline that draws in on
            hover — the single signature motif for this brand.
        ====================================================== */}

        <nav
          className={`hidden items-center lg:flex lg:justify-self-center ${NAV_ITEM_GAP}`}
        >

          {/* HOME */}

          <Link
            href="/"
            className="group relative px-3 py-2 text-[14.5px] font-medium text-[#1C2420] transition-colors hover:text-[#123832]"
          >
            Home
            <span className="pointer-events-none absolute bottom-0 left-3 right-3 h-[2px] origin-left scale-x-0 bg-[#B8863B] transition-transform duration-300 ease-out group-hover:scale-x-100" />
          </Link>

          {/* =====================================================
              SERVICES DROPDOWN
          ====================================================== */}

          <div
            className="group relative"
            onMouseEnter={() => setTourOpen(true)}
            onMouseLeave={() => setTourOpen(false)}
          >
            <button
              type="button"
              onClick={() => setTourOpen((value) => !value)}
              aria-expanded={tourOpen}
              className="relative flex items-center gap-1 px-3 py-2 text-[14.5px] font-medium text-[#1C2420] transition-colors hover:text-[#123832]"
            >
              Services
              <ChevronDown
                size={15}
                className={`text-[#6B7570] transition-transform duration-200 ${
                  tourOpen ? "rotate-180" : ""
                }`}
              />
              <span
                className={`pointer-events-none absolute bottom-0 left-3 right-3 h-[2px] origin-left bg-[#B8863B] transition-transform duration-300 ease-out ${
                  tourOpen ? "scale-x-100" : "scale-x-0"
                }`}
              />
            </button>

            {tourOpen && (
              <div className="absolute left-1/2 top-full w-60 -translate-x-1/2 pt-3">
                <div className="rounded-2xl border border-[#E7E4D8] bg-white p-2 shadow-[0_12px_32px_rgba(18,56,50,0.12)]">
                  {serviceLinks.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="block rounded-xl px-4 py-2.5 text-sm text-[#1C2420] transition hover:bg-[#F5F6F2] hover:text-[#123832]"
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* =====================================================
              OTHER DESKTOP NAV ITEMS
          ====================================================== */}

          {navItems.slice(1).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group relative px-3 py-2 text-[14.5px] font-medium text-[#1C2420] transition-colors hover:text-[#123832]"
            >
              {item.name}
              <span className="pointer-events-none absolute bottom-0 left-3 right-3 h-[2px] origin-left scale-x-0 bg-[#B8863B] transition-transform duration-300 ease-out group-hover:scale-x-100" />
            </Link>
          ))}

        </nav>

        {/* =====================================================
            DESKTOP ACTION BUTTONS

            One clear hierarchy: Admin is a quiet text link, WhatsApp
            is an icon-only circular button, Book Now is the single
            solid CTA.
        ====================================================== */}

        <div className="hidden items-center gap-4 lg:flex lg:justify-self-end">

          {/* ADMIN */}

          <Link
            href="/admin/login"
            className="flex items-center gap-1.5 whitespace-nowrap text-[13.5px] font-medium text-[#6B7570] transition hover:text-[#123832]"
          >
            <ShieldCheck size={15} />
            Admin
          </Link>

          {/* WHATSAPP */}

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[#25D366]/30 bg-[#25D366]/10 text-[#1F9D4D] transition hover:bg-[#25D366] hover:text-white"
            aria-label="Chat with Haikal Tours on WhatsApp"
          >
            <MessageCircle size={18} />
          </a>

          {/* BOOK NOW */}

          <Link
            href="/booking"
            className="whitespace-nowrap rounded-full bg-[#B8863B] px-6 py-2.5 text-sm font-semibold text-white shadow-[0_2px_10px_rgba(184,134,59,0.35)] transition hover:bg-[#9C7430] hover:shadow-[0_4px_16px_rgba(184,134,59,0.45)]"
          >
            Book Now
          </Link>

        </div>

        {/* =====================================================
            MOBILE MENU BUTTON
        ====================================================== */}

        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="ml-auto flex h-10 w-10 items-center justify-center rounded-full border border-[#E7E4D8] text-[#1C2420] transition hover:border-[#123832] hover:text-[#123832] lg:hidden"
          aria-label="Open menu"
          aria-expanded={mobileOpen}
        >
          <Menu size={21} />
        </button>

      </div>

      {/* =====================================================
          MOBILE PORTAL
      ====================================================== */}

      {mounted && createPortal(mobileMenu, document.body)}

    </header>
  );
}