
"use client";

import Link from "next/link";
import { useState } from "react";

import {
  LayoutDashboard,
  CalendarCheck,
  Bus,
  Users,
  MapPin,
  Hotel,
  Package,
  Navigation,
  UserRoundCog,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  Search,
  ChevronRight,
  Clock3,
  ArrowUpRight,
  CircleCheck,
  CircleAlert,
  TrendingUp,
} from "lucide-react";

const menuItems = [
  {
    name: "Dashboard",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Bookings",
    href: "/admin/bookings",
    icon: CalendarCheck,
  },
  {
    name: "Trips & Buses",
    href: "/admin/trips",
    icon: Bus,
  },
  {
    name: "Passengers",
    href: "/admin/passengers",
    icon: Users,
  },
  {
    name: "Destinations",
    href: "/admin/destinations",
    icon: MapPin,
  },
  {
    name: "Hotels",
    href: "/admin/hotels",
    icon: Hotel,
  },
  {
    name: "Packages",
    href: "/admin/packages",
    icon: Package,
  },
  {
    name: "Routes",
    href: "/admin/routes",
    icon: Navigation,
  },
  {
    name: "Drivers",
    href: "/admin/drivers",
    icon: UserRoundCog,
  },
];

const bottomItems = [
  {
    name: "Settings",
    href: "/admin/settings",
    icon: Settings,
  },
];

const stats = [
  {
    title: "Total Bookings",
    value: "1,284",
    change: "+12.5%",
    icon: CalendarCheck,
  },
  {
    title: "Today's Bookings",
    value: "48",
    change: "+8.2%",
    icon: TrendingUp,
  },
  {
    title: "Active Buses",
    value: "32",
    change: "+4",
    icon: Bus,
  },
  {
    title: "Passengers",
    value: "3,642",
    change: "+18.4%",
    icon: Users,
  },
];

const bookings = [
  {
    id: "#BK-10482",
    passenger: "Ahmed Khan",
    route: "Nusa Dua → Uluwatu",
    bus: "HT-102",
    seat: "A5",
    time: "09:30 AM",
    status: "Confirmed",
  },
  {
    id: "#BK-10481",
    passenger: "Sarah Wilson",
    route: "Kuta → Ubud",
    bus: "HT-108",
    seat: "B3",
    time: "10:15 AM",
    status: "Pending",
  },
  {
    id: "#BK-10480",
    passenger: "Daniel Smith",
    route: "Seminyak → Canggu",
    bus: "HT-115",
    seat: "C2",
    time: "11:00 AM",
    status: "Confirmed",
  },
  {
    id: "#BK-10479",
    passenger: "Aisha Rahman",
    route: "Ubud → Kuta",
    bus: "HT-106",
    seat: "A8",
    time: "12:30 PM",
    status: "Cancelled",
  },
];

const upcomingTrips = [
  {
    route: "Nusa Dua → Uluwatu",
    bus: "HT-102",
    departure: "09:30 AM",
    seats: "28/40",
  },
  {
    route: "Kuta → Ubud",
    bus: "HT-108",
    departure: "10:15 AM",
    seats: "34/40",
  },
  {
    route: "Seminyak → Canggu",
    bus: "HT-115",
    departure: "11:00 AM",
    seats: "21/40",
  },
];

