"use client";

import { FormEvent, useState } from "react";

export default function AddBusPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    busNumber: "",
    company: "",
    driverPhone: "",
    route: "",
    pickup: "",
    dropoff: "",
    date: "",
    departure: "",
    arrival: "",
    duration: "",
    price: "",
    image: "",
    seatCount: "30",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/admin/buses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to add bus");
      }

      setMessage("Bus added successfully!");

      setForm({
        busNumber: "",
        company: "",
        driverPhone: "",
        route: "",
        pickup: "",
        dropoff: "",
        date: "",
        departure: "",
        arrival: "",
        duration: "",
        price: "",
        image: "",
        seatCount: "30",
      });
    } catch (error: any) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl p-8">
      <div className="mb-8">
        <p className="text-sm font-semibold tracking-widest text-teal-700">
          ADMIN
        </p>

        <h1 className="mt-2 text-4xl font-bold">
          Add New Bus
        </h1>

        <p className="mt-2 text-gray-500">
          Add a bus and make it available for customer bookings.
        </p>
      </div>

      {message && (
        <div className="mb-6 rounded-lg bg-gray-100 p-4">
          {message}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-8 rounded-2xl bg-white p-8 shadow"
      >
        {/* Bus information */}

        <div>
          <h2 className="mb-4 text-xl font-semibold">
            Bus Information
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <input
              name="busNumber"
              value={form.busNumber}
              onChange={handleChange}
              placeholder="Bus Number"
              className="rounded-lg border p-3"
              required
            />

            <input
              name="company"
              value={form.company}
              onChange={handleChange}
              placeholder="Company"
              className="rounded-lg border p-3"
              required
            />

            <input
              name="driverPhone"
              value={form.driverPhone}
              onChange={handleChange}
              placeholder="Driver Phone"
              className="rounded-lg border p-3"
            />

            <input
              name="route"
              value={form.route}
              onChange={handleChange}
              placeholder="Route"
              className="rounded-lg border p-3"
            />
          </div>
        </div>

        {/* Route */}

        <div>
          <h2 className="mb-4 text-xl font-semibold">
            Journey
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <input
              name="pickup"
              value={form.pickup}
              onChange={handleChange}
              placeholder="Pickup"
              className="rounded-lg border p-3"
              required
            />

            <input
              name="dropoff"
              value={form.dropoff}
              onChange={handleChange}
              placeholder="Dropoff"
              className="rounded-lg border p-3"
              required
            />

            <input
              type="date"
              name="date"
              value={form.date}
              onChange={handleChange}
              className="rounded-lg border p-3"
              required
            />

            <input
              type="text"
              name="duration"
              value={form.duration}
              onChange={handleChange}
              placeholder="Duration e.g. 3h 30m"
              className="rounded-lg border p-3"
              required
            />

            <input
              type="time"
              name="departure"
              value={form.departure}
              onChange={handleChange}
              className="rounded-lg border p-3"
              required
            />

            <input
              type="time"
              name="arrival"
              value={form.arrival}
              onChange={handleChange}
              className="rounded-lg border p-3"
              required
            />
          </div>
        </div>

        {/* Pricing */}

        <div>
          <h2 className="mb-4 text-xl font-semibold">
            Pricing & Seats
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <input
              type="number"
              name="price"
              value={form.price}
              onChange={handleChange}
              placeholder="Price"
              className="rounded-lg border p-3"
              required
            />

            <input
              type="number"
              name="seatCount"
              value={form.seatCount}
              onChange={handleChange}
              placeholder="Number of seats"
              className="rounded-lg border p-3"
              min="1"
              required
            />
          </div>
        </div>

        {/* Image */}

        <div>
          <h2 className="mb-4 text-xl font-semibold">
            Bus Image
          </h2>

          <input
            name="image"
            value={form.image}
            onChange={handleChange}
            placeholder="Image URL"
            className="w-full rounded-lg border p-3"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-teal-700 px-6 py-3 font-semibold text-white hover:bg-teal-800 disabled:opacity-50"
        >
          {loading ? "Adding Bus..." : "Add Bus"}
        </button>
      </form>
    </div>
  );
}