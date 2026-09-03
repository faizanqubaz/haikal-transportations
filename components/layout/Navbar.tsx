"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Menu,
  X,
  ChevronDown,
  ShieldCheck,
} from "lucide-react";

const navItems = [
  {
    name: "Home",
    href: "/",
  },
  {
    name: "Tours",
    href: "/tours",
  },
  {
    name: "Destinations",
    href: "/destinations",
  },
  {
    name: "Hotels",
    href: "/hotels",
  },
  {
    name: "Packages",
    href: "/packages",
  },
  {
    name: "My Bookings",
    href: "/bookings",
  },
  {
    name: "About",
    href: "/about",
  },
  {
    name: "Contact",
    href: "/contact",
  },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [tourOpen, setTourOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/95 backdrop-blur-md">

      <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

        {/* ================= LOGO ================= */}

        <Link
          href="/"
          className="flex items-center gap-3"
        >
          {/* Replace this with your actual logo */}
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-teal-700 text-xl font-bold text-white shadow-sm">
            H
          </div>

          <div className="flex flex-col leading-none">
            <span className="text-lg font-extrabold tracking-wide text-gray-900">
              HAIKAL
            </span>

            <span className="mt-1 text-[10px] font-semibold tracking-[0.3em] text-teal-700">
              TOURS
            </span>
          </div>
        </Link>

        {/* ================= DESKTOP NAV ================= */}

        <nav className="hidden items-center gap-7 lg:flex">

          <Link
            href="/"
            className="text-sm font-medium text-gray-700 transition hover:text-teal-700"
          >
            Home
          </Link>

          {/* Tours Dropdown */}
          <div className="relative">

            <button
              onClick={() => setTourOpen(!tourOpen)}
              className="flex items-center gap-1 text-sm font-medium text-gray-700 transition hover:text-teal-700"
            >
              Tours
              <ChevronDown
                size={15}
                className={`transition ${
                  tourOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {tourOpen && (
              <div className="absolute left-1/2 top-full mt-4 w-52 -translate-x-1/2 rounded-xl border border-gray-100 bg-white p-2 shadow-xl">

                <Link
                  href="/tours"
                  className="block rounded-lg px-4 py-3 text-sm text-gray-700 hover:bg-teal-50 hover:text-teal-700"
                >
                  All Tours
                </Link>

                <Link
                  href="/tours/adventure"
                  className="block rounded-lg px-4 py-3 text-sm text-gray-700 hover:bg-teal-50 hover:text-teal-700"
                >
                  Adventure Tours
                </Link>

                <Link
                  href="/tours/family"
                  className="block rounded-lg px-4 py-3 text-sm text-gray-700 hover:bg-teal-50 hover:text-teal-700"
                >
                  Family Tours
                </Link>

                <Link
                  href="/tours/luxury"
                  className="block rounded-lg px-4 py-3 text-sm text-gray-700 hover:bg-teal-50 hover:text-teal-700"
                >
                  Luxury Tours
                </Link>

              </div>
            )}

          </div>

          <Link
            href="/destinations"
            className="text-sm font-medium text-gray-700 transition hover:text-teal-700"
          >
            Destinations
          </Link>

          <Link
            href="/hotels"
            className="text-sm font-medium text-gray-700 transition hover:text-teal-700"
          >
            Hotels
          </Link>

          <Link
            href="/packages"
            className="text-sm font-medium text-gray-700 transition hover:text-teal-700"
          >
            Packages
          </Link>

          <Link
            href="/bookings"
            className="text-sm font-medium text-gray-700 transition hover:text-teal-700"
          >
            My Bookings
          </Link>

          <Link
            href="/about"
            className="text-sm font-medium text-gray-700 transition hover:text-teal-700"
          >
            About
          </Link>

          <Link
            href="/contact"
            className="text-sm font-medium text-gray-700 transition hover:text-teal-700"
          >
            Contact
          </Link>

        </nav>

        {/* ================= DESKTOP ACTIONS ================= */}

        <div className="hidden items-center gap-3 lg:flex">

          <Link
            href="/admin/login"
            className="flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:border-teal-600 hover:text-teal-700"
          >
            <ShieldCheck size={17} />
            Admin
          </Link>

          <Link
            href="/booking"
            className="rounded-lg bg-teal-700 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-teal-800 hover:shadow-md"
          >
            Book Now
          </Link>

        </div>

        {/* ================= MOBILE MENU BUTTON ================= */}

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-700 lg:hidden"
          aria-label="Toggle menu"
        >
          {mobileOpen ? (
            <X size={23} />
          ) : (
            <Menu size={23} />
          )}
        </button>

      </div>

      {/* ================= MOBILE MENU ================= */}

      {mobileOpen && (
        <div className="border-t border-gray-100 bg-white shadow-lg lg:hidden">

          <nav className="mx-auto flex max-w-7xl flex-col px-4 py-4 sm:px-6">

            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="border-b border-gray-100 px-2 py-4 text-sm font-medium text-gray-700 transition hover:text-teal-700"
              >
                {item.name}
              </Link>
            ))}

            {/* Admin */}

            <Link
              href="/admin/login"
              onClick={() => setMobileOpen(false)}
              className="mt-4 flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700"
            >
              <ShieldCheck size={18} />
              Admin Sign In
            </Link>

            {/* Book */}

            <Link
              href="/booking"
              onClick={() => setMobileOpen(false)}
              className="mt-3 rounded-lg bg-teal-700 px-4 py-3 text-center text-sm font-bold text-white"
            >
              Book Now
            </Link>

          </nav>

        </div>
      )}

    </header>
  );
}