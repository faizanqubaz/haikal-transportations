type Booking = {
  _id: string;
  bookingRef: string;
  passengerName: string;
  gender:string;
  passengerPhone: string;
  route: string;
  bus?: {
    busNumber: string;
  } | null;
  seat?: string;
  travelTime?: string;
  status: "pending" | "approved" | "rejected";
  emailSent: boolean;
  whatsappSent: boolean;
};

type Stats = {
  totalBookings: number;
  todaysBookings: number;
  bookedSeats:number;
  activeBuses: number;
  passengerCount: number;
  todaysBookedSeats:number;
  totalBuses:number;
};

type Trip = {
  busId: string;

  busNumber: string;
  company: string;

  route: string;
  pickup: string;
  dropoff: string;

  date: string;
  departure: string;
  arrival: string;
  duration: string;

  price: number;

  capacity: number;
  availableSeats: number;
  bookedSeats: number;

  totalBookings: number;
  pendingSeats: number;
  confirmedSeats: number;

  hasBookings: boolean;
};

type NotificationBooking = {
  _id: string;
  bookingRef: string;
  passengerName: string;
  passengerEmail?: string;
  passengerPhone: string;
  route: string;

  bus?: {
    busNumber?: string;
  } | null;

  seats?: string[];
  travelDate?: string;
  travelTime?: string;

  status: "pending" | "approved" | "rejected";
};

type AdminNotification = {
  _id: string;
  type: "booking";
  title: string;
  message: string;

  bookingId: NotificationBooking | null;

  read: boolean;
  createdAt: string;
};