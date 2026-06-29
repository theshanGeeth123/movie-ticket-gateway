import PDFDocument from "pdfkit";
import QRCode from "qrcode";

const formatDate = (dateValue) => {
  if (!dateValue) return "N/A";

  return new Date(dateValue).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const formatCurrency = (amount) => {
  return `USD ${Number(amount || 0).toFixed(2)}`;
};

export const generateTicketPdfBuffer = async (ticket) => {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        margin: 50,
      });

      const buffers = [];

      doc.on("data", buffers.push.bind(buffers));
      doc.on("end", () => {
        const pdfBuffer = Buffer.concat(buffers);
        resolve(pdfBuffer);
      });

      const qrCodeDataUrl = await QRCode.toDataURL(ticket.qrCodeData);
      const qrCodeBase64 = qrCodeDataUrl.split(",")[1];
      const qrCodeBuffer = Buffer.from(qrCodeBase64, "base64");

      doc
        .fontSize(22)
        .font("Helvetica-Bold")
        .text("Online Movie Ticket", { align: "center" });

      doc.moveDown();

      doc
        .fontSize(12)
        .font("Helvetica")
        .text("Movie Ticket Booking and Real-Time Payment Processing Gateway", {
          align: "center",
        });

      doc.moveDown(2);

      doc
        .fontSize(14)
        .font("Helvetica-Bold")
        .text("Ticket Details");

      doc.moveDown(0.5);

      doc.fontSize(11).font("Helvetica");

      doc.text(`Ticket Number: ${ticket.ticketNumber}`);
      doc.text(`Booking Reference: ${ticket.bookingReference}`);
      doc.text(`Ticket Status: ${ticket.ticketStatus}`);
      doc.text(`Payment Status: ${ticket.paymentStatus}`);

      doc.moveDown();

      doc
        .fontSize(14)
        .font("Helvetica-Bold")
        .text("Customer Details");

      doc.moveDown(0.5);

      doc.fontSize(11).font("Helvetica");

      doc.text(`Name: ${ticket.customer?.name || "N/A"}`);
      doc.text(`Email: ${ticket.customer?.email || "N/A"}`);

      doc.moveDown();

      doc
        .fontSize(14)
        .font("Helvetica-Bold")
        .text("Movie Details");

      doc.moveDown(0.5);

      doc.fontSize(11).font("Helvetica");

      doc.text(`Movie: ${ticket.movie?.title || "N/A"}`);
      doc.text(`Genre: ${ticket.movie?.genre || "N/A"}`);
      doc.text(`Language: ${ticket.movie?.language || "N/A"}`);
      doc.text(`Hall: ${ticket.hall?.name || "N/A"}`);
      doc.text(`Screen Type: ${ticket.hall?.screenType || "N/A"}`);
      doc.text(`Show Date: ${formatDate(ticket.showtime?.showDate)}`);
      doc.text(`Start Time: ${ticket.showtime?.startTime || "N/A"}`);
      doc.text(`End Time: ${ticket.showtime?.endTime || "N/A"}`);

      doc.moveDown();

      doc
        .fontSize(14)
        .font("Helvetica-Bold")
        .text("Seat Details");

      doc.moveDown(0.5);

      const seatCodes = ticket.seats.map((seat) => seat.seatCode).join(", ");

      doc.fontSize(11).font("Helvetica");
      doc.text(`Seats: ${seatCodes}`);
      doc.text(`Ticket Count: ${ticket.ticketCount}`);
      doc.text(`Total Amount: ${formatCurrency(ticket.totalAmount)}`);

      doc.moveDown(2);

      doc
        .fontSize(14)
        .font("Helvetica-Bold")
        .text("QR Code");

      doc.moveDown(0.5);

      doc.image(qrCodeBuffer, {
        fit: [140, 140],
        align: "left",
      });

      doc.moveDown();

      doc
        .fontSize(9)
        .font("Helvetica")
        .text(
          "Please present this ticket at the cinema entrance. Staff will verify the QR code or ticket number before entry.",
          {
            align: "left",
          }
        );

      doc.moveDown();

      doc
        .fontSize(9)
        .font("Helvetica-Bold")
        .text("Important:", { continued: true })
        .font("Helvetica")
        .text(" This ticket is valid only for the selected movie, hall, date, time, and seats.");

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};