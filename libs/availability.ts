export type SeatStatus =
  | "available"
  | "booked"
  | "selected";

export type Seat = {
   seatNumber: string;
   status: "available" | "pending" | "booked";
};

export type BusAvailability = {
  id: string;
  busNumber: string;
  company: string;
  route: string;
  pickup: string;
  dropoff: string;
  departure: string;
  driverPhone: string;
  arrival: string;
  duration: string;
  price: number;
  totalSeats: number;
  availableSeats: number;
  image: string;
  seats: Seat[];
};

const createSeats = (
  bookedSeats: string[]
): Seat[] => {
  const seats: Seat[] = [];

  for (let i = 1; i <= 40; i++) {
    seats.push({
      seatNumber: String(i),
      status: bookedSeats.includes(String(i))
        ? "booked"
        : "available",
    });
  }

  return seats;
};

export const availableBuses: BusAvailability[] = [
  {
    id: "bus-001",

    busNumber: "HT-101",
   driverPhone:'03015678719',
    company: "Haikal Tours",

    route: "Islamabad → Hunza",

    pickup: "Islamabad",

    dropoff: "Hunza",

    departure: "07:00 AM",

    arrival: "06:00 PM",

    duration: "11h",

    price: 4500,

    totalSeats: 40,

    availableSeats: 34,

    image: "/images/bus.jpg",

    seats: createSeats([
      "2",
      "5",
      "8",
      "11",
      "14",
      "17",
    ]),
  },

  {
    id: "bus-002",

    busNumber: "HT-205",

    company: "Haikal Tours",

    route: "Islamabad → Gilgit",

    pickup: "Islamabad",

    dropoff: "Gilgit",

    departure: "08:30 AM",

    arrival: "08:30 PM",

    duration: "12h",

    price: 5000,

    totalSeats: 40,

    availableSeats: 31,
    driverPhone:'03015678719',

    image: "/images/bus.jpg",

    seats: createSeats([
      "1",
      "3",
      "4",
      "7",
      "9",
      "12",
      "18",
      "20",
      "22",
    ]),
  },

  {
    id: "bus-003",

    busNumber: "HT-310",

    company: "Haikal Tours",

    route: "Lahore → Islamabad",

    pickup: "Lahore",
    driverPhone:'03015678719',

    dropoff: "Islamabad",

    departure: "06:00 AM",

    arrival: "12:00 PM",

    duration: "6h",

    price: 2800,

    totalSeats: 40,

    availableSeats: 37,

    image: "/images/bus.jpg",

    seats: createSeats([
      "6",
      "16",
      "27",
    ]),
  },
];