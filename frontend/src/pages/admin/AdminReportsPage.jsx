import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  BarChart3,
  CalendarDays,
  FilterX,
  Film,
  RefreshCcw,
  Ticket,
  Trash2,
  Wallet,
} from "lucide-react";

import api from "../../api/axios";
import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import Loading from "../../components/ui/Loading";
import PageHeader from "../../components/ui/PageHeader";
import StatusBadge from "../../components/ui/StatusBadge";
import { dateOnly, getErrorMessage, imageUrl, money } from "../../utils/formatters";

const getTodayInputValue = () => {
  const today = new Date();
  const timezoneOffset = today.getTimezoneOffset() * 60000;

  return new Date(today.getTime() - timezoneOffset)
    .toISOString()
    .split("T")[0];
};

const getStartOfMonthInputValue = () => {
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  const timezoneOffset = firstDay.getTimezoneOffset() * 60000;

  return new Date(firstDay.getTime() - timezoneOffset)
    .toISOString()
    .split("T")[0];
};

const getMoviePerformanceList = (movieData) => {
  return (
    movieData?.moviePerformance ||
    movieData?.movies ||
    movieData?.performance ||
    []
  );
};

const getBookingCount = (bookingData) => {
  return (
    bookingData?.summary?.totalBookings ||
    bookingData?.total ||
    bookingData?.count ||
    bookingData?.bookings?.length ||
    0
  );
};