export default function AdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f7f9f9]">

      {/* ==================================================
          MOBILE OVERLAY
      ================================================== */}

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}


      {/* ==================================================
          SIDEBAR
      ================================================== */}

      <aside
        className={`
          fixed left-0 top-0 z-50 flex h-screen w-[270px]
          flex-col border-r border-gray-100 bg-white
          transition-transform duration-300
          lg:translate-x-0
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >

        {/* LOGO */}

        <div className="flex h-[76px] shrink-0 items-center justify-between border-b border-gray-100 px-6">

          <Link
            href="/admin/dashboard"
            className="flex items-center gap-3"
          >

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#063d43] text-lg font-black text-white">
              H
            </div>

            <div>

              <p className="text-base font-black tracking-wide text-gray-900">
                HAIKAL
              </p>

              <p className="text-[9px] font-bold tracking-[0.3em] text-teal-700">
                TOURS ADMIN
              </p>

            </div>

          </Link>

          <button
            onClick={() => setSidebarOpen(false)}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 lg:hidden"
          >
            <X size={20} />
          </button>

        </div>


        {/* NAVIGATION */}

        <div className="flex-1 overflow-y-auto px-4 py-5">

          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">
            Main Menu
          </p>

          <nav className="space-y-1">

            {menuItems.map((item) => {

              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    group flex items-center gap-3 rounded-xl
                    px-3 py-3 text-sm font-medium transition
                    ${
                      item.name === "Dashboard"
                        ? "bg-teal-50 font-bold text-teal-700"
                        : "text-gray-600 hover:bg-gray-50 hover:text-teal-700"
                    }
                  `}
                >

                  <Icon
                    size={19}
                    className={
                      item.name === "Dashboard"
                        ? "text-teal-700"
                        : "text-gray-400 group-hover:text-teal-700"
                    }
                  />

                  <span>{item.name}</span>

                </Link>
              );
            })}

          </nav>


          <p className="mb-3 mt-8 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">
            System
          </p>

          <nav className="space-y-1">

            {bottomItems.map((item) => {

              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-gray-600 transition hover:bg-gray-50 hover:text-teal-700"
                >
                  <Icon
                    size={19}
                    className="text-gray-400 group-hover:text-teal-700"
                  />

                  {item.name}
                </Link>
              );
            })}

          </nav>

        </div>


        {/* ADMIN PROFILE */}

        <div className="border-t border-gray-100 p-4">

          <div className="flex items-center gap-3 rounded-xl bg-gray-50 p-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-100 text-sm font-bold text-teal-700">
              A
            </div>

            <div className="min-w-0 flex-1">

              <p className="truncate text-sm font-bold text-gray-800">
                Administrator
              </p>

              <p className="truncate text-xs text-gray-400">
                admin@haikaltours.com
              </p>

            </div>

            <button className="text-gray-400 hover:text-red-500">
              <LogOut size={17} />
            </button>

          </div>

        </div>

      </aside>


      {/* ==================================================
          MAIN
      ================================================== */}

      <main className="lg:ml-[270px]">

        {/* ==================================================
            TOP HEADER
        ================================================== */}

        <header className="sticky top-0 z-30 flex h-[76px] items-center justify-between border-b border-gray-100 bg-white/95 px-4 backdrop-blur-md sm:px-6 lg:px-8">

          <div className="flex items-center gap-3">

            <button
              onClick={() => setSidebarOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 text-gray-600 lg:hidden"
            >
              <Menu size={21} />
            </button>

            <div>

              <h1 className="text-lg font-black text-gray-900 sm:text-xl">
                Dashboard
              </h1>

              <p className="hidden text-xs text-gray-400 sm:block">
                Welcome back, Administrator
              </p>

            </div>

          </div>


          <div className="flex items-center gap-2 sm:gap-4">

            {/* SEARCH */}

            <div className="hidden items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 md:flex">

              <Search
                size={17}
                className="text-gray-400"
              />

              <input
                placeholder="Search..."
                className="w-36 bg-transparent text-sm outline-none placeholder:text-gray-400"
              />

            </div>


            {/* NOTIFICATION */}

            <button className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 text-gray-500 transition hover:bg-gray-50">

              <Bell size={18} />

              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" />

            </button>


            {/* PROFILE */}

            <div className="hidden items-center gap-2 sm:flex">

              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-100 text-sm font-bold text-teal-700">
                A
              </div>

              <div className="hidden xl:block">

                <p className="text-sm font-bold text-gray-800">
                  Administrator
                </p>

                <p className="text-[11px] text-gray-400">
                  Super Admin
                </p>

              </div>

            </div>

          </div>

        </header>


        {/* ==================================================
            DASHBOARD CONTENT
        ================================================== */}

        <div className="p-4 sm:p-6 lg:p-8">

          {/* TITLE */}

          <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">

            <div>

              <p className="text-sm font-medium text-teal-700">
                Overview
              </p>

              <h2 className="mt-1 text-2xl font-black text-gray-900 sm:text-3xl">
                Good morning, Admin 👋
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Here is what's happening with Haikal Tours today.
              </p>

            </div>

            <Link
              href="/admin/bookings"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#063d43] px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#052f34]"
            >
              View all bookings
              <ArrowUpRight size={16} />
            </Link>

          </div>


          {/* ==================================================
              STAT CARDS
          ================================================== */}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

            {stats.map((stat) => {

              const Icon = stat.icon;

              return (
                <div
                  key={stat.title}
                  className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
                >

                  <div className="flex items-start justify-between">

                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50">
                      <Icon
                        size={21}
                        className="text-teal-700"
                      />
                    </div>

                    <span className="rounded-full bg-green-50 px-2.5 py-1 text-xs font-bold text-green-600">
                      {stat.change}
                    </span>

                  </div>

                  <p className="mt-5 text-sm font-medium text-gray-500">
                    {stat.title}
                  </p>

                  <p className="mt-1 text-2xl font-black text-gray-900">
                    {stat.value}
                  </p>

                </div>
              );
            })}

          </div>


          {/* ==================================================
              MAIN GRID
          ================================================== */}

          <div className="mt-6 grid gap-6 xl:grid-cols-[1.5fr_1fr]">

            {/* RECENT BOOKINGS */}

            <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">

              <div className="flex items-center justify-between border-b border-gray-100 p-5">

                <div>

                  <h3 className="font-bold text-gray-900">
                    Recent Bookings
                  </h3>

                  <p className="mt-1 text-xs text-gray-400">
                    Latest customer reservations
                  </p>

                </div>

                <Link
                  href="/admin/bookings"
                  className="flex items-center gap-1 text-xs font-bold text-teal-700"
                >
                  View all
                  <ChevronRight size={14} />
                </Link>

              </div>


              {/* DESKTOP TABLE */}

              <div className="hidden overflow-x-auto md:block">

                <table className="w-full text-left">

                  <thead>

                    <tr className="border-b border-gray-100 text-xs text-gray-400">

                      <th className="px-5 py-4 font-semibold">
                        Booking
                      </th>

                      <th className="px-5 py-4 font-semibold">
                        Passenger
                      </th>

                      <th className="px-5 py-4 font-semibold">
                        Route
                      </th>

                      <th className="px-5 py-4 font-semibold">
                        Bus
                      </th>

                      <th className="px-5 py-4 font-semibold">
                        Status
                      </th>

                    </tr>

                  </thead>

                  <tbody>

                    {bookings.map((booking) => (

                      <tr
                        key={booking.id}
                        className="border-b border-gray-50 last:border-0"
                      >

                        <td className="px-5 py-4">

                          <p className="text-xs font-bold text-gray-800">
                            {booking.id}
                          </p>

                          <p className="mt-1 text-[11px] text-gray-400">
                            {booking.time}
                          </p>

                        </td>

                        <td className="px-5 py-4">

                          <p className="text-sm font-semibold text-gray-800">
                            {booking.passenger}
                          </p>

                        </td>

                        <td className="px-5 py-4">

                          <p className="max-w-[170px] truncate text-xs text-gray-600">
                            {booking.route}
                          </p>

                        </td>

                        <td className="px-5 py-4">

                          <p className="text-xs font-bold text-gray-700">
                            {booking.bus}
                          </p>

                          <p className="text-[11px] text-gray-400">
                            Seat {booking.seat}
                          </p>

                        </td>

                        <td className="px-5 py-4">

                          {booking.status === "Confirmed" && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-[11px] font-bold text-green-600">
                              <CircleCheck size={12} />
                              Confirmed
                            </span>
                          )}

                          {booking.status === "Pending" && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-600">
                              <Clock3 size={12} />
                              Pending
                            </span>
                          )}

                          {booking.status === "Cancelled" && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-bold text-red-600">
                              <CircleAlert size={12} />
                              Cancelled
                            </span>
                          )}

                        </td>

                      </tr>

                    ))}

                  </tbody>

                </table>

              </div>


              {/* MOBILE BOOKINGS */}

              <div className="divide-y divide-gray-100 md:hidden">

                {bookings.map((booking) => (

                  <div
                    key={booking.id}
                    className="p-4"
                  >

                    <div className="flex items-start justify-between">

                      <div>

                        <p className="text-xs font-bold text-gray-400">
                          {booking.id}
                        </p>

                        <p className="mt-1 font-bold text-gray-900">
                          {booking.passenger}
                        </p>

                      </div>

                      {booking.status === "Confirmed" && (
                        <span className="rounded-full bg-green-50 px-2 py-1 text-[10px] font-bold text-green-600">
                          Confirmed
                        </span>
                      )}

                      {booking.status === "Pending" && (
                        <span className="rounded-full bg-amber-50 px-2 py-1 text-[10px] font-bold text-amber-600">
                          Pending
                        </span>
                      )}

                      {booking.status === "Cancelled" && (
                        <span className="rounded-full bg-red-50 px-2 py-1 text-[10px] font-bold text-red-600">
                          Cancelled
                        </span>
                      )}

                    </div>

                    <div className="mt-3 flex items-center justify-between text-xs text-gray-500">

                      <span>
                        {booking.route}
                      </span>

                      <span className="font-semibold">
                        {booking.bus} · {booking.seat}
                      </span>

                    </div>

                  </div>

                ))}

              </div>

            </div>


            {/* ==================================================
                UPCOMING TRIPS
            ================================================== */}

            <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">

              <div className="border-b border-gray-100 p-5">

                <h3 className="font-bold text-gray-900">
                  Upcoming Trips
                </h3>

                <p className="mt-1 text-xs text-gray-400">
                  Today's scheduled departures
                </p>

              </div>


              <div className="divide-y divide-gray-100">

                {upcomingTrips.map((trip) => (

                  <div
                    key={trip.bus}
                    className="p-5"
                  >

                    <div className="flex items-center justify-between">

                      <div className="flex items-center gap-3">

                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50">
                          <Bus
                            size={18}
                            className="text-teal-700"
                          />
                        </div>

                        <div>

                          <p className="text-sm font-bold text-gray-900">
                            {trip.bus}
                          </p>

                          <p className="text-xs text-gray-400">
                            {trip.departure}
                          </p>

                        </div>

                      </div>

                      <span className="text-xs font-bold text-gray-500">
                        {trip.seats}
                      </span>

                    </div>

                    <div className="mt-4">

                      <p className="text-sm font-semibold text-gray-700">
                        {trip.route}
                      </p>

                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-100">

                        <div
                          className="h-full rounded-full bg-teal-700"
                          style={{
                            width: `${(
                              parseInt(trip.seats) /
                              40
                            ) * 100}%`,
                          }}
                        />

                      </div>

                    </div>

                  </div>

                ))}

              </div>

              <div className="border-t border-gray-100 p-4">

                <Link
                  href="/admin/trips"
                  className="flex items-center justify-center gap-1 rounded-xl bg-gray-50 py-3 text-xs font-bold text-gray-700 transition hover:bg-teal-50 hover:text-teal-700"
                >
                  Manage trips
                  <ChevronRight size={14} />
                </Link>

              </div>

            </div>

          </div>


          {/* ==================================================
              QUICK ACTIONS
          ================================================== */}

          <div className="mt-6">

            <h3 className="mb-4 text-lg font-bold text-gray-900">
              Quick Actions
            </h3>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">

              <QuickAction
                href="/admin/bookings"
                icon={CalendarCheck}
                label="Bookings"
              />

              <QuickAction
                href="/admin/trips"
                icon={Bus}
                label="Add Trip"
              />

              <QuickAction
                href="/admin/drivers"
                icon={UserRoundCog}
                label="Drivers"
              />

              <QuickAction
                href="/admin/routes"
                icon={Navigation}
                label="Routes"
              />

              <QuickAction
                href="/admin/destinations"
                icon={MapPin}
                label="Destination"
              />

              <QuickAction
                href="/admin/settings"
                icon={Settings}
                label="Settings"
              />

            </div>

          </div>

        </div>

      </main>

    </div>
  );
}


/* ==================================================
   QUICK ACTION COMPONENT
================================================== */

function QuickAction({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-gray-100 bg-white p-5 text-center shadow-sm transition hover:-translate-y-0.5 hover:border-teal-100 hover:shadow-md"
    >

      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50">
        <Icon
          size={20}
          className="text-teal-700"
        />
      </div>

      <span className="text-xs font-bold text-gray-700">
        {label}
      </span>

    </Link>
  );
}

