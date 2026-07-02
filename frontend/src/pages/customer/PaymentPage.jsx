import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import {
  CreditCard,
  Loader2,
  ShieldCheck,
  ArrowLeft,
  Lock,
} from "lucide-react";

import api from "../../api/axios";
import Loading from "../../components/ui/Loading";
import StatusBadge from "../../components/ui/StatusBadge";
import {
  getErrorMessage,
  money,
  showTimeLabel,
} from "../../utils/formatters";

const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
const stripePromise = stripePublishableKey
  ? loadStripe(stripePublishableKey)
  : null;

const StripePaymentForm = ({ booking, payment }) => {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const { bookingId } = useParams();

  const [busy, setBusy] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      toast.error("Stripe payment form is still loading");
      return;
    }

    setBusy(true);

    try {
      const result = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment/${bookingId}`,
        },
        redirect: "if_required",
      });

      if (result.error) {
        toast.error(result.error.message || "Payment failed");
        return;
      }

      const paymentIntent = result.paymentIntent;

      if (!paymentIntent || paymentIntent.status !== "succeeded") {
        toast.error(
          `Payment not completed. Current status: ${paymentIntent?.status || "unknown"
          }`
        );
        return;
      }

      const { data } = await api.post("/payments/confirm-stripe-payment", {
        bookingId,
        paymentIntentId: paymentIntent.id,
      });

      toast.success(data?.message || "Payment successful");

      if (data?.ticket?._id) {
        navigate(`/tickets/${data.ticket._id}`, { replace: true });
      } else {
        navigate("/customer/tickets", { replace: true });
      }
    } catch (error) {
      toast.error(getErrorMessage(error, "Payment confirmation failed"));
    } finally {
      setBusy(false);
    }
  };

  const handleCancelPayment = async () => {
    if (!window.confirm("Cancel this payment and release selected seats?")) {
      return;
    }

    setBusy(true);

    try {
      await api.post("/payments/fail-stripe-payment", {
        bookingId,
      });

      toast.success("Payment cancelled and seats released");
      navigate("/customer/bookings", { replace: true });
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to cancel payment"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-5">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-200">
              Secure card payment
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Enter card details below. Your payment is securely processed.
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-emerald-300">
            <ShieldCheck className="h-5 w-5" />
          </div>
        </div>

        <PaymentElement
          options={{
            layout: "tabs",
            fields: {
              billingDetails: "auto",
            },
          }}
        />
      </div>

      <button
        type="submit"
        disabled={!stripe || !elements || busy}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 py-4 text-base font-black text-white shadow-lg shadow-red-950/30 transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {busy ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <CreditCard className="h-5 w-5" />
        )}
        {busy
          ? "Processing payment..."
          : `Pay securely ${money(
            booking?.totalAmount,
            payment?.currency?.toUpperCase() || "LKR"
          )}`}
      </button>

      <button
        type="button"
        onClick={handleCancelPayment}
        disabled={busy}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-3 text-sm font-semibold text-slate-300 transition hover:bg-white/[0.06] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        Cancel payment and release seats
      </button>

      <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 p-4 text-xs leading-relaxed text-blue-100">
        <p className="font-semibold">Stripe test card</p>
        <p className="mt-1">
          Card: <b>4242 4242 4242 4242</b> · Expiry: any future date · CVC:
          any 3 digits
        </p>
        <p className="mt-1 text-blue-200/70">
          PaymentIntent: {payment?.paymentIntentId}
        </p>
      </div>
    </form>
  );
};

const PaymentPage = () => {
  const { bookingId } = useParams();

  const [booking, setBooking] = useState(null);
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadPayment = async () => {
    setLoading(true);
    setError("");

    try {
      const [{ data: bookingData }, { data: paymentData }] = await Promise.all([
        api.get(`/bookings/${bookingId}`),
        api.post("/payments/create-payment-intent", {
          bookingId,
        }),
      ]);

      setBooking(bookingData.booking);
      setPayment(paymentData.payment);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to prepare Stripe payment"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayment();
  }, [bookingId]);

  const stripeOptions = useMemo(() => {
    if (!payment?.clientSecret) return null;

    return {
      clientSecret: payment.clientSecret,
      appearance: {
        theme: "night",
        variables: {
          colorPrimary: "#ef4444",
          colorBackground: "#020617",
          colorText: "#ffffff",
          colorDanger: "#fb7185",
          borderRadius: "14px",
          fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
        },
      },
    };
  }, [payment?.clientSecret]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950">
        <Loading label="Preparing secure Stripe payment..." />
      </div>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-slate-950 p-8 text-white">
        <div className="mx-auto max-w-xl rounded-3xl border border-red-500/30 bg-red-500/10 p-6 text-red-200">
          <h1 className="text-xl font-bold">Payment preparation failed</h1>
          <p className="mt-2 text-sm">{error}</p>

          <Link
            to="/customer/bookings"
            className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-red-600 px-5 py-3 text-sm font-semibold text-white hover:bg-red-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to bookings
          </Link>
        </div>
      </main>
    );
  }

  if (!stripePublishableKey || !stripePromise) {
    return (
      <main className="min-h-screen bg-slate-950 p-8 text-white">
        <div className="mx-auto max-w-xl rounded-3xl border border-yellow-500/30 bg-yellow-500/10 p-6 text-yellow-100">
          Missing Stripe publishable key. Add{" "}
          <b>VITE_STRIPE_PUBLISHABLE_KEY</b> to your frontend{" "}
          <b>.env</b> file and restart Vite.
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#1e1b4b_0,#020617_45%,#020617_100%)] px-4 py-10 text-white">
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl backdrop-blur">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-red-300">
            Movie Gateway
          </p>

          <h1 className="mt-3 text-3xl font-black md:text-4xl">
            Complete your payment
          </h1>

          <p className="mt-2 text-slate-400">
            Pay securely using Stripe and receive your ticket instantly after
            successful payment.
          </p>

          <div className="mt-6 space-y-3 rounded-3xl border border-white/10 bg-slate-950/70 p-5">
            <div className="flex justify-between gap-4">
              <span className="text-slate-400">Reference</span>
              <b className="text-right">{booking?.bookingReference}</b>
            </div>

            <div className="flex justify-between gap-4">
              <span className="text-slate-400">Movie</span>
              <b className="text-right">{booking?.movie?.title}</b>
            </div>

            <div className="flex justify-between gap-4">
              <span className="text-slate-400">Showtime</span>
              <b className="text-right">{showTimeLabel(booking?.showtime)}</b>
            </div>

            <div className="flex justify-between gap-4">
              <span className="text-slate-400">Seats</span>
              <b className="text-right">
                {booking?.seats?.map((seat) => seat.seatCode).join(", ")}
              </b>
            </div>

            <div className="flex justify-between gap-4">
              <span className="text-slate-400">Status</span>
              <StatusBadge value={booking?.bookingStatus} />
            </div>

            <div className="flex justify-between border-t border-white/10 pt-4 text-xl">
              <span>Total</span>
              <b className="text-red-200">
                {money(booking?.totalAmount, payment?.currency?.toUpperCase() || "LKR")}
              </b>
            </div>
          </div>

          <div className="mt-5 grid gap-3 text-sm text-slate-400 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <Lock className="mb-2 h-5 w-5 text-emerald-300" />
              Encrypted card entry
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <ShieldCheck className="mb-2 h-5 w-5 text-blue-300" />
              Stripe secure processing
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <CreditCard className="mb-2 h-5 w-5 text-red-300" />
              Instant ticket generation
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.06] p-6 shadow-2xl backdrop-blur">
          {stripeOptions && (
            <Elements
              key={payment?.clientSecret}
              stripe={stripePromise}
              options={stripeOptions}
            >
              <StripePaymentForm booking={booking} payment={payment} />
            </Elements>
          )}

          <Link
            to="/customer/bookings"
            className="mt-5 block text-center text-sm text-slate-400 hover:text-white"
          >
            Back to bookings
          </Link>
        </section>
      </div>
    </main>
  );
};

export default PaymentPage;