import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import QRCode from "qrcode";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Copy,
  CreditCard,
  Download,
  Film,
  Mail,
  MapPin,
  QrCode,
  Ticket,
  User,
} from "lucide-react";

import api from "../../api/axios";
import Loading from "../../components/ui/Loading";
import { getErrorMessage, money, showTimeLabel } from "../../utils/formatters";

const getMovieImage = (movie) => {
  return (
    movie?.mainImage?.url ||
    movie?.poster?.url ||
    movie?.image?.url ||
    movie?.poster ||
    movie?.image ||
    ""
  );
};

const getSeatCodes = (ticket) => {
  return ticket?.seats?.map((seat) => seat.seatCode).join(", ") || "-";
};

const getBookingReference = (ticket) => {
  return ticket?.booking?.bookingReference || ticket?.bookingReference || "-";
};

const buildQrPayload = (ticket) => {
  if (!ticket) return "";

  return JSON.stringify({
    system: "MOVIE_GATEWAY_TICKET",
    ticketNumber: ticket.ticketNumber,
    bookingReference: getBookingReference(ticket),
    movie: ticket.movie?.title || "N/A",
    customer: ticket.customer?.name || "N/A",
    hall: ticket.hall?.name || "N/A",
    showtime: ticket.showtime
      ? `${new Date(ticket.showtime.showDate).toLocaleDateString()} ${
          ticket.showtime.startTime
        } - ${ticket.showtime.endTime}`
      : "N/A",
    seats: getSeatCodes(ticket),
    paymentStatus: ticket.paymentStatus,
    ticketStatus: ticket.ticketStatus,
  });
};

