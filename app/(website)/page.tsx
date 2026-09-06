
"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  MapPin,
  ShieldCheck,
  Headphones,
  Star,
} from "lucide-react";

import VideoHero from "@/components/hero/VideoHere";

import type {
  AvailabilitySearch,
} from "@/components/hero/AvailabilityForm";

import AvailabilityResults from "@/components/avaialibility/AvailabilityResults";
import BookingAssistant from "@/components/ai/BookingAssistant";

const destinations = [
  {
    name: "Gilgit",
    country: "Pakistan",
    image: "/images/haikal.png",
  },
  {
    name: "Hunza",
    country: "Pakistan",
    image: "/images/image.jpg",
  },
  {
    name: "Ghakuch",
    country: "Pakistan",
    image: "/images/route-lagoon.jpg",
  },
  {
    name: "Sost",
    country: "Pakistan",
    image: "/images/route-lagoon.jpg",
  },
];

const tours = [
  {
    title: "Aliabad Hunza",
    location: "Hunza, Pakistan",
    duration: "7 Days / 6 Nights",
    price: "$899",
    image: "/images/route-lagoon.jpg",
  },
  {
    title: "Sost Gojal Tours",
    location: "Gilgit-Baltistan, Pakistan",
    duration: "6 Days / 5 Nights",
    price: "$499",
    image: "/images/route-lagoon.jpg",
  },
  {
    title: "Gilgit Tours",
    location: "Gilgit-Baltistan, Pakistan",
    duration: "5 Days / 4 Nights",
    price: "$1,299",
    image: "/images/route-lagoon.jpg",
  },
];

