import PDFDocument from "pdfkit";
import QRCode from "qrcode";

const PAGE = {
  width: 841.89,
  height: 595.28,
};

const COLORS = {
  bg: "#020617",
  card: "#ffffff",
  text: "#0f172a",
  muted: "#64748b",
  border: "#dbe3ef",
  soft: "#f8fafc",
  red: "#dc2626",
  redDark: "#991b1b",
  green: "#047857",
  white: "#ffffff",
};

const formatDate = (dateValue) => {
  if (!dateValue) return "N/A";

  return new Date(dateValue).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const formatDateTime = (dateValue) => {
  if (!dateValue) return "N/A";

  return new Date(dateValue).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
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

const getMovieImageUrl = (ticket) => {
  return (
    ticket.movie?.mainImage?.url ||
    ticket.movie?.poster ||
    ticket.movie?.image ||
    ""
  );
};

const getPdfFriendlyImageUrl = (url) => {
  if (!url) return "";

  if (url.includes("res.cloudinary.com") && url.includes("/upload/")) {
    return url.replace(
      "/upload/",
      "/upload/f_jpg,q_auto,w_900,h_1300,c_fill/"
    );
  }

  return url;
};

const fetchImageBuffer = async (url) => {
  try {
    if (!url || typeof fetch === "undefined") return null;

    const response = await fetch(getPdfFriendlyImageUrl(url));

    if (!response.ok) return null;

    const arrayBuffer = await response.arrayBuffer();

    return Buffer.from(arrayBuffer);
  } catch {
    return null;
  }
};

const buildCompactQrPayload = (ticket) => {
  return JSON.stringify({
    system: "MOVIE_GATEWAY_TICKET",
    ticketNumber: ticket.ticketNumber,
    bookingReference: ticket.booking?.bookingReference || ticket.bookingReference,
    ticketStatus: ticket.ticketStatus,
    paymentStatus: ticket.paymentStatus,
  });
};

const drawRoundedBox = (doc, x, y, width, height, radius, fill, stroke) => {
  doc.roundedRect(x, y, width, height, radius);

  if (fill && stroke) {
    doc.fillAndStroke(fill, stroke);
  } else if (fill) {
    doc.fill(fill);
  } else if (stroke) {
    doc.stroke(stroke);
  }
};

const drawInfo = (doc, label, value, x, y, width, height = 52) => {
  drawRoundedBox(doc, x, y, width, height, 12, COLORS.soft, COLORS.border);

  doc
    .font("Helvetica-Bold")
    .fontSize(7)
    .fillColor(COLORS.muted)
    .text(String(label || "").toUpperCase(), x + 12, y + 10, {
      width: width - 24,
      characterSpacing: 0.6,
    });

  doc
    .font("Helvetica-Bold")
    .fontSize(10)
    .fillColor(COLORS.text)
    .text(value || "N/A", x + 12, y + 25, {
      width: width - 24,
      lineGap: 1,
    });
};

const drawPoster = (doc, imageBuffer, x, y, width, height, movieTitle) => {
  doc.save();

  drawRoundedBox(doc, x, y, width, height, 18, "#111827", null);

  doc.roundedRect(x, y, width, height, 18).clip();

  if (imageBuffer) {
    try {
      doc.image(imageBuffer, x, y, {
        cover: [width, height],
        align: "center",
        valign: "center",
      });
    } catch {
      doc.rect(x, y, width, height).fill("#111827");
    }
  } else {
    doc.rect(x, y, width, height).fill("#111827");
  }

  doc
    .rect(x, y + height - 100, width, 100)
    .fillOpacity(0.82)
    .fill("#020617")
    .fillOpacity(1);

  doc
    .font("Helvetica-Bold")
    .fontSize(20)
    .fillColor(COLORS.white)
    .text(movieTitle || "Movie Ticket", x + 16, y + height - 76, {
      width: width - 32,
      lineGap: 2,
    });

  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor("#cbd5e1")
    .text("Official cinema e-ticket", x + 16, y + height - 28, {
      width: width - 32,
    });

  doc.restore();
};

export const generateTicketPdfBuffer = async (ticket) => {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        layout: "landscape",
        margin: 0,
        info: {
          Title: `Ticket ${ticket.ticketNumber}`,
          Author: "Movie Gateway",
          Subject: "Cinema E-Ticket",
        },
      });

      const buffers = [];

      doc.on("data", buffers.push.bind(buffers));
      doc.on("end", () => {
        resolve(Buffer.concat(buffers));
      });

      const qrPayload = buildCompactQrPayload(ticket);

      const qrDataUrl = await QRCode.toDataURL(qrPayload, {
        errorCorrectionLevel: "H",
        margin: 2,
        width: 260,
        color: {
          dark: COLORS.text,
          light: COLORS.white,
        },
      });

      const qrBuffer = Buffer.from(qrDataUrl.split(",")[1], "base64");

      const movieImageBuffer = await fetchImageBuffer(getMovieImageUrl(ticket));

      doc.rect(0, 0, PAGE.width, PAGE.height).fill(COLORS.bg);

      doc.rect(0, 0, PAGE.width, 92).fill(COLORS.red);

      doc.circle(58, 46, 24).fill(COLORS.white);

      doc
        .font("Helvetica-Bold")
        .fontSize(20)
        .fillColor(COLORS.red)
        .text("M", 50, 34);

      doc
        .font("Helvetica-Bold")
        .fontSize(24)
        .fillColor(COLORS.white)
        .text("MOVIE GATEWAY", 96, 28);

      doc
        .font("Helvetica")
        .fontSize(9)
        .fillColor("#fee2e2")
        .text("Online Movie Ticket Booking & Real-Time Payment Processing", 98, 60);

      doc
        .roundedRect(PAGE.width - 160, 30, 108, 34, 17)
        .stroke("#fecaca");

      doc
        .font("Helvetica-Bold")
        .fontSize(10)
        .fillColor(COLORS.white)
        .text("E-TICKET", PAGE.width - 160, 42, {
          width: 108,
          align: "center",
        });

      const cardX = 36;
      const cardY = 116;
      const cardW = PAGE.width - 72;
      const cardH = 420;

      drawRoundedBox(doc, cardX, cardY, cardW, cardH, 24, COLORS.card, "#1f2937");

      const posterX = cardX + 24;
      const posterY = cardY + 28;
      const posterW = 220;
      const posterH = cardH - 56;

      drawPoster(
        doc,
        movieImageBuffer,
        posterX,
        posterY,
        posterW,
        posterH,
        ticket.movie?.title
      );

      const contentX = posterX + posterW + 28;
      const contentY = posterY + 6;
      const contentW = cardX + cardW - contentX - 28;

      doc
        .font("Helvetica")
        .fontSize(8)
        .fillColor(COLORS.muted)
        .text("Ticket Number", contentX, contentY);

      doc
        .font("Helvetica-Bold")
        .fontSize(22)
        .fillColor(COLORS.text)
        .text(ticket.ticketNumber, contentX, contentY + 14, {
          width: 350,
          lineGap: 1,
        });

      const statusText = String(ticket.ticketStatus || "active").toUpperCase();

      doc
        .roundedRect(contentX + contentW - 95, contentY + 5, 78, 28, 14)
        .fill(ticket.ticketStatus === "active" ? COLORS.green : COLORS.redDark);

      doc
        .font("Helvetica-Bold")
        .fontSize(8)
        .fillColor(COLORS.white)
        .text(statusText, contentX + contentW - 95, contentY + 15, {
          width: 78,
          align: "center",
        });

      const infoY = contentY + 70;
      const col1 = contentX;
      const col2 = contentX + 168;
      const boxW = 154;

      drawInfo(doc, "Customer", ticket.customer?.name || "N/A", col1, infoY, boxW);
      drawInfo(doc, "Hall", `${ticket.hall?.name || "N/A"} (${ticket.hall?.screenType || "N/A"})`, col2, infoY, boxW);

      drawInfo(doc, "Show Date", formatDate(ticket.showtime?.showDate), col1, infoY + 66, boxW);
      drawInfo(doc, "Showtime", `${ticket.showtime?.startTime || "N/A"} - ${ticket.showtime?.endTime || "N/A"}`, col2, infoY + 66, boxW);

      drawInfo(doc, "Seat(s)", getSeatCodes(ticket), col1, infoY + 132, boxW);
      drawInfo(doc, "Total Paid", formatCurrency(ticket.totalAmount), col2, infoY + 132, boxW);

      drawInfo(
        doc,
        "Booking Reference",
        ticket.booking?.bookingReference || ticket.bookingReference || "N/A",
        col1,
        infoY + 198,
        boxW * 2 + 14
      );

      const qrX = contentX + contentW - 170;
      const qrY = infoY + 58;

      drawRoundedBox(doc, qrX, qrY, 150, 150, 16, COLORS.white, COLORS.border);

      doc.image(qrBuffer, qrX + 13, qrY + 13, {
        fit: [124, 124],
      });

      doc
        .font("Helvetica-Bold")
        .fontSize(13)
        .fillColor(COLORS.text)
        .text("QR Verification", qrX - 2, qrY + 164, {
          width: 154,
          align: "center",
        });

      doc
        .font("Helvetica")
        .fontSize(8)
        .fillColor(COLORS.muted)
        .text(
          "Scan at entrance to verify ticket number, booking reference, payment, and seat allocation.",
          qrX - 10,
          qrY + 184,
          {
            width: 170,
            align: "center",
            lineGap: 2,
          }
        );

      doc
        .font("Helvetica-Bold")
        .fontSize(8)
        .fillColor(COLORS.text)
        .text("Issued At", qrX - 10, qrY + 238, {
          width: 170,
          align: "center",
        });

      doc
        .font("Helvetica")
        .fontSize(8)
        .fillColor(COLORS.muted)
        .text(formatDateTime(ticket.issuedAt || ticket.createdAt), qrX - 10, qrY + 252, {
          width: 170,
          align: "center",
        });

      const footerY = PAGE.height - 42;

      doc
        .moveTo(40, footerY)
        .lineTo(PAGE.width - 40, footerY)
        .dash(4, { space: 4 })
        .strokeColor("#334155")
        .stroke()
        .undash();

      doc
        .font("Helvetica")
        .fontSize(8)
        .fillColor("#cbd5e1")
        .text(
          "Please present this ticket at the cinema entrance. This ticket is valid only for the selected movie, hall, show date, showtime, and seat(s).",
          50,
          footerY + 14,
          {
            width: PAGE.width - 100,
            align: "center",
          }
        );

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};