const AdminReportsPage = () => {
  const [data, setData] = useState({
    revenue: null,
    bookings: null,
    movies: null,
  });

  const [filters, setFilters] = useState({
    startDate: getStartOfMonthInputValue(),
    endDate: getTodayInputValue(),
  });

  const [loading, setLoading] = useState(true);
  const [cleanupLoading, setCleanupLoading] = useState(false);

  const moviePerformance = useMemo(
    () => getMoviePerformanceList(data.movies),
    [data.movies]
  );

  const totalBookings = useMemo(
    () => getBookingCount(data.bookings),
    [data.bookings]
  );

  const loadReports = async () => {
    setLoading(true);

    try {
      const params = {
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
      };

      const [revenueResponse, bookingResponse, movieResponse] =
        await Promise.all([
          api.get("/dashboard/admin/revenue-report", { params }),
          api.get("/dashboard/admin/booking-report", { params }),
          api.get("/dashboard/admin/movie-performance", { params }),
        ]);

      setData({
        revenue: revenueResponse.data,
        bookings: bookingResponse.data,
        movies: movieResponse.data,
      });
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to load reports"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const handleFilterChange = (event) => {
    setFilters((prev) => ({
      ...prev,
      [event.target.name]: event.target.value,
    }));
  };

  const applyFilters = () => {
    loadReports();
  };

  const clearFilters = () => {
    const resetFilters = {
      startDate: "",
      endDate: "",
    };

    setFilters(resetFilters);

    setTimeout(() => {
      loadReports();
    }, 0);
  };

  const cleanupExpiredReservations = async () => {
    setCleanupLoading(true);

    try {
      const { data } = await api.post(
        "/maintenance/release-expired-reservations"
      );

      toast.success(data.message || "Expired reservations released");
      loadReports();
    } catch (error) {
      toast.error(getErrorMessage(error, "Cleanup failed"));
    } finally {
      setCleanupLoading(false);
    }
  };

  const totalRevenue = data.revenue?.summary?.totalRevenue || 0;
  const paidBookings = data.revenue?.summary?.totalBookings || 0;
  const totalTickets = data.revenue?.summary?.totalTickets || 0;
  const averageBookingValue = data.revenue?.summary?.averageBookingValue || 0;

  if (loading) {
    return <Loading label="Loading reports..." />;
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Reports & Maintenance"
        subtitle="Revenue, bookings, movie performance, and reservation cleanup."
        action={
          <button
            onClick={cleanupExpiredReservations}
            disabled={cleanupLoading}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 py-3 text-sm font-black text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {cleanupLoading ? (
              <RefreshCcw className="h-5 w-5 animate-spin" />
            ) : (
              <Trash2 className="h-5 w-5" />
            )}
            {cleanupLoading
              ? "Releasing..."
              : "Release expired reservations"}
          </button>
        }
      />

      <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
        <div className="mb-5 flex items-center gap-3">
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-3 text-red-300">
            <CalendarDays className="h-5 w-5" />
          </div>

          <div>
            <h2 className="text-lg font-black text-white">Report Filters</h2>
            <p className="text-sm text-slate-400">
              Select a date range and refresh report data.
            </p>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_1fr_auto_auto]">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-300">
              Start date
            </label>
            <input
              type="date"
              name="startDate"
              value={filters.startDate}
              onChange={handleFilterChange}
              className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-red-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-300">
              End date
            </label>
            <input
              type="date"
              name="endDate"
              value={filters.endDate}
              onChange={handleFilterChange}
              className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-red-500"
            />
          </div>

          <div className="flex items-end">
            <button
              type="button"
              onClick={applyFilters}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 py-3 text-sm font-black text-white transition hover:bg-red-700"
            >
              <RefreshCcw className="h-4 w-4" />
              Apply
            </button>
          </div>

          <div className="flex items-end">
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-black text-white transition hover:bg-white/[0.08]"
            >
              <FilterX className="h-4 w-4" />
              Clear
            </button>
          </div>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-4">
        <Card
          title="Revenue"
          value={money(totalRevenue)}
          subtitle={`${paidBookings} paid booking(s)`}
          icon={Wallet}
        />

        <Card
          title="Bookings"
          value={totalBookings}
          subtitle="Selected period total"
          icon={Ticket}
        />

        <Card
          title="Tickets Sold"
          value={totalTickets}
          subtitle="Paid ticket count"
          icon={BarChart3}
        />

        <Card
          title="Average Booking"
          value={money(averageBookingValue)}
          subtitle="Average paid booking value"
          icon={Film}
        />
      </div>

      <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
        <div className="mb-6 flex flex-col justify-between gap-3 md:flex-row md:items-center">
          <div>
            <h2 className="text-2xl font-black text-white">
              Movie Performance
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Revenue and booking performance by movie.
            </p>
          </div>

          <StatusBadge value={`${moviePerformance.length} movie item(s)`} />
        </div>

        {moviePerformance.length === 0 ? (
          <EmptyState
            title="No movie performance data"
            subtitle="Performance appears after customers complete paid bookings within the selected date range."
          />
        ) : (
          <div className="space-y-4">
            {moviePerformance.map((movie, index) => {
              const poster = imageUrl(movie);

              return (
                <div
                  key={movie.movieId || movie._id || index}
                  className="grid gap-4 rounded-3xl border border-white/10 bg-slate-950/70 p-4 transition hover:border-red-500/25 md:grid-cols-[72px_1fr_auto]"
                >
                  <div className="h-20 w-20 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]">
                    {poster ? (
                      <img
                        src={poster}
                        alt={movie.title || "Movie"}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-slate-600">
                        <Film className="h-6 w-6" />
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-black text-white">
                        {movie.title || movie.movieTitle || "Unknown Movie"}
                      </h3>
                      <StatusBadge value={movie.genre || "Movie"} />
                    </div>

                    <p className="mt-2 text-sm text-slate-400">
                      Language: {movie.language || "-"}
                    </p>

                    <div className="mt-3 grid gap-3 sm:grid-cols-3">
                      <MiniMetric
                        label="Bookings"
                        value={movie.totalBookings || movie.bookingCount || 0}
                      />
                      <MiniMetric
                        label="Tickets"
                        value={movie.totalTickets || 0}
                      />
                      <MiniMetric
                        label="Revenue"
                        value={money(movie.revenue || 0)}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end">
                    <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-right">
                      <p className="text-xs font-bold uppercase tracking-wide text-red-200">
                        Rank
                      </p>
                      <p className="text-2xl font-black text-white">
                        #{index + 1}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-black text-white">Recent Bookings</h2>
          <p className="mt-1 text-sm text-slate-400">
            Latest booking records within the selected report range.
          </p>
        </div>

        {(data.bookings?.bookings || []).length === 0 ? (
          <EmptyState
            title="No booking records"
            subtitle="Bookings will appear here after customers reserve or purchase tickets."
          />
        ) : (
          <div className="overflow-hidden rounded-3xl border border-white/10">
            <div className="grid grid-cols-[1.2fr_1fr_1fr_1fr_1fr] gap-3 bg-slate-950/90 px-5 py-4 text-xs font-black uppercase tracking-wide text-slate-400">
              <span>Customer</span>
              <span>Movie</span>
              <span>Date</span>
              <span>Status</span>
              <span className="text-right">Amount</span>
            </div>

            {data.bookings.bookings.map((booking) => (
              <div
                key={booking._id}
                className="grid grid-cols-[1.2fr_1fr_1fr_1fr_1fr] gap-3 border-t border-white/10 px-5 py-4 text-sm"
              >
                <div>
                  <p className="font-bold text-white">
                    {booking.customer?.name || "-"}
                  </p>
                  <p className="text-xs text-slate-500">
                    {booking.customer?.email || "-"}
                  </p>
                </div>

                <p className="font-semibold text-white">
                  {booking.movie?.title || "-"}
                </p>

                <p className="text-slate-300">{dateOnly(booking.createdAt)}</p>

                <div className="flex flex-wrap gap-2">
                  <StatusBadge value={booking.bookingStatus} />
                  <StatusBadge value={booking.paymentStatus} />
                </div>

                <p className="text-right font-black text-red-200">
                  {money(booking.totalAmount)}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

const MiniMetric = ({ label, value }) => {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 font-black text-white">{value}</p>
    </div>
  );
};

export default AdminReportsPage;