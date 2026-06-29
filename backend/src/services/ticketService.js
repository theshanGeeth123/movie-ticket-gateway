import Ticket from "../models/Ticket.js";
import Booking from "../models/Booking.js";

const generateTicketNumber = () => {
  const timestamp = Date.now();
  const randomNumber = Math.floor(1000 + Math.random() * 9000);

  return `TKT-${timestamp}-${randomNumber}`;
};

const generateUniqueTicketNumber = async () => {
  let ticketNumber;
  let existingTicket;

  do {
    ticketNumber = generateTicketNumber();
    existingTicket = await Ticket.findOne({ ticketNumber });
  } while (existingTicket);

  return ticketNumber;
};

const buildQrCodeData = ({ ticketNumber, booking }) => {
  return JSON.stringify({
    ticketNumber,
    bookingId: booking._id.toString(),
    bookingReference: booking.bookingReference,
    customerId: booking.customer.toString(),
    showtimeId: booking.showtime.toString(),
  });
};

export const createTicketForBooking = async (bookingId) => {
  const existingTicket = await Ticket.findOne({ booking: bookingId });

  if (existingTicket) {
    return existingTicket;
  }

  const booking = await Booking.findById(bookingId);

  if (!booking) {
    throw new Error("Booking not found while creating ticket");
  }

  if (booking.bookingStatus !== "confirmed") {
    throw new Error("Ticket can only be created for confirmed bookings");
  }

  if (booking.paymentStatus !== "paid") {
    throw new Error("Ticket can only be created for paid bookings");
  }

  const ticketNumber = await generateUniqueTicketNumber();

  const qrCodeData = buildQrCodeData({
    ticketNumber,
    booking,
  });

  const ticket = await Ticket.create({
    ticketNumber,
    booking: booking._id,
    bookingReference: booking.bookingReference,
    customer: booking.customer,
    movie: booking.movie,
    hall: booking.hall,
    showtime: booking.showtime,
    seats: booking.seats,
    ticketCount: booking.ticketCount,
    totalAmount: booking.totalAmount,
    paymentProvider: booking.paymentProvider,
    paymentStatus: "paid",
    ticketStatus: "active",
    qrCodeData,
    issuedAt: new Date(),
  });

  return ticket;
};