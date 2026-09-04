import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-gray-950 text-white">

      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-2 lg:grid-cols-4 lg:px-8">

        {/* Brand */}

        <div>
          <div className="flex items-center gap-3">

            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-teal-600 font-bold">
              H
            </div>

            <div>
              <div className="font-bold">
                HAIKAL
              </div>

              <div className="text-xs tracking-[0.3em] text-teal-400">
                TOURS
              </div>
            </div>

          </div>

          <p className="mt-5 max-w-sm text-sm leading-6 text-gray-400">
            Discover beautiful destinations, unforgettable
            experiences and carefully planned journeys with
            Haikal Tours.
          </p>
        </div>

        {/* Explore */}

        <div>
          <h3 className="mb-5 font-semibold">
            Explore
          </h3>

          <div className="space-y-3 text-sm text-gray-400">

            <Link
              href="/tours"
              className="block hover:text-white"
            >
              Services
            </Link>

            <Link
              href="/destinations"
              className="block hover:text-white"
            >
              Destinations
            </Link>

            <Link
              href="/hotels"
              className="block hover:text-white"
            >
              Hotels
            </Link>

            <Link
              href="/packages"
              className="block hover:text-white"
            >
              Packages
            </Link>

          </div>
        </div>

        {/* Company */}

        <div>
          <h3 className="mb-5 font-semibold">
            Company
          </h3>

          <div className="space-y-3 text-sm text-gray-400">

            <Link
              href="/about"
              className="block hover:text-white"
            >
              About Us
            </Link>

            <Link
              href="/contact"
              className="block hover:text-white"
            >
              Contact
            </Link>

            <Link
              href="/bookings"
              className="block hover:text-white"
            >
              My Bookings
            </Link>

            <Link
              href="/admin/login"
              className="block hover:text-white"
            >
              Admin Login
            </Link>

          </div>
        </div>

        {/* Contact */}

        <div>
          <h3 className="mb-5 font-semibold">
            Contact Us
          </h3>

          <div className="space-y-3 text-sm text-gray-400">
            <p>Phone: +92 XXX XXXXXXX</p>
            <p>Email: info@haikaltours.com</p>
            <p>Pakistan</p>
          </div>
        </div>

      </div>

      <div className="border-t border-gray-800">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-3 px-4 py-5 text-sm text-gray-500 sm:px-6 md:flex-row lg:px-8">

          <p>
            © {new Date().getFullYear()} Haikal Tours.
            All rights reserved.
          </p>

          <div className="flex gap-5">
            <Link href="/privacy">
              Privacy Policy
            </Link>

            <Link href="/terms">
              Terms & Conditions
            </Link>
          </div>

        </div>
      </div>

    </footer>
  );
}