export default function HomePage() {
  const [search, setSearch] =
    useState<AvailabilitySearch | null>(null);

  const resultsRef =
    useRef<HTMLDivElement>(null);

  const handleSearch = (
    value: AvailabilitySearch
  ) => {
    setSearch(value);

    setTimeout(() => {
      document
        .getElementById("availability-results")
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
    }, 100);
  };

  return (
    <main className="min-h-screen bg-white">

      {/* =====================================================
          HERO
      ====================================================== */}

      <VideoHero onSearch={handleSearch} />


      {/* =====================================================
          AVAILABILITY RESULTS
      ====================================================== */}

      <div
        ref={resultsRef}
        id="availability-results"
        className="scroll-mt-20"
      >
        <AvailabilityResults search={search} />
      </div>


      {/* =====================================================
          WELCOME
      ====================================================== */}

      <section className="px-5 py-16 sm:px-8 sm:py-20 lg:px-12 lg:py-28">

        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-2 lg:items-center lg:gap-20">

          <div>

            <p className="mb-4 text-xs font-bold tracking-[0.3em] text-teal-700">
              WELCOME TO HAIKAL TOURS
            </p>

            <h2 className="max-w-2xl font-serif text-4xl leading-[1.1] text-gray-900 sm:text-5xl lg:text-6xl">
              Travel is not just about the destination.

              <span className="text-teal-700">
                {" "}It's about the journey.
              </span>
            </h2>

          </div>

          <div>

            <p className="text-base leading-8 text-gray-600 sm:text-lg">
              Discover unforgettable destinations with Haikal Tours.
              From private transfers and carefully designed tour
              packages to hotels and unique travel experiences, we
              make every part of your journey simple and memorable.
            </p>

            <Link
              href="/about"
              className="group mt-7 inline-flex items-center gap-2 font-semibold text-teal-700 transition-all"
            >
              Discover Haikal Tours

              <ArrowRight
                size={18}
                className="transition-transform group-hover:translate-x-1"
              />
            </Link>

          </div>

        </div>

      </section>


      {/* =====================================================
          POPULAR DESTINATIONS
      ====================================================== */}

      <section className="bg-gray-50 px-5 py-16 sm:px-8 sm:py-20 lg:px-12 lg:py-28">

        <div className="mx-auto max-w-7xl">

          <div className="mb-10 flex flex-col gap-5 sm:mb-12 sm:flex-row sm:items-end sm:justify-between">

            <div>

              <p className="mb-3 text-xs font-bold tracking-[0.3em] text-teal-700">
                EXPLORE THE WORLD
              </p>

              <h2 className="font-serif text-4xl text-gray-900 sm:text-5xl">
                Popular destinations
              </h2>

            </div>

            <Link
              href="/destinations"
              className="group flex w-fit items-center gap-2 text-sm font-semibold text-teal-700"
            >
              View all destinations

              <ArrowRight
                size={17}
                className="transition-transform group-hover:translate-x-1"
              />
            </Link>

          </div>


          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">

            {destinations.map((destination) => (

              <Link
                href="/booking"
                key={destination.name}
                className="group relative h-[330px] overflow-hidden rounded-2xl shadow-sm sm:h-[380px]"
              >

                <img
                  src={destination.image}
                  alt={destination.name}
                  className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-110"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6">

                  <div className="mb-2 flex items-center gap-1.5 text-xs text-white/80">
                    <MapPin size={13} />
                    {destination.country}
                  </div>

                  <h3 className="font-serif text-2xl text-white sm:text-3xl">
                    {destination.name}
                  </h3>

                </div>

              </Link>

            ))}

          </div>

        </div>

      </section>


      {/* =====================================================
          FEATURED TOURS
      ====================================================== */}

      <section className="px-5 py-16 sm:px-8 sm:py-20 lg:px-12 lg:py-28">

        <div className="mx-auto max-w-7xl">

          <div className="mb-10 flex flex-col gap-5 sm:mb-12 sm:flex-row sm:items-end sm:justify-between">

            <div>

              <p className="mb-3 text-xs font-bold tracking-[0.3em] text-teal-700">
                OUR EXPERIENCES
              </p>

              <h2 className="font-serif text-4xl text-gray-900 sm:text-5xl">
                Featured tours
              </h2>

            </div>

            <Link
              href="/tours"
              className="group flex w-fit items-center gap-2 text-sm font-semibold text-teal-700"
            >
              Explore all tours

              <ArrowRight
                size={17}
                className="transition-transform group-hover:translate-x-1"
              />
            </Link>

          </div>


          <div className="grid gap-7 md:grid-cols-2 lg:grid-cols-3">

            {tours.map((tour) => (

              <article
                key={tour.title}
                className="group overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
              >

                {/* Image */}

                <div className="relative h-60 overflow-hidden sm:h-64">

                  <img
                    src={tour.image}
                    alt={tour.title}
                    className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                  />

                  <div className="absolute left-4 top-4 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-gray-800 shadow-sm">
                    Featured
                  </div>

                </div>


                {/* Content */}

                <div className="p-5 sm:p-6">

                  <div className="mb-3 flex items-center gap-1.5 text-sm text-gray-500">

                    <MapPin
                      size={15}
                      className="text-teal-700"
                    />

                    {tour.location}

                  </div>

                  <h3 className="font-serif text-2xl text-gray-900">
                    {tour.title}
                  </h3>

                  <p className="mt-2 text-sm text-gray-500">
                    {tour.duration}
                  </p>


                  <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-5">

                    <div>

                      <span className="text-xs text-gray-500">
                        Starting from
                      </span>

                      <p className="text-xl font-bold text-gray-900">
                        {tour.price}
                      </p>

                    </div>

                    <Link
                      href="/booking"
                      className="group flex items-center gap-2 rounded-full bg-teal-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-teal-800"
                    >
                      Book

                      <ArrowRight
                        size={16}
                        className="transition-transform group-hover:translate-x-1"
                      />
                    </Link>

                  </div>

                </div>

              </article>

            ))}

          </div>

        </div>

      </section>


      {/* =====================================================
          WHY HAIKAL TOURS
      ====================================================== */}

      <section className="bg-[#063d43] px-5 py-16 text-white sm:px-8 sm:py-20 lg:px-12 lg:py-28">

        <div className="mx-auto max-w-7xl">

          <div className="max-w-2xl">

            <p className="mb-3 text-xs font-bold tracking-[0.3em] text-teal-300">
              WHY HAIKAL TOURS
            </p>

            <h2 className="font-serif text-4xl leading-tight sm:text-5xl">
              We take care of the journey.
            </h2>

          </div>


          <div className="mt-10 grid gap-5 sm:mt-14 md:grid-cols-3">

            {/* Feature 1 */}

            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 transition hover:bg-white/10 sm:p-7">

              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
                <ShieldCheck size={24} />
              </div>

              <h3 className="text-xl font-semibold">
                Trusted service
              </h3>

              <p className="mt-3 leading-7 text-white/60">
                Reliable travel services designed to make your
                journey comfortable and stress-free.
              </p>

            </div>


            {/* Feature 2 */}

            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 transition hover:bg-white/10 sm:p-7">

              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
                <Headphones size={24} />
              </div>

              <h3 className="text-xl font-semibold">
                Personal support
              </h3>

              <p className="mt-3 leading-7 text-white/60">
                Our team is available to help you before,
                during, and after your trip.
              </p>

            </div>


            {/* Feature 3 */}

            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 transition hover:bg-white/10 sm:p-7">

              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
                <Star size={24} />
              </div>

              <h3 className="text-xl font-semibold">
                Memorable experiences
              </h3>

              <p className="mt-3 leading-7 text-white/60">
                Carefully selected destinations and experiences
                created around the way you want to travel.
              </p>

            </div>

          </div>

        </div>

      </section>


      {/* =====================================================
          BOOKING CTA
      ====================================================== */}

      <section className="px-5 py-16 sm:px-8 sm:py-20 lg:px-12 lg:py-28">

        <div className="mx-auto max-w-7xl">

          <div className="relative overflow-hidden rounded-3xl bg-gray-900 px-6 py-16 text-center sm:px-12 sm:py-20 lg:px-20">

            <div className="absolute inset-0 opacity-30">

              <img
                src="/images/image.jpg"
                alt=""
                className="h-full w-full object-cover"
              />

            </div>

            <div className="absolute inset-0 bg-black/55" />


            <div className="relative z-10 mx-auto max-w-3xl">

              <p className="mb-4 text-xs font-bold tracking-[0.3em] text-teal-300">
                START YOUR JOURNEY
              </p>

              <h2 className="font-serif text-4xl leading-tight text-white sm:text-6xl">
                Where will you go next?
              </h2>

              <p className="mx-auto mt-5 max-w-xl leading-7 text-white/70">
                Find your perfect destination and let Haikal Tours
                take care of the details.
              </p>

              <Link
                href="/booking"
                className="mt-8 inline-flex items-center gap-3 rounded-full bg-white px-7 py-4 text-sm font-bold text-gray-900 shadow-lg transition hover:bg-teal-50"
              >
                Start booking

                <ArrowRight size={18} />
              </Link>

            </div>

          </div>

        </div>

      </section>


      {/* =====================================================
          FLOATING BOOKING ASSISTANT
      ====================================================== */}

      <div
        className="
          fixed
          bottom-4
          right-4
          z-[9999]
          sm:bottom-6
          sm:right-6
          md:bottom-8
          md:right-8
        "
      >
        <BookingAssistant />
      </div>

    </main>
  );
}

