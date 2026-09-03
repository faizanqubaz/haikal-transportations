"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin } from "lucide-react";
import { locations } from "@/libs/locations";

type Props = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
};

export default function LocationAutocomplete({
  label,
  value,
  onChange,
  placeholder,
}: Props) {
  const [open, setOpen] = useState(false);

  const wrapperRef = useRef<HTMLDivElement>(null);

  const filteredLocations = locations.filter((location) =>
    `${location.name} ${location.country}`
      .toLowerCase()
      .includes(value.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div
      ref={wrapperRef}
      className="relative"
    >
      <label className="mb-2 block text-[10px] font-bold tracking-[0.25em] text-gray-400 sm:text-xs">
        {label}
      </label>

      <div className="flex items-center gap-2">
        <MapPin
          size={18}
          className="shrink-0 text-teal-700"
        />

        <input
          type="text"
          value={value}
          placeholder={placeholder}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
          }}
          className="w-full bg-transparent text-sm font-medium text-gray-800 outline-none placeholder:text-gray-400 sm:text-base"
        />
      </div>

     {open && filteredLocations.length > 0 && (
  <div
    className="
      absolute left-0 right-0 z-[100]
      max-h-80 overflow-y-auto
      rounded-2xl border border-gray-100
      bg-white p-2 shadow-2xl

      top-[calc(100%+14px)]
      lg:bottom-[calc(100%+14px)]
      lg:top-auto
    "
  >
    {filteredLocations.map((location) => (
      <button
        type="button"
        key={location.id}
        onClick={() => {
          onChange(location.name);
          setOpen(false);
        }}
        className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-teal-50"
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-50">
          <MapPin
            size={16}
            className="text-teal-700"
          />
        </div>

        <div>
          <p className="text-sm font-semibold text-gray-800">
            {location.name}
          </p>

          <p className="text-xs text-gray-400">
            {location.country}
          </p>
        </div>
      </button>
    ))}
  </div>
)}
    </div>
  );
}