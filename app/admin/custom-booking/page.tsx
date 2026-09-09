"use client";

import { useState } from "react";
import {
  ArrowRight,
  Bus as BusIcon,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock,
  Loader2,
  MapPin,
  Printer,
  Search,
  Users,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";

import type { BusAvailability } from "@/libs/availability";
import SeatMap from "@/components/avaialibility/SeatMap";

type CustomSearch = {
  pickup: string;
  dropoff: string;
  date: string;
  time?: string;
  passengers: number;
};

type BookingResponse = {
  success?: boolean;
  message?: string;
  error?: string;

  booking?: {
    _id?: string;
    bookingRef?: string;
    bookingReference?: string;
    status?: string;

    pricePerSeat?: number;
    subtotal?: number;
    discount?: number;
    discountAmount?: number;
    totalFare?: number;

    passengerName?: string;
    passengerEmail?: string;
    passengerPhone?: string;
    gender?: string;

    seats?: string[];
    travelDate?: string;
    travelTime?: string;
  };
};

// =========================================================
// LOCATIONS
// =========================================================

const locations = [
  "Hunza",
  "Gilgit",
  "Islamabad",
  "Karachi",
];

export default function CustomBookingPage() {
  const router = useRouter();

  // =========================================================
  // SEARCH STATE
  // =========================================================

  const [pickup, setPickup] = useState("");
  const [destination, setDestination] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [passengers, setPassengers] = useState(1);

  const [buses, setBuses] =
    useState<BusAvailability[]>([]);

  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [redirecting, setRedirecting] =
    useState(false);

  // =========================================================
  // BUS / SEAT STATE
  // =========================================================

  const [selectedBus, setSelectedBus] =
    useState<BusAvailability | null>(null);

  const [currentBus, setCurrentBus] =
    useState<BusAvailability | null>(null);

  const [showSeats, setShowSeats] = useState(false);

  const [loadingSeats, setLoadingSeats] =
    useState(false);

  const [seatError, setSeatError] =
    useState<string | null>(null);

  const [selectedSeats, setSelectedSeats] =
    useState<string[]>([]);

  // =========================================================
  // BOOKING STATE
  // =========================================================

  const [showBookingModal, setShowBookingModal] =
    useState(false);

  const [submitting, setSubmitting] =
    useState(false);

  const [submitError, setSubmitError] =
    useState<string | null>(null);

  const [submitted, setSubmitted] =
    useState(false);

  const [bookingReference, setBookingReference] =
    useState<string | null>(null);

  // =========================================================
  // PASSENGER
  // =========================================================

  const [passenger, setPassenger] = useState({
    name: "",
    email: "",
    phone: "",
    gender: "",
  });

  // =========================================================
  // DISCOUNT
  // =========================================================

  const [discount, setDiscount] = useState(0);

  // =========================================================
  // TODAY
  // =========================================================

  const today = new Date()
    .toISOString()
    .split("T")[0];

  // =========================================================
  // FARE CALCULATION
  // =========================================================

  const subtotal = currentBus
    ? Number(currentBus.price || 0) *
      selectedSeats.length
    : 0;

  const discountPercentage = Math.min(
    100,
    Math.max(0, Number(discount) || 0)
  );

  const discountAmount =
    subtotal *
    (discountPercentage / 100);

  const totalFare = Math.max(
    0,
    subtotal - discountAmount
  );

  // =========================================================
  // PASSENGER COUNT CHANGE
  //
  // IMPORTANT:
  // Admin physical booking must select exactly the
  // number of seats equal to passenger count.
  //
  // Changing passenger count clears current seat/bus
  // selection to prevent invalid combinations.
  // =========================================================

  const handlePassengersChange = (
    value: string
  ) => {
    const numericValue = Number(value);

    const newPassengers =
      Number.isFinite(numericValue) &&
      numericValue >= 1
        ? Math.floor(numericValue)
        : 1;

    setPassengers(newPassengers);

    // Clear current selection because the required
    // number of seats has changed.
    setSelectedSeats([]);
    setSelectedBus(null);
    setCurrentBus(null);
    setShowSeats(false);
    setSeatError(null);
    setSubmitError(null);
  };

  // =========================================================
  // SEARCH
  // =========================================================

  const handleSearch = async () => {
    setError(null);
    setSearched(false);

    if (!pickup.trim()) {
      setError(
        "Please select pickup location."
      );
      return;
    }

    if (!destination.trim()) {
      setError(
        "Please select destination."
      );
      return;
    }

    if (pickup === destination) {
      setError(
        "Pickup location and destination cannot be the same."
      );
      return;
    }

    if (!date) {
      setError(
        "Please select a travel date."
      );
      return;
    }

    if (date < today) {
      setError(
        "Travel date cannot be in the past."
      );
      return;
    }

    if (passengers < 1) {
      setError(
        "Passengers must be at least 1."
      );
      return;
    }

    setLoading(true);

    try {
      const search: CustomSearch = {
        pickup: pickup.trim(),
        dropoff: destination.trim(),
        date,
        time: time || undefined,
        passengers,
      };

      const res = await fetch(
        "/api/availability",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify(search),
          cache: "no-store",
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.error ||
            "Unable to search for buses."
        );
      }

      setBuses(data.results || []);
      setSearched(true);

      setSelectedBus(null);
      setCurrentBus(null);
      setShowSeats(false);
      setSelectedSeats([]);
      setSeatError(null);
      setSubmitError(null);
    } catch (err) {
      console.error(
        "BUS SEARCH ERROR:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while searching buses."
      );

      setBuses([]);
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // SELECT BUS
  // =========================================================

  const handleSelectBus = (
    bus: BusAvailability
  ) => {
    if (
      bus.availableSeats <
      passengers
    ) {
      setSeatError(
        `This bus only has ${
          bus.availableSeats
        } available seat${
          bus.availableSeats !== 1
            ? "s"
            : ""
        }, but you selected ${
          passengers
        } passenger${
          passengers !== 1
            ? "s"
            : ""
        }.`
      );

      return;
    }

    setSelectedBus(bus);
    setCurrentBus(null);
    setShowSeats(false);
    setSelectedSeats([]);
    setSeatError(null);
    setSubmitError(null);
  };

  // =========================================================
  // VIEW SEATS
  // =========================================================

  const handleViewSeats = async () => {
    if (!selectedBus) {
      setSeatError(
        "Please select a bus first."
      );
      return;
    }

    if (showSeats) {
      setShowSeats(false);
      return;
    }

    try {
      setLoadingSeats(true);
      setSeatError(null);
      setSelectedSeats([]);
      setSubmitError(null);

      const res = await fetch(
        `/api/busses/${selectedBus.id}`,
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.error ||
            "Unable to load latest seat availability."
        );
      }

      if (!data.bus) {
        throw new Error(
          "Bus data was not returned."
        );
      }

      setCurrentBus(data.bus);
      setSelectedSeats([]);
      setShowSeats(true);
    } catch (err) {
      console.error(
        "VIEW_SEATS_ERROR:",
        err
      );

      setSeatError(
        err instanceof Error
          ? err.message
          : "Unable to load seat availability."
      );
    } finally {
      setLoadingSeats(false);
    }
  };

  // =========================================================
  // CONTINUE
  //
  // ADMIN MUST SELECT EXACTLY PASSENGER COUNT
  // =========================================================

  const handleContinue = () => {
    if (!selectedBus || !currentBus) {
      setSubmitError(
        "Please select a bus."
      );
      return;
    }

    if (selectedSeats.length === 0) {
      setSubmitError(
        "Please select your seats."
      );
      return;
    }

    // EXACT seat count validation
    if (
      selectedSeats.length !==
      passengers
    ) {
      setSubmitError(
        `Please select exactly ${
          passengers
        } seat${
          passengers !== 1
            ? "s"
            : ""
        } for ${
          passengers
        } passenger${
          passengers !== 1
            ? "s"
            : ""
        }.`
      );
      return;
    }

    if (
      selectedSeats.length >
      currentBus.availableSeats
    ) {
      setSubmitError(
        "Some selected seats are no longer available."
      );
      return;
    }

    setSubmitError(null);
    setShowBookingModal(true);
  };

  // =========================================================
  // DISCOUNT CHANGE
  // =========================================================

  const handleDiscountChange = (
    value: string
  ) => {
    if (value === "") {
      setDiscount(0);
      return;
    }

    const numericValue = Number(value);

    if (
      !Number.isFinite(
        numericValue
      )
    ) {
      return;
    }

    setDiscount(
      Math.min(
        100,
        Math.max(0, numericValue)
      )
    );
  };

  // =========================================================
  // CONFIRM BOOKING
  // =========================================================

  const handleConfirm = async () => {
    if (
      !passenger.name.trim() ||
      !passenger.email.trim() ||
      !passenger.phone.trim() ||
      !passenger.gender
    ) {
      setSubmitError(
        "Please complete all passenger information."
      );
      return;
    }

    if (!currentBus) {
      setSubmitError(
        "Bus information is missing."
      );
      return;
    }

    // EXACT seat count validation
    if (
      selectedSeats.length !==
      passengers
    ) {
      setSubmitError(
        `Please select exactly ${
          passengers
        } seat${
          passengers !== 1
            ? "s"
            : ""
        } for ${
          passengers
        } passenger${
          passengers !== 1
            ? "s"
            : ""
        }.`
      );
      return;
    }

    if (
      selectedSeats.length >
      currentBus.availableSeats
    ) {
      setSubmitError(
        "Some selected seats are no longer available."
      );
      return;
    }

    if (
      discountPercentage < 0 ||
      discountPercentage > 100
    ) {
      setSubmitError(
        "Discount must be between 0% and 100%."
      );
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch(
        "/api/bookings",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            passenger: {
              name:
                passenger.name.trim(),

              email:
                passenger.email
                  .trim()
                  .toLowerCase(),

              phone:
                passenger.phone.trim(),

              gender:
                passenger.gender,
            },

            busId: currentBus.id,

            seats: selectedSeats,

            // Discount percentage
            discount:
              discountPercentage,
          }),
        }
      );

      const data: BookingResponse =
        await res.json();

      if (!res.ok) {
        throw new Error(
          data.error ||
            "Unable to create your booking request."
        );
      }

      if (
        data.booking?.bookingRef
      ) {
        setBookingReference(
          data.booking.bookingRef
        );
      } else if (
        data.booking
          ?.bookingReference
      ) {
        setBookingReference(
          data.booking
            .bookingReference
        );
      } else if (
        data.booking?._id
      ) {
        setBookingReference(
          data.booking._id
        );
      }

      setSubmitted(true);
    } catch (err) {
      console.error(
        "BOOKING ERROR:",
        err
      );

      setSubmitError(
        err instanceof Error
          ? err.message
          : "Something went wrong while creating your booking."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // =========================================================
  // CLOSE MODAL
  // =========================================================

  const closeBookingModal = () => {
    if (submitting) return;

    setShowBookingModal(false);
    setSubmitted(false);
    setSubmitError(null);
    setBookingReference(null);
  };

  // =========================================================
  // PRINT BOOKING
  // =========================================================

  const handlePrintBooking = () => {
    if (!currentBus) {
      alert(
        "Booking information is not available."
      );
      return;
    }

    const printWindow =
      window.open(
        "",
        "_blank",
        "width=900,height=900"
      );

    if (!printWindow) {
      alert(
        "Please allow pop-ups in your browser to print the booking ticket."
      );
      return;
    }

    const ticketNumber =
      bookingReference ||
      `TKT-${Date.now()
        .toString()
        .slice(-8)}`;

    const issueDate =
      new Date().toLocaleDateString(
        "en-PK",
        {
          weekday: "short",
          year: "numeric",
          month: "short",
          day: "numeric",
        }
      );

    const travelDate =
      currentBus.departure
        ? new Date(
            `${currentBus.departure}T00:00:00`
          ).toLocaleDateString(
            "en-PK",
            {
              weekday: "short",
              year: "numeric",
              month: "short",
              day: "numeric",
            }
          )
        : date || "N/A";

    const formatCurrency = (
      amount: number
    ) => {
      return `Rs. ${Number(
        amount || 0
      ).toLocaleString("en-PK", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      })}`;
    };

    const passengerName =
      passenger.name.trim() ||
      "N/A";

    const passengerPhone =
      passenger.phone.trim() ||
      "N/A";

    const passengerEmail =
      passenger.email.trim() ||
      "N/A";

    const passengerGender =
      passenger.gender
        ? passenger.gender
            .charAt(0)
            .toUpperCase() +
          passenger.gender.slice(1)
        : "N/A";

    const busNumber =
      currentBus.busNumber ||
      "N/A";

    const pickupLocation =
      currentBus.pickup ||
      pickup ||
      "N/A";

    const destinationLocation =
      currentBus.dropoff ||
      destination ||
      "N/A";

    const departureTime =
      currentBus.departure ||
      time ||
      "N/A";

    const arrivalTime =
      currentBus.arrival ||
      "N/A";

    const route =
      currentBus.route ||
      `${pickupLocation} → ${destinationLocation}`;

    const seatCount =
      selectedSeats.length;

    const seatsText =
      selectedSeats.length
        ? selectedSeats.join(", ")
        : "N/A";

    const pricePerSeat =
      Number(currentBus.price) ||
      0;

    const calculatedSubtotal =
      pricePerSeat * seatCount;

    const calculatedDiscountPercentage =
      Math.min(
        100,
        Math.max(
          0,
          Number(discount) || 0
        )
      );

    const calculatedDiscountAmount =
      calculatedSubtotal *
      (calculatedDiscountPercentage /
        100);

    const calculatedTotal =
      Math.max(
        0,
        calculatedSubtotal -
          calculatedDiscountAmount
      );

    printWindow.document.write(`
      <!DOCTYPE html>

      <html lang="en">

      <head>

        <meta charset="UTF-8" />

        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0"
        />

        <title>
          Haikal Tours - ${ticketNumber}
        </title>

        <style>

          * {
            box-sizing: border-box;
          }

          html,
          body {
            margin: 0;
            padding: 0;
            background: #f1f5f9;
            color: #0f172a;
            font-family:
              Arial,
              Helvetica,
              sans-serif;
          }

          body {
            padding: 24px;
          }

          .ticket-container {
            width: 100%;
            max-width: 820px;
            margin: 0 auto;
          }

          .ticket {
            overflow: hidden;
            background: #ffffff;
            border: 1px solid #dbe4ea;
            border-radius: 18px;
            box-shadow:
              0 10px 30px
              rgba(15, 23, 42, 0.08);
          }

          .header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 20px;
            padding: 22px 26px;
            color: white;
            background: #0f766e;
          }

          .brand {
            display: flex;
            align-items: center;
            gap: 12px;
          }

          .logo {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 48px;
            height: 48px;
            color: #0f766e;
            background: white;
            border-radius: 13px;
            font-size: 20px;
            font-weight: 900;
          }

          .brand-name {
            font-size: 23px;
            font-weight: 900;
            letter-spacing: -0.5px;
          }

          .brand-subtitle {
            margin-top: 3px;
            font-size: 10px;
            opacity: 0.85;
          }

          .ticket-info {
            text-align: right;
          }

          .ticket-label {
            font-size: 9px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1.2px;
            opacity: 0.8;
          }

          .ticket-number {
            margin-top: 4px;
            font-size: 17px;
            font-weight: 900;
          }

          .status-bar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 15px;
            padding: 11px 26px;
            background: #f0fdfa;
            border-bottom: 1px solid #ccfbf1;
          }

          .status {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 5px 10px;
            color: #047857;
            background: #d1fae5;
            border-radius: 999px;
            font-size: 10px;
            font-weight: 800;
            text-transform: uppercase;
          }

          .issue-date {
            color: #64748b;
            font-size: 10px;
          }

          .content {
            padding: 22px 26px;
          }

          .section {
            margin-bottom: 18px;
          }

          .section:last-child {
            margin-bottom: 0;
          }

          .section-title {
            margin-bottom: 8px;
            color: #0f766e;
            font-size: 10px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 0.9px;
          }

          .journey {
            padding: 14px 16px;
            background: #f8fafc;
            border: 1px solid #dbe4ea;
            border-radius: 13px;
          }

          .journey-route {
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: 17px;
            font-weight: 900;
          }

          .route-arrow {
            color: #0f766e;
          }

          .route-name {
            margin-top: 5px;
            color: #64748b;
            font-size: 10px;
          }

          .grid {
            display: grid;
            grid-template-columns:
              repeat(2, minmax(0, 1fr));
            gap: 1px;
            overflow: hidden;
            background: #e2e8f0;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
          }

          .item {
            padding: 10px 13px;
            background: white;
          }

          .label {
            color: #94a3b8;
            font-size: 8px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }

          .value {
            margin-top: 3px;
            color: #0f172a;
            font-size: 12px;
            font-weight: 800;
            word-break: break-word;
          }

          .seat-box {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 15px;
            padding: 11px 14px;
            background: #f0fdfa;
            border: 1px dashed #99f6e4;
            border-radius: 11px;
          }

          .seat-label {
            color: #64748b;
            font-size: 10px;
            font-weight: 700;
          }

          .seat-value {
            color: #115e59;
            font-size: 13px;
            font-weight: 900;
            text-align: right;
          }

          .fare {
            overflow: hidden;
            border: 1px solid #dbe4ea;
            border-radius: 12px;
          }

          .fare-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 15px;
            padding: 8px 13px;
            font-size: 11px;
          }

          .fare-label {
            color: #64748b;
          }

          .fare-value {
            color: #334155;
            font-weight: 800;
          }

          .discount {
            color: #059669;
          }

          .total {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 12px 14px;
            background: #f0fdfa;
            border-top: 1px solid #e2e8f0;
          }

          .total-label {
            color: #334155;
            font-size: 13px;
            font-weight: 900;
          }

          .total-value {
            color: #0f766e;
            font-size: 20px;
            font-weight: 900;
          }

          .footer {
            display: flex;
            justify-content: space-between;
            gap: 25px;
            padding: 15px 26px;
            background: #f8fafc;
            border-top: 1px solid #e2e8f0;
          }

          .footer-title {
            color: #334155;
            font-size: 9px;
            font-weight: 900;
            text-transform: uppercase;
          }

          .footer-text {
            margin-top: 4px;
            color: #64748b;
            font-size: 9px;
            line-height: 1.5;
          }

          .footer-right {
            text-align: right;
          }

          @media print {

            @page {
              size: A4;
              margin: 7mm;
            }

            html,
            body {
              margin: 0 !important;
              padding: 0 !important;
              background: white !important;
            }

            .ticket-container {
              width: 100%;
              max-width: none;
            }

            .ticket {
              border-radius: 0;
              box-shadow: none;
              border: 1px solid #cbd5e1;
            }

            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          }

          @media screen and (max-width: 600px) {

            body {
              padding: 8px;
            }

            .header {
              align-items: flex-start;
              flex-direction: column;
              padding: 17px;
            }

            .ticket-info {
              text-align: left;
            }

            .status-bar {
              padding: 10px 17px;
              align-items: flex-start;
              flex-direction: column;
            }

            .content {
              padding: 17px;
            }

            .grid {
              grid-template-columns: 1fr;
            }

            .footer {
              flex-direction: column;
              padding: 15px 17px;
            }

            .footer-right {
              text-align: left;
            }

            .journey-route {
              font-size: 15px;
            }
          }

        </style>

      </head>

      <body>

        <div class="ticket-container">

          <div class="ticket">

            <div class="header">

              <div class="brand">

                <div class="logo">
                  HT
                </div>

                <div>

                  <div class="brand-name">
                    Haikal Tours
                  </div>

                  <div class="brand-subtitle">
                    Bus Ticket & Booking Service
                  </div>

                </div>

              </div>

              <div class="ticket-info">

                <div class="ticket-label">
                  Ticket Number
                </div>

                <div class="ticket-number">
                  ${ticketNumber}
                </div>

              </div>

            </div>

            <div class="status-bar">

              <div class="status">
                ✓ Booking Submitted
              </div>

              <div class="issue-date">
                Ticket issued: ${issueDate}
              </div>

            </div>

            <div class="content">

              <div class="section">

                <div class="section-title">
                  Journey
                </div>

                <div class="journey">

                  <div class="journey-route">

                    <span>
                      ${pickupLocation}
                    </span>

                    <span class="route-arrow">
                      →
                    </span>

                    <span>
                      ${destinationLocation}
                    </span>

                  </div>

                  <div class="route-name">
                    ${route}
                  </div>

                </div>

              </div>

              <div class="section">

                <div class="section-title">
                  Travel Details
                </div>

                <div class="grid">

                  <div class="item">
                    <div class="label">
                      Travel Date
                    </div>
                    <div class="value">
                      ${travelDate}
                    </div>
                  </div>

                  <div class="item">
                    <div class="label">
                      Departure Time
                    </div>
                    <div class="value">
                      ${departureTime}
                    </div>
                  </div>

                  <div class="item">
                    <div class="label">
                      Arrival Time
                    </div>
                    <div class="value">
                      ${arrivalTime}
                    </div>
                  </div>

                  <div class="item">
                    <div class="label">
                      Bus Number
                    </div>
                    <div class="value">
                      ${busNumber}
                    </div>
                  </div>

                  <div class="item">
                    <div class="label">
                      Pickup Location
                    </div>
                    <div class="value">
                      ${pickupLocation}
                    </div>
                  </div>

                  <div class="item">
                    <div class="label">
                      Destination
                    </div>
                    <div class="value">
                      ${destinationLocation}
                    </div>
                  </div>

                </div>

              </div>

              <div class="section">

                <div class="section-title">
                  Passenger Information
                </div>

                <div class="grid">

                  <div class="item">
                    <div class="label">
                      Passenger Name
                    </div>

                    <div class="value">
                      ${passengerName}
                    </div>
                  </div>

                  <div class="item">
                    <div class="label">
                      Gender
                    </div>

                    <div class="value">
                      ${passengerGender}
                    </div>
                  </div>

                  <div class="item">
                    <div class="label">
                      Contact Number
                    </div>

                    <div class="value">
                      ${passengerPhone}
                    </div>
                  </div>

                  <div class="item">
                    <div class="label">
                      Email
                    </div>

                    <div class="value">
                      ${passengerEmail}
                    </div>
                  </div>

                </div>

              </div>

              <div class="section">

                <div class="section-title">
                  Seat Information
                </div>

                <div class="seat-box">

                  <div class="seat-label">
                    Selected Seat${
                      seatCount !== 1
                        ? "s"
                        : ""
                    }
                  </div>

                  <div class="seat-value">
                    ${seatsText}
                  </div>

                </div>

              </div>

              <div class="section">

                <div class="section-title">
                  Fare Summary
                </div>

                <div class="fare">

                  <div class="fare-row">

                    <span class="fare-label">
                      Fare per seat
                    </span>

                    <span class="fare-value">
                      ${formatCurrency(
                        pricePerSeat
                      )}
                    </span>

                  </div>

                  <div class="fare-row">

                    <span class="fare-label">
                      Number of seats
                    </span>

                    <span class="fare-value">
                      ${seatCount}
                    </span>

                  </div>

                  <div class="fare-row">

                    <span class="fare-label">
                      Subtotal
                    </span>

                    <span class="fare-value">
                      ${formatCurrency(
                        calculatedSubtotal
                      )}
                    </span>

                  </div>

                  ${
                    calculatedDiscountPercentage >
                    0
                      ? `
                        <div class="fare-row discount">

                          <span>
                            Discount (${calculatedDiscountPercentage}%)
                          </span>

                          <span>
                            - ${formatCurrency(
                              calculatedDiscountAmount
                            )}
                          </span>

                        </div>
                      `
                      : ""
                  }

                  <div class="total">

                    <span class="total-label">
                      Total Fare
                    </span>

                    <span class="total-value">
                      ${formatCurrency(
                        calculatedTotal
                      )}
                    </span>

                  </div>

                </div>

              </div>

            </div>

            <div class="footer">

              <div>

                <div class="footer-title">
                  Important Information
                </div>

                <div class="footer-text">
                  Please keep this ticket with you
                  during your journey.<br />
                  Please arrive at the pickup point
                  at least 15 minutes before departure.
                </div>

              </div>

              <div class="footer-right">

                <div class="footer-title">
                  Haikal Tours
                </div>

                <div class="footer-text">
                  Bus Booking & Travel Service<br />
                  Passenger Contact: ${passengerPhone}
                </div>

              </div>

            </div>

          </div>

        </div>

        <script>

          window.onload = function () {

            setTimeout(function () {
              window.print();
            }, 500);

          };

          window.onafterprint = function () {

            setTimeout(function () {
              window.close();
            }, 300);

          };

        </script>

      </body>

      </html>
    `);

    printWindow.document.close();
  };

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="custom-booking-screen min-h-full w-full bg-slate-50">

      <div className="mx-auto w-full max-w-[1500px] px-3 py-4 sm:px-5 sm:py-6 lg:px-8 lg:py-8">

        {/* ===================================================
            PAGE HEADER
        =================================================== */}

        <div className="mb-5 sm:mb-7">

          <div className="flex items-start gap-3">

            <div className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-teal-700 text-white shadow-sm sm:flex">
              <BusIcon size={22} />
            </div>

            <div>

              <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl lg:text-3xl">
                Custom Bus Booking
              </h1>

              <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-500 sm:text-sm">
                Search available buses, choose your seats,
                and create a booking request.
              </p>

            </div>

          </div>

        </div>

        {/* ===================================================
            SEARCH CARD
        =================================================== */}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="border-b border-slate-100 px-4 py-4 sm:px-6">

            <div className="flex items-center gap-2">

              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                <Search size={18} />
              </div>

              <div>

                <h2 className="text-sm font-bold text-slate-900 sm:text-base">
                  Find your bus
                </h2>

                <p className="text-xs text-slate-500">
                  Enter your travel details below
                </p>

              </div>

            </div>

          </div>

          <div className="p-4 sm:p-6">

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">

              {/* PICKUP */}

              <div>

                <label className="mb-1.5 block text-xs font-bold text-slate-700 sm:text-sm">
                  Pickup location
                </label>

                <div className="relative">

                  <MapPin
                    size={17}
                    className="pointer-events-none absolute left-3.5 top-1/2 z-10 -translate-y-1/2 text-slate-400"
                  />

                  <select
                    value={pickup}
                    onChange={(e) =>
                      setPickup(
                        e.target.value
                      )
                    }
                    className={`h-12 w-full appearance-none rounded-xl border bg-white pl-10 pr-10 text-sm outline-none transition hover:border-slate-300 focus:border-teal-600 focus:ring-4 focus:ring-teal-50 ${
                      pickup
                        ? "border-slate-200 text-slate-900"
                        : "border-slate-200 text-slate-400"
                    }`}
                  >

                    <option value="">
                      Select pickup location
                    </option>

                    {locations.map(
                      (location) => (
                        <option
                          key={location}
                          value={location}
                        >
                          {location}
                        </option>
                      )
                    )}

                  </select>

                  <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </div>

                </div>

              </div>

              {/* DESTINATION */}

              <div>

                <label className="mb-1.5 block text-xs font-bold text-slate-700 sm:text-sm">
                  Destination
                </label>

                <div className="relative">

                  <MapPin
                    size={17}
                    className="pointer-events-none absolute left-3.5 top-1/2 z-10 -translate-y-1/2 text-slate-400"
                  />

                  <select
                    value={destination}
                    onChange={(e) =>
                      setDestination(
                        e.target.value
                      )
                    }
                    className={`h-12 w-full appearance-none rounded-xl border bg-white pl-10 pr-10 text-sm outline-none transition hover:border-slate-300 focus:border-teal-600 focus:ring-4 focus:ring-teal-50 ${
                      destination
                        ? "border-slate-200 text-slate-900"
                        : "border-slate-200 text-slate-400"
                    }`}
                  >

                    <option value="">
                      Select destination
                    </option>

                    {locations.map(
                      (location) => (
                        <option
                          key={location}
                          value={location}
                        >
                          {location}
                        </option>
                      )
                    )}

                  </select>

                  <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </div>

                </div>

              </div>

              {/* DATE */}

              <div>

                <label className="mb-1.5 block text-xs font-bold text-slate-700 sm:text-sm">
                  Travel date
                </label>

                <div className="relative">

                  <CalendarDays
                    size={17}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    type="date"
                    min={today}
                    value={date}
                    onChange={(e) =>
                      setDate(
                        e.target.value
                      )
                    }
                    className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-900 outline-none transition hover:border-slate-300 focus:border-teal-600 focus:ring-4 focus:ring-teal-50"
                  />

                </div>

              </div>

              {/* TIME */}

              <div>

                <label className="mb-1.5 block text-xs font-bold text-slate-700 sm:text-sm">
                  Departure time
                </label>

                <div className="relative">

                  <Clock
                    size={17}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    type="time"
                    value={time}
                    onChange={(e) =>
                      setTime(
                        e.target.value
                      )
                    }
                    className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-900 outline-none transition hover:border-slate-300 focus:border-teal-600 focus:ring-4 focus:ring-teal-50"
                  />

                </div>

              </div>

              {/* PASSENGERS */}

              <div>

                <label className="mb-1.5 block text-xs font-bold text-slate-700 sm:text-sm">
                  Passengers
                </label>

                <div className="relative">

                  <Users
                    size={17}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    type="number"
                    min={1}
                    step={1}
                    value={passengers}
                    onChange={(e) =>
                      handlePassengersChange(
                        e.target.value
                      )
                    }
                    className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-900 outline-none transition hover:border-slate-300 focus:border-teal-600 focus:ring-4 focus:ring-teal-50"
                  />

                </div>

                <p className="mt-1.5 text-[10px] text-slate-400">
                  Select exactly {passengers} seat
                  {passengers !== 1
                    ? "s"
                    : ""}{" "}
                  for this booking.
                </p>

              </div>

            </div>

            {/* SEARCH ERROR */}

            {error && (
              <div
                role="alert"
                className="mt-4 flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                <X
                  size={17}
                  className="mt-0.5 shrink-0"
                />

                <span>{error}</span>

              </div>
            )}

            {/* SEARCH BUTTON */}

            <div className="mt-5 flex">

              <button
                type="button"
                onClick={handleSearch}
                disabled={loading}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-teal-700 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-teal-800 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 sm:ml-auto sm:w-auto sm:min-w-[170px]"
              >

                {loading ? (
                  <>
                    <Loader2
                      size={18}
                      className="animate-spin"
                    />

                    Searching...
                  </>
                ) : (
                  <>
                    <Search size={18} />

                    Search Buses
                  </>
                )}

              </button>

            </div>

          </div>

        </section>

        {/* ===================================================
            SEARCH RESULTS
        =================================================== */}

        {searched && (
          <section className="mt-6 sm:mt-8">

            <div className="mb-4 flex items-end justify-between gap-3 sm:mb-5">

              <div>

                <h2 className="text-lg font-bold text-slate-900 sm:text-xl lg:text-2xl">
                  Available buses
                </h2>

                <p className="mt-0.5 text-xs text-slate-500 sm:text-sm">
                  {buses.length}{" "}
                  {buses.length === 1
                    ? "bus"
                    : "buses"}{" "}
                  found for your search
                </p>

              </div>

              {buses.length > 0 && (
                <div className="hidden rounded-full bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-700 sm:block">
                  {passengers} passenger
                  {passengers !== 1
                    ? "s"
                    : ""}
                </div>
              )}

            </div>

            {/* NO RESULTS */}

            {buses.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white px-5 py-12 text-center shadow-sm sm:py-16">

                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                  <BusIcon size={28} />
                </div>

                <h3 className="mt-4 text-base font-bold text-slate-800 sm:text-lg">
                  No buses found
                </h3>

                <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-slate-500 sm:text-sm">
                  Try changing your pickup location,
                  destination, date, or departure time.
                </p>

              </div>
            ) : (
              <div className="space-y-4">

                {buses.map((bus) => {

                  const isSelected =
                    selectedBus?.id ===
                    bus.id;

                  const hasEnoughSeats =
                    bus.availableSeats >=
                    passengers;

                  return (
                    <article
                      key={bus.id}
                      className={`overflow-hidden rounded-2xl border bg-white shadow-sm transition-all ${
                        isSelected
                          ? "border-teal-500 ring-2 ring-teal-100"
                          : "border-slate-200 hover:border-slate-300 hover:shadow-md"
                      }`}
                    >

                      {isSelected && (
                        <div className="flex items-center gap-2 bg-teal-700 px-4 py-2 text-xs font-semibold text-white">
                          <Check size={15} />
                          Bus selected
                        </div>
                      )}

                      <div className="p-4 sm:p-5 lg:p-6">

                        {/* BUS IDENTITY */}

                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">

                          <div className="flex min-w-0 items-center gap-3">

                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-teal-700 sm:h-14 sm:w-14">
                              <BusIcon
                                size={24}
                                strokeWidth={1.8}
                              />
                            </div>

                            <div className="min-w-0">

                              <h3 className="truncate text-base font-bold text-slate-900 sm:text-lg">
                                {bus.busNumber}
                              </h3>

                              <p className="mt-0.5 text-xs text-slate-500">
                                Bus service
                              </p>

                            </div>

                          </div>

                          <div className="flex items-center justify-between gap-3 lg:justify-end">

                            <span
                              className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                                hasEnoughSeats
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-red-50 text-red-700"
                              }`}
                            >
                              {
                                bus.availableSeats
                              }{" "}
                              seats available
                            </span>

                          </div>

                        </div>

                        {/* ROUTE */}

                        <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50 p-4 sm:mt-6 sm:p-5">

                          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 sm:gap-6">

                            <div className="min-w-0">

                              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 sm:text-xs">
                                Departure
                              </p>

                              <p className="mt-1 text-lg font-extrabold text-slate-900 sm:text-xl">
                                {bus.departure}
                              </p>

                              <div className="mt-1 flex items-start gap-1.5">

                                <MapPin
                                  size={13}
                                  className="mt-0.5 shrink-0 text-slate-400"
                                />

                                <p className="truncate text-xs text-slate-500 sm:text-sm">
                                  {bus.pickup}
                                </p>

                              </div>

                            </div>

                            <div className="flex flex-col items-center gap-1">

                              <div className="flex h-9 w-9 items-center justify-center rounded-full border border-teal-100 bg-white text-teal-700 shadow-sm">
                                <ArrowRight
                                  size={17}
                                />
                              </div>

                              <span className="hidden text-[10px] font-medium text-slate-400 sm:block">
                                Route
                              </span>

                            </div>

                            <div className="min-w-0 text-right">

                              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 sm:text-xs">
                                Arrival
                              </p>

                              <p className="mt-1 text-lg font-extrabold text-slate-900 sm:text-xl">
                                {bus.arrival}
                              </p>

                              <div className="mt-1 flex items-start justify-end gap-1.5">

                                <p className="truncate text-xs text-slate-500 sm:text-sm">
                                  {bus.dropoff}
                                </p>

                                <MapPin
                                  size={13}
                                  className="mt-0.5 shrink-0 text-slate-400"
                                />

                              </div>

                            </div>

                          </div>

                        </div>

                        {/* PRICE + ACTIONS */}

                        <div className="mt-5 flex flex-col gap-4 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">

                          <div>

                            <p className="text-xs font-medium text-slate-400">
                              Fare per seat
                            </p>

                            <p className="mt-0.5 text-xl font-extrabold text-teal-700 sm:text-2xl">
                              Rs.{" "}
                              {Number(
                                bus.price
                              ).toLocaleString()}
                            </p>

                          </div>

                          <div className="grid grid-cols-1 gap-2 sm:flex sm:min-w-[310px] sm:justify-end">

                            <button
                              type="button"
                              onClick={() =>
                                handleSelectBus(
                                  bus
                                )
                              }
                              disabled={
                                !hasEnoughSeats
                              }
                              className={`h-11 rounded-xl px-5 text-sm font-bold transition sm:min-w-[140px] ${
                                !hasEnoughSeats
                                  ? "cursor-not-allowed bg-slate-100 text-slate-400"
                                  : isSelected
                                    ? "bg-teal-700 text-white"
                                    : "border border-slate-200 bg-white text-slate-700 hover:border-teal-600 hover:text-teal-700"
                              }`}
                            >

                              {isSelected ? (
                                <span className="inline-flex items-center gap-2">
                                  <Check
                                    size={16}
                                  />
                                  Selected
                                </span>
                              ) : !hasEnoughSeats ? (
                                "Not Enough Seats"
                              ) : (
                                "Select Bus"
                              )}

                            </button>

                            {isSelected && (
                              <button
                                type="button"
                                onClick={
                                  handleViewSeats
                                }
                                disabled={
                                  loadingSeats
                                }
                                className="flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 sm:min-w-[150px]"
                              >

                                {loadingSeats ? (
                                  <>
                                    <Loader2
                                      size={17}
                                      className="animate-spin"
                                    />
                                    Loading...
                                  </>
                                ) : showSeats ? (
                                  <>
                                    <X
                                      size={17}
                                    />
                                    Hide Seats
                                  </>
                                ) : (
                                  <>
                                    <BusIcon
                                      size={17}
                                    />
                                    See Seats
                                  </>
                                )}

                              </button>
                            )}

                          </div>

                        </div>

                        {/* SEAT ERROR */}

                        {isSelected &&
                          seatError && (
                            <div
                              role="alert"
                              className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-xs text-red-700 sm:text-sm"
                            >
                              {seatError}
                            </div>
                          )}

                        {/* =================================================
                            SEAT SECTION
                        ================================================= */}

                        {isSelected &&
                          showSeats &&
                          currentBus && (
                            <div className="mt-6 border-t border-slate-100 pt-6">

                              <div className="mb-5">

                                <div className="flex items-start justify-between gap-3">

                                  <div>

                                    <h3 className="text-lg font-bold text-slate-900 sm:text-xl">
                                      Choose your seats
                                    </h3>

                                    <p className="mt-1 text-xs leading-5 text-slate-500 sm:text-sm">
                                      Select exactly{" "}
                                      <span className="font-bold text-teal-700">
                                        {
                                          passengers
                                        }
                                      </span>{" "}
                                      seat
                                      {passengers !==
                                      1
                                        ? "s"
                                        : ""}{" "}
                                      for{" "}
                                      {
                                        passengers
                                      }{" "}
                                      passenger
                                      {passengers !==
                                      1
                                        ? "s"
                                        : ""}.
                                    </p>

                                  </div>

                                  <div className="shrink-0 rounded-xl bg-teal-50 px-3 py-2 text-center">

                                    <p className="text-[10px] font-semibold uppercase tracking-wide text-teal-600">
                                      Selected
                                    </p>

                                    <p className="text-lg font-extrabold text-teal-700">
                                      {
                                        selectedSeats.length
                                      }{" "}
                                      /{" "}
                                      {
                                        passengers
                                      }
                                    </p>

                                  </div>

                                </div>

                              </div>

                              <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:p-5">

                                <div className="mx-auto min-w-[280px] max-w-full">

                                  <SeatMap
                                    key={`${currentBus.id}-${passengers}-${currentBus.seats
                                      .map(
                                        (seat) =>
                                          `${seat.seatNumber}-${seat.status}-${(seat as any).gender || ""}`
                                      )
                                      .join(
                                        "|"
                                      )}`}
                                    seats={
                                      currentBus.seats
                                    }
                                    maxSeats={
                                      passengers
                                    }
                                    onSeatChange={(
                                      seats
                                    ) => {

                                      // Safety check.
                                      // SeatMap itself also prevents
                                      // selecting beyond maxSeats.
                                      if (
                                        seats.length >
                                        passengers
                                      ) {
                                        setSubmitError(
                                          `You can select a maximum of ${passengers} seat${
                                            passengers !==
                                            1
                                              ? "s"
                                              : ""
                                          }.`
                                        );

                                        return;
                                      }

                                      setSubmitError(
                                        null
                                      );

                                      setSelectedSeats(
                                        seats
                                      );
                                    }}
                                  />

                                </div>

                              </div>

                              {/* SELECTED SEATS */}

                              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto]">

                                <div className="rounded-2xl border border-slate-200 bg-white p-4">

                                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                    Selected seats
                                  </p>

                                  <p className="mt-1.5 break-words text-sm font-bold text-slate-900">
                                    {selectedSeats.length >
                                    0
                                      ? selectedSeats.join(
                                          ", "
                                        )
                                      : "No seats selected"}
                                  </p>

                                </div>

                                <div className="rounded-2xl border border-teal-100 bg-teal-50 p-4 sm:min-w-[190px] sm:text-right">

                                  <p className="text-[10px] font-bold uppercase tracking-wider text-teal-600">
                                    Total fare
                                  </p>

                                  <p className="mt-1 text-xl font-extrabold text-teal-700">
                                    Rs.{" "}
                                    {totalFare.toLocaleString()}
                                  </p>

                                </div>

                              </div>

                              {/* SEAT COUNT WARNING */}

                              {selectedSeats.length > 0 &&
                                selectedSeats.length !==
                                  passengers && (
                                  <div className="mt-3 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-center">
                                    <p className="text-xs font-semibold text-amber-700">
                                      Please select{" "}
                                      {passengers -
                                        selectedSeats.length >
                                      0
                                        ? `${
                                            passengers -
                                            selectedSeats.length
                                          } more`
                                        : `${
                                            selectedSeats.length -
                                            passengers
                                          } fewer`}{" "}
                                      seat
                                      {Math.abs(
                                        passengers -
                                          selectedSeats.length
                                      ) !==
                                      1
                                        ? "s"
                                        : ""}{" "}
                                      to continue.
                                    </p>
                                  </div>
                                )}

                              {/* CONTINUE */}

                              <div className="mt-4">

                                <button
                                  type="button"
                                  onClick={
                                    handleContinue
                                  }
                                  disabled={
                                    selectedSeats.length !==
                                    passengers
                                  }
                                  className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-teal-700 px-6 text-sm font-bold text-white shadow-sm transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-40 sm:ml-auto sm:w-auto sm:min-w-[210px]"
                                >
                                  Continue Booking
                                  <ArrowRight
                                    size={17}
                                  />
                                </button>

                              </div>

                            </div>
                          )}

                      </div>

                    </article>
                  );
                })}

              </div>
            )}

          </section>
        )}

      </div>

      {/* =========================================================
          BOOKING MODAL
      ========================================================= */}

      {showBookingModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 p-0 backdrop-blur-[2px] sm:items-center sm:p-4">

          <div className="max-h-[95vh] w-full overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:max-h-[90vh] sm:max-w-xl sm:rounded-3xl">

            {!submitted ? (
              <>
                {/* HEADER */}

                <div className="sticky top-0 z-10 border-b border-slate-100 bg-white px-4 py-4 sm:px-6 sm:py-5">

                  <div className="flex items-start justify-between gap-4">

                    <div className="flex items-center gap-3">

                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                        <Users size={19} />
                      </div>

                      <div>

                        <h2 className="text-base font-bold text-slate-900 sm:text-lg">
                          Passenger information
                        </h2>

                        <p className="mt-0.5 text-xs text-slate-500">
                          Enter passenger details
                        </p>

                      </div>

                    </div>

                    <button
                      type="button"
                      onClick={
                        closeBookingModal
                      }
                      disabled={
                        submitting
                      }
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
                    >
                      <X size={20} />
                    </button>

                  </div>

                </div>

                <div className="max-h-[calc(95vh-80px)] overflow-y-auto p-4 sm:max-h-[calc(90vh-90px)] sm:p-6">

                  <div className="space-y-4">

                    {/* NAME */}

                    <div>

                      <label className="mb-1.5 block text-xs font-bold text-slate-700 sm:text-sm">
                        Passenger name
                      </label>

                      <input
                        type="text"
                        value={
                          passenger.name
                        }
                        onChange={(e) =>
                          setPassenger(
                            (prev) => ({
                              ...prev,
                              name:
                                e.target
                                  .value,
                            })
                          )
                        }
                        placeholder="Full name"
                        className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-4 focus:ring-teal-50"
                      />

                    </div>

                    {/* EMAIL */}

                    <div>

                      <label className="mb-1.5 block text-xs font-bold text-slate-700 sm:text-sm">
                        Email address
                      </label>

                      <input
                        type="email"
                        value={
                          passenger.email
                        }
                        onChange={(e) =>
                          setPassenger(
                            (prev) => ({
                              ...prev,
                              email:
                                e.target
                                  .value,
                            })
                          )
                        }
                        placeholder="you@example.com"
                        className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-4 focus:ring-teal-50"
                      />

                    </div>

                    {/* PHONE */}

                    <div>

                      <label className="mb-1.5 block text-xs font-bold text-slate-700 sm:text-sm">
                        Phone number
                      </label>

                      <input
                        type="tel"
                        value={
                          passenger.phone
                        }
                        onChange={(e) =>
                          setPassenger(
                            (prev) => ({
                              ...prev,
                              phone:
                                e.target
                                  .value,
                            })
                          )
                        }
                        placeholder="03XX XXXXXXX"
                        className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-4 focus:ring-teal-50"
                      />

                    </div>

                    {/* GENDER */}

                    <div>

                      <label className="mb-1.5 block text-xs font-bold text-slate-700 sm:text-sm">
                        Gender
                      </label>

                      <select
                        value={
                          passenger.gender
                        }
                        onChange={(e) =>
                          setPassenger(
                            (prev) => ({
                              ...prev,
                              gender:
                                e.target
                                  .value,
                            })
                          )
                        }
                        className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-50"
                      >

                        <option value="">
                          Select gender
                        </option>

                        <option value="male">
                          Male
                        </option>

                        <option value="female">
                          Female
                        </option>

                      </select>

                    </div>

                    {/* DISCOUNT */}

                    <div>

                      <label className="mb-1.5 block text-xs font-bold text-slate-700 sm:text-sm">
                        Discount (%)
                      </label>

                      <div className="relative">

                        <input
                          type="number"
                          min={0}
                          max={100}
                          step="0.01"
                          value={
                            discount
                          }
                          onChange={(e) =>
                            handleDiscountChange(
                              e.target.value
                            )
                          }
                          placeholder="0"
                          className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 pr-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-teal-600 focus:ring-4 focus:ring-teal-50"
                        />

                        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                          %
                        </span>

                      </div>

                      <p className="mt-1.5 text-[11px] text-slate-400">
                        Enter a percentage discount.
                        Example: 20 means 20% off.
                      </p>

                    </div>

                    {/* BOOKING SUMMARY */}

                    {currentBus && (
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">

                        <div className="mb-3 flex items-center gap-2">

                          <BusIcon
                            size={16}
                            className="text-teal-700"
                          />

                          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                            Booking summary
                          </p>

                        </div>

                        <div className="space-y-2.5">

                          <div className="flex items-start justify-between gap-4 text-sm">
                            <span className="text-slate-500">
                              Bus
                            </span>

                            <span className="text-right font-bold text-slate-900">
                              {
                                currentBus.busNumber
                              }
                            </span>
                          </div>

                          <div className="flex items-start justify-between gap-4 text-sm">
                            <span className="text-slate-500">
                              Pickup
                            </span>

                            <span className="text-right font-bold text-slate-900">
                              {
                                currentBus.pickup
                              }
                            </span>
                          </div>

                          <div className="flex items-start justify-between gap-4 text-sm">
                            <span className="text-slate-500">
                              Destination
                            </span>

                            <span className="text-right font-bold text-slate-900">
                              {
                                currentBus.dropoff
                              }
                            </span>
                          </div>

                          <div className="flex items-start justify-between gap-4 text-sm">
                            <span className="text-slate-500">
                              Travel date
                            </span>

                            <span className="text-right font-bold text-slate-900">
                              {date ||
                                "N/A"}
                            </span>
                          </div>

                          <div className="flex items-start justify-between gap-4 text-sm">
                            <span className="text-slate-500">
                              Departure
                            </span>

                            <span className="text-right font-bold text-slate-900">
                              {
                                currentBus.departure
                              }
                            </span>
                          </div>

                          <div className="flex items-start justify-between gap-4 text-sm">
                            <span className="text-slate-500">
                              Arrival
                            </span>

                            <span className="text-right font-bold text-slate-900">
                              {
                                currentBus.arrival
                              }
                            </span>
                          </div>

                          <div className="flex items-start justify-between gap-4 text-sm">
                            <span className="text-slate-500">
                              Passengers
                            </span>

                            <span className="font-bold text-slate-900">
                              {
                                passengers
                              }
                            </span>
                          </div>

                          <div className="flex items-start justify-between gap-4 text-sm">
                            <span className="text-slate-500">
                              Seats
                            </span>

                            <span className="text-right font-bold text-slate-900">
                              {selectedSeats.join(
                                ", "
                              )}
                            </span>
                          </div>

                          <div className="flex items-start justify-between gap-4 text-sm">
                            <span className="text-slate-500">
                              Fare per seat
                            </span>

                            <span className="font-bold text-slate-900">
                              Rs.{" "}
                              {Number(
                                currentBus.price
                              ).toLocaleString()}
                            </span>
                          </div>

                          <div className="flex items-start justify-between gap-4 text-sm">
                            <span className="text-slate-500">
                              Seats count
                            </span>

                            <span className="font-bold text-slate-900">
                              {
                                selectedSeats.length
                              }{" "}
                              /{" "}
                              {
                                passengers
                              }
                            </span>
                          </div>

                          <div className="flex items-center justify-between border-t border-slate-200 pt-3 text-sm">

                            <span className="font-medium text-slate-600">
                              Subtotal
                            </span>

                            <span className="font-bold text-slate-900">
                              Rs.{" "}
                              {subtotal.toLocaleString()}
                            </span>

                          </div>

                          {discountPercentage >
                            0 && (
                            <div className="flex items-center justify-between text-sm">

                              <span className="font-medium text-emerald-600">
                                Discount (
                                {
                                  discountPercentage
                                }%)
                              </span>

                              <span className="font-bold text-emerald-600">
                                - Rs.{" "}
                                {discountAmount.toLocaleString()}
                              </span>

                            </div>
                          )}

                          <div className="flex items-center justify-between border-t border-slate-200 pt-3">

                            <span className="font-bold text-slate-700">
                              Total
                            </span>

                            <span className="text-xl font-extrabold text-teal-700">
                              Rs.{" "}
                              {totalFare.toLocaleString()}
                            </span>

                          </div>

                        </div>

                      </div>
                    )}

                    {/* ERROR */}

                    {submitError && (
                      <div
                        role="alert"
                        className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-xs leading-5 text-red-700 sm:text-sm"
                      >
                        {submitError}
                      </div>
                    )}

                    {/* CONFIRM */}

                    <button
                      type="button"
                      onClick={
                        handleConfirm
                      }
                      disabled={
                        submitting ||
                        selectedSeats.length !==
                          passengers
                      }
                      className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-teal-700 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-teal-800 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
                    >

                      {submitting ? (
                        <>
                          <Loader2
                            size={18}
                            className="animate-spin"
                          />

                          Submitting booking...
                        </>
                      ) : (
                        <>
                          <Check size={18} />

                          Confirm Booking
                        </>
                      )}

                    </button>

                    <p className="text-center text-[11px] leading-4 text-slate-400">
                      Your booking request will be
                      submitted for confirmation.
                    </p>

                  </div>

                </div>
              </>
            ) : (

              /* =================================================
                 SUCCESS
              ================================================= */

              <div className="px-5 py-10 text-center sm:px-8 sm:py-14">

                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">

                  <CheckCircle2
                    size={34}
                    className="text-emerald-600"
                  />

                </div>

                <h2 className="mt-5 text-xl font-extrabold text-slate-900 sm:text-2xl">
                  Booking submitted
                </h2>

                <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
                  Your booking request has been
                  submitted successfully.
                </p>

                {bookingReference && (
                  <div className="mx-auto mt-6 max-w-sm rounded-2xl border border-teal-100 bg-teal-50 p-4">

                    <p className="text-[10px] font-bold uppercase tracking-wider text-teal-600">
                      Ticket / Booking reference
                    </p>

                    <p className="mt-1 break-all text-lg font-extrabold text-teal-700">
                      {
                        bookingReference
                      }
                    </p>

                  </div>
                )}

                {/* FINAL AMOUNT */}

                <div className="mx-auto mt-4 max-w-sm rounded-2xl border border-slate-200 bg-slate-50 p-4">

                  <div className="flex items-center justify-between text-sm">

                    <span className="text-slate-500">
                      Subtotal
                    </span>

                    <span className="font-bold text-slate-800">
                      Rs.{" "}
                      {subtotal.toLocaleString()}
                    </span>

                  </div>

                  {discountPercentage >
                    0 && (
                    <div className="mt-2 flex items-center justify-between text-sm">

                      <span className="text-emerald-600">
                        Discount (
                        {
                          discountPercentage
                        }%)
                      </span>

                      <span className="font-bold text-emerald-600">
                        - Rs.{" "}
                        {discountAmount.toLocaleString()}
                      </span>

                    </div>
                  )}

                  <div className="mt-3 flex items-center justify-between border-t border-slate-200 pt-3">

                    <span className="font-bold text-slate-700">
                      Total Fare
                    </span>

                    <span className="text-xl font-extrabold text-teal-700">
                      Rs.{" "}
                      {totalFare.toLocaleString()}
                    </span>

                  </div>

                </div>

                {/* PRINT + DONE */}

                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">

                  <button
                    type="button"
                    onClick={
                      handlePrintBooking
                    }
                    className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 transition hover:border-teal-600 hover:bg-teal-50 hover:text-teal-700 sm:w-auto sm:min-w-[170px]"
                  >
                    <Printer size={18} />
                    Print Ticket
                  </button>

                  <button
                    type="button"
                    disabled={
                      redirecting
                    }
                    onClick={() => {
                      setRedirecting(
                        true
                      );

                      setSelectedSeats(
                        []
                      );

                      setTimeout(() => {
                        router.replace(
                          "/admin/dashboard"
                        );
                      }, 1000);
                    }}
                    className="flex h-12 w-full items-center justify-center rounded-xl bg-teal-700 px-5 text-sm font-bold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto sm:min-w-[140px]"
                  >
                    {redirecting
                      ? "Going to Dashboard..."
                      : "Done"}
                  </button>

                </div>

              </div>
            )}

          </div>

        </div>
      )}

    </div>
  );
}