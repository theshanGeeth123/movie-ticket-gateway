import nodemailer from "nodemailer";
import Ticket from "../models/Ticket.js";
import { generateTicketPdfBuffer } from "./ticketPdfService.js";

const createTransporter = () => {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

const formatDate = (dateValue) => {
  if (!dateValue) return "N/A";

  return new Date(dateValue).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

export const sendTicketEmail = async (ticketId) => {
  const ticket = await Ticket.findById(ticketId)
    .populate("customer", "name email role")
    .populate("movie", "title poster genre language")
    .populate("hall", "name screenType")
    .populate("showtime", "showDate startTime endTime finalTicketPrice")
    .populate("booking", "bookingReference bookingStatus paymentStatus");

  if (!ticket) {
    throw new Error("Ticket not found while sending email");
  }

  if (!ticket.customer?.email) {
    throw new Error("Customer email not found");
  }

  if (ticket.ticketStatus === "cancelled") {
    throw new Error("Cancelled ticket cannot be emailed");
  }

  const pdfBuffer = await generateTicketPdfBuffer(ticket);

  const transporter = createTransporter();

  const seatCodes = ticket.seats.map((seat) => seat.seatCode).join(", ");

  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to: ticket.customer.email,
    subject: `Your Movie Ticket - ${ticket.movie?.title || "Movie Booking"}`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #222;">
        <h2>Your Movie Ticket is Confirmed</h2>

        <p>Hello ${ticket.customer?.name || "Customer"},</p>

        <p>Your movie ticket has been successfully confirmed. Please find your ticket PDF attached to this email.</p>

        <h3>Ticket Details</h3>

        <p><strong>Ticket Number:</strong> ${ticket.ticketNumber}</p>
        <p><strong>Booking Reference:</strong> ${ticket.bookingReference}</p>
        <p><strong>Movie:</strong> ${ticket.movie?.title || "N/A"}</p>
        <p><strong>Hall:</strong> ${ticket.hall?.name || "N/A"} - ${ticket.hall?.screenType || "N/A"}</p>
        <p><strong>Date:</strong> ${formatDate(ticket.showtime?.showDate)}</p>
        <p><strong>Time:</strong> ${ticket.showtime?.startTime || "N/A"} - ${ticket.showtime?.endTime || "N/A"}</p>
        <p><strong>Seats:</strong> ${seatCodes}</p>
        <p><strong>Total Amount:</strong> USD ${Number(ticket.totalAmount || 0).toFixed(2)}</p>

        <p>Please present the attached ticket PDF at the cinema entrance.</p>

        <p>Thank you,<br/>Online Movie Ticket Booking Team</p>
      </div>
    `,
    attachments: [
      {
        filename: `ticket-${ticket.ticketNumber}.pdf`,
        content: pdfBuffer,
        contentType: "application/pdf",
      },
    ],
  };

  const info = await transporter.sendMail(mailOptions);

  return {
    messageId: info.messageId,
    accepted: info.accepted,
    rejected: info.rejected,
  };
};