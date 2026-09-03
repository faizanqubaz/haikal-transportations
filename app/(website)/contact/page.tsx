"use client";

import { Mail, MapPin, Phone } from "lucide-react";

export default function ContactPage() {
  return (
    <main>

      <section className="bg-[#f7f8f6] px-5 py-20 sm:px-8 lg:px-12 lg:py-28">

        <div className="mx-auto max-w-7xl">

          <p className="text-xs font-bold tracking-[0.3em] text-teal-700">
            GET IN TOUCH
          </p>

          <h1 className="mt-4 font-serif text-5xl text-gray-900 sm:text-6xl">
            Contact us
          </h1>

          <p className="mt-5 max-w-xl text-gray-500">
            Have a question about a tour, transfer, hotel or
            booking? Send us a message.
          </p>

        </div>

      </section>


      <section className="px-5 py-16 sm:px-8 lg:px-12 lg:py-24">

        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.8fr_1.2fr]">

          {/* Information */}

          <div className="rounded-3xl bg-[#063d43] p-8 text-white sm:p-10">

            <h2 className="font-serif text-3xl">
              Let's talk
            </h2>

            <p className="mt-4 leading-7 text-white/60">
              Our team is happy to help with your travel plans.
            </p>


            <div className="mt-10 space-y-6">

              <Contact
                icon={<Phone />}
                title="Phone"
                text="+92 XXX XXXXXXX"
              />

              <Contact
                icon={<Mail />}
                title="Email"
                text="info@haikaltours.com"
              />

              <Contact
                icon={<MapPin />}
                title="Location"
                text="Gilgit-Baltistan, Pakistan"
              />

            </div>

          </div>


          {/* Form */}

          <form className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm sm:p-10">

            <div className="grid gap-5 sm:grid-cols-2">

              <Input
                label="Your name"
                placeholder="John Doe"
              />

              <Input
                label="Email"
                placeholder="john@example.com"
                type="email"
              />

            </div>

            <div className="mt-5">

              <Input
                label="Subject"
                placeholder="How can we help?"
              />

            </div>

            <div className="mt-5">

              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Message
              </label>

              <textarea
                rows={6}
                placeholder="Tell us about your trip..."
                className="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-teal-700"
              />

            </div>

            <button
              type="submit"
              className="mt-6 rounded-xl bg-[#063d43] px-7 py-4 text-sm font-bold text-white transition hover:bg-[#052f34]"
            >
              Send message
            </button>

          </form>

        </div>

      </section>

    </main>
  );
}


function Contact({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="flex gap-4">

      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10">
        {icon}
      </div>

      <div>
        <p className="text-sm font-semibold">
          {title}
        </p>

        <p className="mt-1 text-sm text-white/50">
          {text}
        </p>
      </div>

    </div>
  );
}


function Input({
  label,
  placeholder,
  type = "text",
}: {
  label: string;
  placeholder: string;
  type?: string;
}) {
  return (
    <div>

      <label className="mb-2 block text-sm font-semibold text-gray-700">
        {label}
      </label>

      <input
        type={type}
        placeholder={placeholder}
        className="h-12 w-full rounded-xl border border-gray-200 px-4 text-sm outline-none transition focus:border-teal-700"
      />

    </div>
  );
}