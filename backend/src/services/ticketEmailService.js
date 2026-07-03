import nodemailer from "nodemailer";
import Ticket from "../models/Ticket.js";
import { generateTicketPdfBuffer } from "./ticketPdfService.js";

const createTransporter = () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error(
      "Email configuration missing. Please add EMAIL_USER and EMAIL_PASS to backend .env"
    );
  }

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

const formatCurrency = (amount) => {
  return `LKR ${Number(amount || 0).toLocaleString(undefined, {
    maximumFractionDigits: 2,
  })}`;
};

const getSeatCodes = (ticket) => {
  return ticket.seats?.map((seat) => seat.seatCode).join(", ") || "N/A";
};

export const sendTicketEmail = async (ticketId) => {
  const ticket = await Ticket.findById(ticketId)
    .populate("customer", "name email role")
    .populate("movie", "title mainImage galleryImages genre language")
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

  const transporter = createTransporter();

  await transporter.verify();

  const pdfBuffer = await generateTicketPdfBuffer(ticket);

  const seatCodes = getSeatCodes(ticket);

  const fromAddress =
    process.env.EMAIL_FROM ||
    `"Movie Gateway" <${process.env.EMAIL_USER}>`;

  const mailOptions = {
    from: fromAddress,
    to: ticket.customer.email,
    subject: `Your Movie Ticket - ${ticket.movie?.title || "Movie Gateway"}`,
    html: `
      <div style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
        <div style="max-width:680px;margin:0 auto;padding:28px;">
          <div style="background:#dc2626;border-radius:22px 22px 0 0;padding:28px;color:white;">
            <h1 style="margin:0;font-size:28px;letter-spacing:.5px;">Movie Gateway</h1>
            <p style="margin:8px 0 0;color:#fee2e2;">Your movie ticket is confirmed</p>
          </div>

          <div style="background:white;border-radius:0 0 22px 22px;padding:30px;border:1px solid #e2e8f0;">
            <p style="font-size:16px;margin-top:0;">Hello <strong>${ticket.customer?.name || "Customer"}</strong>,</p>

            <p style="font-size:15px;line-height:1.7;color:#475569;">
              Your payment was successful and your cinema ticket has been generated.
              Please find your ticket PDF attached to this email.
            </p>

            <div style="margin:24px 0;padding:20px;border-radius:18px;background:#f8fafc;border:1px solid #e2e8f0;">
              <h2 style="margin:0 0 16px;font-size:20px;">Ticket Summary</h2>

              <table style="width:100%;border-collapse:collapse;font-size:14px;">
                <tr>
                  <td style="padding:8px 0;color:#64748b;">Ticket Number</td>
                  <td style="padding:8px 0;text-align:right;font-weight:bold;">${ticket.ticketNumber}</td>
                </tr>
                <tr>
                  <td style="padding:8px 0;color:#64748b;">Booking Reference</td>
                  <td style="padding:8px 0;text-align:right;font-weight:bold;">${ticket.booking?.bookingReference || ticket.bookingReference || "N/A"}</td>
                </tr>
                <tr>
                  <td style="padding:8px 0;color:#64748b;">Movie</td>
                  <td style="padding:8px 0;text-align:right;font-weight:bold;">${ticket.movie?.title || "N/A"}</td>
                </tr>
                <tr>
                  <td style="padding:8px 0;color:#64748b;">Hall</td>
                  <td style="padding:8px 0;text-align:right;font-weight:bold;">${ticket.hall?.name || "N/A"} ${ticket.hall?.screenType ? `(${ticket.hall.screenType})` : ""}</td>
                </tr>
                <tr>
                  <td style="padding:8px 0;color:#64748b;">Date</td>
                  <td style="padding:8px 0;text-align:right;font-weight:bold;">${formatDate(ticket.showtime?.showDate)}</td>
                </tr>
                <tr>
                  <td style="padding:8px 0;color:#64748b;">Time</td>
                  <td style="padding:8px 0;text-align:right;font-weight:bold;">${ticket.showtime?.startTime || "N/A"} - ${ticket.showtime?.endTime || "N/A"}</td>
                </tr>
                <tr>
                  <td style="padding:8px 0;color:#64748b;">Seats</td>
                  <td style="padding:8px 0;text-align:right;font-weight:bold;">${seatCodes}</td>
                </tr>
                <tr>
                  <td style="padding:8px 0;color:#64748b;">Total Paid</td>
                  <td style="padding:8px 0;text-align:right;font-weight:bold;color:#dc2626;">${formatCurrency(ticket.totalAmount)}</td>
                </tr>
              </table>
            </div>

            <p style="font-size:14px;line-height:1.7;color:#475569;">
              Please present the attached PDF ticket or QR code at the cinema entrance.
            </p>

            <p style="margin-top:26px;font-size:14px;color:#64748b;">
              Thank you,<br/>
              <strong>Movie Gateway Team</strong>
            </p>
          </div>
        </div>
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

  console.log("Ticket email sent:", {
    messageId: info.messageId,
    to: ticket.customer.email,
    accepted: info.accepted,
    rejected: info.rejected,
  });

  return {
    messageId: info.messageId,
    accepted: info.accepted,
    rejected: info.rejected,
    sentTo: ticket.customer.email,
  };
};