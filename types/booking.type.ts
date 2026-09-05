type Booking = {
  _id: string;
  bookingRef: string;
  passengerName: string;
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
  activeBuses: number;
  passengerCount: number;
};

type Trip = {
  busNumber: string;
  route: string;
  departure: string;
  bookedSeats: number;
  capacity: number;
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