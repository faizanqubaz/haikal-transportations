"use client";

type Props = {
  count: number;
  active: number;
  onChange: (index: number) => void;
};

export default function SliderIndicators({
  count,
  active,
  onChange,
}: Props) {
  return (
    <div className="absolute bottom-[245px] left-1/2 z-20 flex -translate-x-1/2 items-center gap-3 sm:bottom-[235px] lg:bottom-40">

      {Array.from({ length: count }).map((_, index) => (
        <button
          key={index}
          onClick={() => onChange(index)}
          aria-label={`Go to slide ${index + 1}`}
          className={`h-1.5 rounded-full transition-all duration-300 ${
            active === index
              ? "w-9 bg-white"
              : "w-4 bg-white/40 hover:bg-white/70"
          }`}
        />
      ))}

    </div>
  );
}