"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import {
  Menu,
  X,
  ChevronDown,
  ShieldCheck,
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

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [tourOpen, setTourOpen] = useState(false);

  // Lock body scroll while mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/95 backdrop-blur-md">
      {/* =====================================================
          MAIN NAVBAR
      ====================================================== */}

      <div className="mx-auto flex h-[96px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

        {/* =====================================================
            LOGO
        ====================================================== */}

        <Link
          href="/"
          onClick={() => setMobileOpen(false)}
          className="flex items-center gap-3"
        >
          <Image
            src="/images/haikal.jpg"
            alt="Haikal Tours logo"
            width={96}
            height={64}
            priority
            className="h-14 w-21 rounded-xl object-cover shadow-sm sm:h-21 sm:w-27"
          />

          <div className="flex flex-col leading-none">
            <span className="text-lg font-extrabold tracking-wide text-gray-900 sm:text-xl">
              HAIKAL
            </span>

            <span className="mt-1 text-[10px] font-semibold tracking-[0.3em] text-teal-700 sm:text-xs">
              TOURS
            </span>
          </div>
        </Link>

        {/* =====================================================
            DESKTOP NAVIGATION
        ====================================================== */}

        <nav className="hidden items-center gap-1 lg:flex">

          {/* Home */}

          <Link
            href="/"
            className="rounded-md px-3 py-2 text-sm font-medium text-gray-700 transition hover:text-teal-700"
          >
            Home
          </Link>

          {/* =================================================
              SERVICES DROPDOWN
          ================================================== */}

          <div
            className="relative"
            onMouseEnter={() => setTourOpen(true)}
            onMouseLeave={() => setTourOpen(false)}
          >
            <button
              type="button"
              onClick={() => setTourOpen((value) => !value)}
              aria-expanded={tourOpen}
              className="flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium text-gray-700 transition hover:text-teal-700"
            >
              Services

              <ChevronDown
                size={15}
                className={`transition-transform duration-200 ${
                  tourOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {tourOpen && (
              <div className="absolute left-1/2 top-full w-56 -translate-x-1/2 pt-3">
                <div className="rounded-xl border border-gray-100 bg-white p-2 shadow-xl ring-1 ring-black/5">
                  {serviceLinks.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="block rounded-lg px-4 py-2.5 text-sm text-gray-700 transition hover:bg-teal-50 hover:text-teal-700"
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Remaining navigation items */}

          {navItems.slice(1).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-2 text-sm font-medium text-gray-700 transition hover:text-teal-700"
            >
              {item.name}
            </Link>
          ))}
        </nav>

        {/* =====================================================
            DESKTOP ACTIONS
        ====================================================== */}

        <div className="hidden items-center gap-3 lg:flex">

          {/* Admin */}

          <Link
            href="/admin/login"
            className="flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:border-teal-600 hover:text-teal-700"
          >
            <ShieldCheck size={17} />
            Admin
          </Link>

          {/* Book Now */}

          <Link
            href="/booking"
            className="rounded-lg bg-teal-700 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-teal-800 hover:shadow-md"
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
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-700 transition hover:border-teal-600 hover:text-teal-700 lg:hidden"
          aria-label="Open menu"
          aria-expanded={mobileOpen}
        >
          <Menu size={22} />
        </button>
      </div>

      {/* =====================================================
          MOBILE MENU BACKDROP
      ====================================================== */}

      <div
        onClick={() => setMobileOpen(false)}
        className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
          mobileOpen
            ? "opacity-100"
            : "pointer-events-none opacity-0"
        }`}
      />

      {/* =====================================================
          MOBILE SLIDE-IN PANEL
      ====================================================== */}

      <div
        className={`fixed inset-y-0 right-0 z-50 flex w-[85%] max-w-sm flex-col bg-white shadow-2xl transition-transform duration-300 ease-out lg:hidden ${
          mobileOpen
            ? "translate-x-0"
            : "translate-x-full"
        }`}
      >
        {/* =================================================
            MOBILE PANEL HEADER
        ================================================== */}

        <div className="flex h-[88px] items-center justify-between border-b border-gray-100 px-5">

          {/* Mobile Logo */}

          <Link
            href="/"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-2.5"
          >
            <Image
              src="/images/haikal.jpg"
              alt="Haikal Tours logo"
              width={80}
              height={52}
              className="h-12 w-20 rounded-lg object-cover shadow-sm"
            />

            <div className="flex flex-col leading-none">
              <span className="text-base font-extrabold tracking-wide text-gray-900">
                HAIKAL
              </span>

              <span className="mt-1 text-[9px] font-semibold tracking-[0.25em] text-teal-700">
                TOURS
              </span>
            </div>
          </Link>

          {/* Close button */}

          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-700 transition hover:border-teal-600 hover:text-teal-700"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* =================================================
            MOBILE NAVIGATION
        ================================================== */}

        <nav className="flex flex-1 flex-col overflow-y-auto px-5 py-4">

          {/* Home */}

          <Link
            href="/"
            onClick={() => setMobileOpen(false)}
            className="border-b border-gray-100 py-4 text-[15px] font-medium text-gray-800 transition hover:text-teal-700"
          >
            Home
          </Link>

          {/* =================================================
              MOBILE SERVICES ACCORDION
          ================================================== */}

          <div className="border-b border-gray-100">

            <button
              type="button"
              onClick={() => setTourOpen((value) => !value)}
              aria-expanded={tourOpen}
              className="flex w-full items-center justify-between py-4 text-[15px] font-medium text-gray-800"
            >
              Services

              <ChevronDown
                size={17}
                className={`text-gray-400 transition-transform duration-200 ${
                  tourOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            <div
              className={`overflow-hidden transition-all duration-300 ${
                tourOpen
                  ? "max-h-64 pb-3"
                  : "max-h-0"
              }`}
            >
              {serviceLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className="block rounded-lg py-2.5 pl-3 text-sm text-gray-600 transition hover:bg-teal-50 hover:text-teal-700"
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Remaining navigation items */}

          {navItems.slice(1).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className="border-b border-gray-100 py-4 text-[15px] font-medium text-gray-800 transition hover:text-teal-700"
            >
              {item.name}
            </Link>
          ))}

          {/* =================================================
              MOBILE ACTIONS
          ================================================== */}

          <div className="mt-auto flex flex-col gap-3 pt-6">

            {/* Admin Sign In */}

            <Link
              href="/admin/login"
              onClick={() => setMobileOpen(false)}
              className="flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 transition hover:border-teal-600 hover:text-teal-700"
            >
              <ShieldCheck size={18} />
              Admin Sign In
            </Link>

            {/* Book Now */}

            <Link
              href="/booking"
              onClick={() => setMobileOpen(false)}
              className="rounded-lg bg-teal-700 px-4 py-3 text-center text-sm font-bold text-white shadow-sm transition hover:bg-teal-800"
            >
              Book Now
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}