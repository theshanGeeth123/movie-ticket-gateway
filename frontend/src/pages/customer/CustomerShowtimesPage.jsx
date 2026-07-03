import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import {
  CalendarDays,
  Clock,
  Film,
  FilterX,
  MapPin,
  Search,
  Ticket,
} from "lucide-react";

import api from "../../api/axios";
import EmptyState from "../../components/ui/EmptyState";
import Loading from "../../components/ui/Loading";
import StatusBadge from "../../components/ui/StatusBadge";
import {
  dateOnly,
  getErrorMessage,
  imageUrl,
  money,
} from "../../utils/formatters";

const formatDateForApi = (dateValue) => {
  if (!dateValue) return "";

  const date = new Date(dateValue);
  const timezoneOffset = date.getTimezoneOffset() * 60000;

  return new Date(date.getTime() - timezoneOffset)
    .toISOString()
    .split("T")[0];
};

const getTodayStart = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

const groupShowtimesByMovie = (showtimes = []) => {
  const map = new Map();

  showtimes.forEach((showtime) => {
    const movie = showtime.movie;
    const movieId = movie?._id || "unknown";

    if (!map.has(movieId)) {
      map.set(movieId, {
        movie,
        showtimes: [],
      });
    }

    map.get(movieId).showtimes.push(showtime);
  });

  return Array.from(map.values()).map((item) => ({
    ...item,
    showtimes: item.showtimes.sort((a, b) =>
      `${a.showDate} ${a.startTime}`.localeCompare(`${b.showDate} ${b.startTime}`)
    ),
  }));
};

