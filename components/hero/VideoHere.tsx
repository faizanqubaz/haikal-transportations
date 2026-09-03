"use client";

import { useEffect, useRef, useState } from "react";
import SliderIndicators from "./SliderIndicators";
import AvailabilityForm, { AvailabilitySearch } from "./AvailabilityForm";



const slides = [
  {
    video: "/videos/hero-coast.mp4",
    eyebrow: "PRIVATE GROUND TRANSFERS",
    title: "The door closes. The road opens.",
  },
  {
    video: "/videos/hero-coast.mp4",
    eyebrow: "DISCOVER THE WORLD",
    title: "Your journey starts here.",
  },
  {
    video: "/videos/hero-coast.mp4",
    eyebrow: "UNFORGETTABLE JOURNEYS",
    title: "Travel further. Experience more.",
  },
];

type Props = {
  onSearch: (search: AvailabilitySearch) => void;
};

export default function VideoHero({
  onSearch,
}: Props) {
  const [currentSlide, setCurrentSlide] =
    useState(0);

  const videoRef =
    useRef<HTMLVideoElement>(null);

  const slide = slides[currentSlide];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((previous) =>
        previous === slides.length - 1
          ? 0
          : previous + 1
      );
    }, 8000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!videoRef.current) return;

    videoRef.current.load();

    videoRef.current.play().catch(() => {});
  }, [currentSlide]);

  return (
    <section className="relative min-h-[720px] w-full overflow-hidden sm:min-h-[760px] lg:h-[calc(100svh-76px)] lg:min-h-[700px]">

      {/* VIDEO */}

      <video
        ref={videoRef}
        key={slide.video}
        src={slide.video}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        className="absolute inset-0 h-full w-full object-cover"
      />

      {/* OVERLAY */}

      <div className="absolute inset-0 bg-black/35" />

      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/5 to-black/60" />

      {/* HERO TEXT */}

      <div className="relative z-10 flex h-full items-center justify-center px-5 pb-64 pt-20 text-center sm:px-8 sm:pb-60 lg:pb-52">

        <div className="max-w-5xl">

          <p className="mb-5 text-[10px] font-bold tracking-[0.35em] text-white sm:text-xs md:text-sm">
            {slide.eyebrow}
          </p>

          <h1 className="font-serif text-5xl leading-[0.95] tracking-tight text-white drop-shadow-xl sm:text-6xl md:text-7xl lg:text-8xl">
            {slide.title}
          </h1>

        </div>

      </div>


      {/* SLIDER */}

      <SliderIndicators
        count={slides.length}
        active={currentSlide}
        onChange={setCurrentSlide}
      />


      {/* SEARCH */}

      <AvailabilityForm
        onSearch={onSearch}
      />

    </section>
  );
}