const TicketDetailPage = ({ byBooking = false }) => {
  const { id, bookingId } = useParams();

  const [ticket, setTicket] = useState(null);
  const [qrImage, setQrImage] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const movieImage = getMovieImage(ticket?.movie);
  const qrPayload = useMemo(() => buildQrPayload(ticket), [ticket]);

  const loadTicket = async () => {
    setLoading(true);
    setError("");

    try {
      const { data } = await api.get(
        byBooking ? `/tickets/booking/${bookingId}` : `/tickets/${id}`
      );

      setTicket(data.ticket);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load ticket"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTicket();
  }, [id, bookingId]);

  useEffect(() => {
    const generateQrImage = async () => {
      if (!qrPayload) return;

      try {
        const qrDataUrl = await QRCode.toDataURL(qrPayload, {
          width: 360,
          margin: 2,
          errorCorrectionLevel: "H",
          color: {
            dark: "#020617",
            light: "#ffffff",
          },
        });

        setQrImage(qrDataUrl);
      } catch {
        setQrImage("");
      }
    };

    generateQrImage();
  }, [qrPayload]);

  const downloadTicket = async () => {
    if (!ticket?._id) return;

    setActionLoading("download");

    try {
      const response = await api.get(`/tickets/${ticket._id}/download`, {
        responseType: "blob",
      });

      const url = URL.createObjectURL(
        new Blob([response.data], {
          type: "application/pdf",
        })
      );

      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `ticket-${ticket.ticketNumber}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();

      URL.revokeObjectURL(url);
      toast.success("Ticket PDF downloaded");
    } catch (err) {
      toast.error(getErrorMessage(err, "Download failed"));
    } finally {
      setActionLoading("");
    }
  };

  const emailTicket = async () => {
    if (!ticket?._id) return;

    setActionLoading("email");

    try {
      const { data } = await api.post(`/tickets/${ticket._id}/email`);
      toast.success(data.message || "Ticket emailed successfully");
    } catch (err) {
      toast.error(getErrorMessage(err, "Email failed"));
    } finally {
      setActionLoading("");
    }
  };

  const copyVerificationData = async () => {
    try {
      await navigator.clipboard.writeText(qrPayload);
      setCopied(true);
      toast.success("Verification data copied");

      setTimeout(() => {
        setCopied(false);
      }, 1500);
    } catch {
      toast.error("Failed to copy verification data");
    }
  };

  if (loading) {
    return <Loading label="Loading ticket details..." />;
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-red-500/30 bg-red-500/10 p-6 text-red-200">
        <h2 className="text-xl font-bold">Ticket not available</h2>
        <p className="mt-2 text-sm">{error}</p>

        <Link
          to="/customer/tickets"
          className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-red-600 px-5 py-3 text-sm font-semibold text-white hover:bg-red-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to tickets
        </Link>
      </div>
    );
  }

  if (!ticket) return null;

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.35em] text-red-300">
            Movie Gateway E-Ticket
          </p>

          <h1 className="mt-3 text-4xl font-black leading-tight text-white md:text-5xl">
            Ticket Details
          </h1>

          <p className="mt-3 max-w-2xl text-base text-slate-400">
            Your official digital cinema ticket with secure QR verification.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={downloadTicket}
            disabled={actionLoading === "download"}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-red-600 px-6 py-3 text-sm font-black text-white shadow-lg shadow-red-950/30 transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Download className="h-5 w-5" />
            {actionLoading === "download" ? "Downloading..." : "Download PDF"}
          </button>

          <button
            onClick={emailTicket}
            disabled={actionLoading === "email"}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-3 text-sm font-black text-white transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Mail className="h-5 w-5" />
            {actionLoading === "email" ? "Sending..." : "Email"}
          </button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.75fr]">
        <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-slate-900/70 shadow-2xl">
          <div className="grid lg:grid-cols-[340px_1fr]">
            <div className="relative min-h-[540px] overflow-hidden bg-slate-950">
              {movieImage ? (
                <img
                  src={movieImage}
                  alt={ticket.movie?.title || "Movie"}
                  className="h-full min-h-[540px] w-full object-cover"
                />
              ) : (
                <div className="flex h-full min-h-[540px] items-center justify-center bg-gradient-to-br from-red-950 via-slate-950 to-black">
                  <Film className="h-24 w-24 text-white/20" />
                </div>
              )}

              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/45 to-transparent" />

              <div className="absolute left-5 top-5">
                <StatusPill status={ticket.ticketStatus} />
              </div>

              <div className="absolute bottom-0 left-0 right-0 p-6">
                <p className="text-xs font-black uppercase tracking-[0.35em] text-red-200">
                  Now Showing
                </p>

                <h2 className="mt-2 text-3xl font-black leading-tight text-white">
                  {ticket.movie?.title || "Movie Ticket"}
                </h2>

                <p className="mt-2 text-sm text-slate-300">
                  {ticket.movie?.genre || "Cinema"} ·{" "}
                  {ticket.movie?.language || "Language"}
                </p>
              </div>
            </div>

            <div className="p-6 md:p-8">
              <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-5">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-sm text-slate-400">Ticket Number</p>

                    <h2 className="mt-2 max-w-xl break-words text-3xl font-black leading-tight text-white">
                      {ticket.ticketNumber}
                    </h2>
                  </div>

                  <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-right">
                    <p className="text-xs uppercase tracking-wide text-red-200">
                      Seat
                    </p>
                    <p className="text-2xl font-black text-white">
                      {getSeatCodes(ticket)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <InfoCard
                  icon={<User className="h-5 w-5" />}
                  label="Customer"
                  value={ticket.customer?.name}
                  subValue={ticket.customer?.email}
                />

                <InfoCard
                  icon={<CalendarDays className="h-5 w-5" />}
                  label="Showtime"
                  value={showTimeLabel(ticket.showtime)}
                />

                <InfoCard
                  icon={<MapPin className="h-5 w-5" />}
                  label="Hall"
                  value={ticket.hall?.name}
                  subValue={ticket.hall?.screenType}
                />

                <InfoCard
                  icon={<CreditCard className="h-5 w-5" />}
                  label="Total Paid"
                  value={money(ticket.totalAmount)}
                  subValue={`Payment: ${ticket.paymentStatus}`}
                />
              </div>

              <div className="mt-5 rounded-3xl border border-white/10 bg-slate-950/70 p-5">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  Booking Reference
                </p>

                <p className="mt-2 break-words text-lg font-black text-white">
                  {getBookingReference(ticket)}
                </p>
              </div>

              <div className="mt-5 rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-5">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-300" />

                  <div>
                    <h3 className="font-bold text-emerald-100">
                      Valid paid ticket
                    </h3>

                    <p className="mt-1 text-sm leading-relaxed text-emerald-100/70">
                      Present the QR code at the cinema entrance. Staff can
                      verify the ticket number, payment status, booking
                      reference, showtime, and seat allocation.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <aside className="space-y-6">
          <div className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-2xl font-black text-white">
                  QR Verification
                </h3>

                <p className="mt-1 text-sm text-slate-400">
                  Scan this QR code at the entrance.
                </p>
              </div>

              <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-3 text-red-300">
                <QrCode className="h-6 w-6" />
              </div>
            </div>

            <div className="rounded-[1.75rem] bg-white p-5 shadow-xl">
              {qrImage ? (
                <img
                  src={qrImage}
                  alt="Ticket QR Code"
                  className="mx-auto h-72 w-72 object-contain"
                />
              ) : (
                <div className="flex h-72 items-center justify-center text-slate-600">
                  QR unavailable
                </div>
              )}
            </div>

            <button
              onClick={copyVerificationData}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-bold text-white transition hover:bg-white/[0.08]"
            >
              {copied ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-300" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              {copied ? "Copied" : "Copy Verification Data"}
            </button>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-6">
            <h3 className="text-xl font-black text-white">
              Verification Summary
            </h3>

            <p className="mt-1 text-sm text-slate-400">
              Clean ticket details encoded in the QR.
            </p>

            <div className="mt-5 space-y-3">
              <SummaryRow label="Ticket" value={ticket.ticketNumber} />
              <SummaryRow label="Booking" value={getBookingReference(ticket)} />
              <SummaryRow label="Movie" value={ticket.movie?.title} />
              <SummaryRow label="Customer" value={ticket.customer?.name} />
              <SummaryRow label="Seat" value={getSeatCodes(ticket)} />
              <SummaryRow label="Payment" value={ticket.paymentStatus} />
              <SummaryRow label="Status" value={ticket.ticketStatus} />
            </div>
          </div>

          <Link
            to="/customer/tickets"
            className="inline-flex items-center gap-2 text-sm font-semibold text-red-300 hover:text-red-200"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to my tickets
          </Link>
        </aside>
      </div>
    </div>
  );
};

const StatusPill = ({ status }) => {
  const normalizedStatus = String(status || "active").toLowerCase();

  const styles = {
    active:
      "border-emerald-400/30 bg-emerald-400/10 text-emerald-200 shadow-emerald-950/30",
    used: "border-blue-400/30 bg-blue-400/10 text-blue-200 shadow-blue-950/30",
    cancelled:
      "border-red-400/30 bg-red-400/10 text-red-200 shadow-red-950/30",
    expired:
      "border-yellow-400/30 bg-yellow-400/10 text-yellow-200 shadow-yellow-950/30",
  };

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-black uppercase tracking-wide shadow-lg backdrop-blur ${
        styles[normalizedStatus] || styles.active
      }`}
    >
      <span className="h-2 w-2 rounded-full bg-current" />
      {normalizedStatus}
    </span>
  );
};

const InfoCard = ({ icon, label, value, subValue }) => {
  return (
    <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-5 transition hover:border-red-500/25">
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10 text-red-300">
        {icon}
      </div>

      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
        {label}
      </p>

      <p className="mt-1 break-words text-base font-black text-white">
        {value || "-"}
      </p>

      {subValue && (
        <p className="mt-1 break-words text-sm text-slate-400">{subValue}</p>
      )}
    </div>
  );
};

const SummaryRow = ({ label, value }) => {
  return (
    <div className="flex items-start justify-between gap-4 rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3">
      <span className="text-sm text-slate-400">{label}</span>

      <span className="max-w-[65%] break-words text-right text-sm font-bold text-white">
        {value || "-"}
      </span>
    </div>
  );
};

export default TicketDetailPage;