const CustomerShowtimesPage = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showtimes, setShowtimes] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const selectedDateString = selectedDate ? formatDateForApi(selectedDate) : "";

  const movieGroups = useMemo(() => {
    const grouped = groupShowtimesByMovie(showtimes);

    if (!search.trim()) return grouped;

    const keyword = search.toLowerCase();

    return grouped.filter((group) => {
      const movieTitle = group.movie?.title?.toLowerCase() || "";
      const genre = group.movie?.genre?.toLowerCase() || "";
      const language = group.movie?.language?.toLowerCase() || "";

      return (
        movieTitle.includes(keyword) ||
        genre.includes(keyword) ||
        language.includes(keyword)
      );
    });
  }, [showtimes, search]);

  const loadShowtimes = async () => {
    setLoading(true);
    setError("");

    try {
      const { data } = await api.get("/showtimes/public", {
        params: {
          date: selectedDateString || undefined,
        },
      });

      setShowtimes(data.showtimes || []);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load available showtimes"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadShowtimes();
  }, [selectedDateString]);

  const clearDate = () => {
    setSelectedDate(null);
  };

  const setToday = () => {
    setSelectedDate(new Date());
  };

  const setTomorrow = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setSelectedDate(tomorrow);
  };

  if (loading) {
    return <Loading label="Loading available showtimes..." />;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.35em] text-red-300">
            Movie Gateway
          </p>

          <h1 className="mt-3 text-4xl font-black text-white md:text-5xl">
            Find Showtimes
          </h1>

          <p className="mt-2 max-w-2xl text-slate-400">
            Select a date and view all available movies and showtimes for that
            day.
          </p>
        </div>

        <Link
          to="/movies"
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-bold text-white transition hover:bg-white/[0.08]"
        >
          <Film className="h-5 w-5" />
          Browse all movies
        </Link>
      </div>

      <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
        <div className="grid gap-4 lg:grid-cols-[260px_1fr_auto_auto_auto] lg:items-end">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-300">
              Select date
            </label>

            <DatePicker
              selected={selectedDate}
              onChange={(dateValue) => setSelectedDate(dateValue)}
              minDate={getTodayStart()}
              dateFormat="MMM d, yyyy"
              placeholderText="All upcoming dates"
              calendarClassName="movie-calendar"
              popperClassName="movie-calendar-popper"
              customInput={
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-3 rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-left text-white outline-none transition hover:bg-slate-900 focus:border-red-500"
                >
                  <span className="inline-flex items-center gap-3">
                    <CalendarDays className="h-5 w-5 text-red-300" />
                    <span>
                      {selectedDate
                        ? dateOnly(selectedDate)
                        : "All upcoming dates"}
                    </span>
                  </span>
                </button>
              }
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-300">
              Search movie
            </label>

            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />

              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by movie, genre, language..."
                className="w-full rounded-2xl border border-white/10 bg-slate-950 py-3 pl-12 pr-4 text-white outline-none transition focus:border-red-500"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={setToday}
            className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-bold text-white transition hover:bg-white/[0.08]"
          >
            Today
          </button>

          <button
            type="button"
            onClick={setTomorrow}
            className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-bold text-white transition hover:bg-white/[0.08]"
          >
            Tomorrow
          </button>

          <button
            type="button"
            onClick={clearDate}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-bold text-white transition hover:bg-white/[0.08]"
          >
            <FilterX className="h-4 w-4" />
            Clear
          </button>
        </div>
      </section>

      {error && (
        <div className="rounded-3xl border border-red-500/30 bg-red-500/10 p-5 text-red-200">
          {error}
        </div>
      )}

      <section>
        <div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-center">
          <div>
            <h2 className="text-2xl font-black text-white">
              Available Movies
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              {selectedDate
                ? `Showing movies available on ${dateOnly(selectedDate)}`
                : "Showing all upcoming available showtimes"}
            </p>
          </div>

          <StatusBadge value={`${movieGroups.length} movie(s)`} />
        </div>

        {movieGroups.length === 0 ? (
          <EmptyState
            title="No movies available for this date"
            subtitle="Please select another date or clear the date filter."
          />
        ) : (
          <div className="space-y-5">
            {movieGroups.map((group) => (
              <MovieShowtimeCard
                key={group.movie?._id || Math.random()}
                movie={group.movie}
                showtimes={group.showtimes}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

const MovieShowtimeCard = ({ movie, showtimes }) => {
  const poster = imageUrl(movie);

  return (
    <article className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] shadow-2xl">
      <div className="grid lg:grid-cols-[260px_1fr]">
        <div className="relative min-h-[280px] bg-slate-950">
          {poster ? (
            <img
              src={poster}
              alt={movie?.title || "Movie"}
              className="h-full min-h-[280px] w-full object-cover"
            />
          ) : (
            <div className="flex h-full min-h-[280px] items-center justify-center">
              <Film className="h-16 w-16 text-white/20" />
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />

          <div className="absolute bottom-0 left-0 right-0 p-5">
            <StatusBadge value={movie?.format || "Movie"} />
          </div>
        </div>

        <div className="p-5 md:p-6">
          <div className="mb-5 flex flex-col justify-between gap-4 md:flex-row md:items-start">
            <div>
              <h3 className="text-2xl font-black text-white">
                {movie?.title || "Unknown Movie"}
              </h3>

              <p className="mt-2 text-sm text-slate-400">
                {movie?.genre || "Genre"} · {movie?.language || "Language"} ·{" "}
                {movie?.duration || "-"} min
              </p>
            </div>

            <Link
              to={`/movies/${movie?._id}`}
              className="inline-flex items-center justify-center rounded-2xl border border-white/10 px-4 py-2 text-sm font-bold text-white transition hover:bg-white/[0.06]"
            >
              Movie details
            </Link>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {showtimes.map((showtime) => (
              <div
                key={showtime._id}
                className="rounded-3xl border border-white/10 bg-slate-950/70 p-4"
              >
                <div className="mb-3 flex items-center justify-between gap-3">
                  <StatusBadge value={showtime.hall?.screenType || "Hall"} />

                  <span className="text-xs font-semibold text-slate-400">
                    {showtime.availableSeats} seats left
                  </span>
                </div>

                <div className="space-y-2 text-sm text-slate-300">
                  <p className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-red-300" />
                    <b className="text-white">{showtime.hall?.name || "-"}</b>
                  </p>

                  <p className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-red-300" />
                    {dateOnly(showtime.showDate)}
                  </p>

                  <p className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-red-300" />
                    {showtime.startTime} - {showtime.endTime}
                  </p>

                  <p className="flex items-center gap-2 font-black text-red-200">
                    <Ticket className="h-4 w-4" />
                    {money(showtime.finalTicketPrice)}
                  </p>
                </div>

                <Link
                  to={`/book/${showtime._id}`}
                  className="mt-4 flex w-full justify-center rounded-2xl bg-red-600 px-4 py-3 text-sm font-black text-white transition hover:bg-red-700"
                >
                  Select seats
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </article>
  );
};

export default CustomerShowtimesPage;