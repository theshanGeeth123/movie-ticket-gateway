import { forwardRef, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import {
  CalendarDays,
  ChevronDown,
  Clock,
  FilterX,
  PlayCircle,
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

const getTodayInputValue = () => {
  const today = new Date();
  const timezoneOffset = today.getTimezoneOffset() * 60000;

  return new Date(today.getTime() - timezoneOffset)
    .toISOString()
    .split("T")[0];
};

const formatDateForApi = (dateValue) => {
  if (!dateValue) return "";

  const date = new Date(dateValue);
  const timezoneOffset = date.getTimezoneOffset() * 60000;

  return new Date(date.getTime() - timezoneOffset)
    .toISOString()
    .split("T")[0];
};

const getInputDateFromShowDate = (dateValue) => {
  if (!dateValue) return "";

  const date = new Date(dateValue);
  const timezoneOffset = date.getTimezoneOffset() * 60000;

  return new Date(date.getTime() - timezoneOffset)
    .toISOString()
    .split("T")[0];
};

const isPastShowtime = (showtime) => {
  if (!showtime?.showDate || !showtime?.startTime) return false;

  const showDateOnly = getInputDateFromShowDate(showtime.showDate);
  const today = getTodayInputValue();

  if (showDateOnly < today) return true;

  if (showDateOnly === today) {
    const now = new Date();

    const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(
      now.getMinutes()
    ).padStart(2, "0")}`;

    return showtime.startTime < currentTime;
  }

  return false;
};

const DatePickerButton = forwardRef(({ value, onClick }, ref) => {
  return (
    <button
      type="button"
      onClick={onClick}
      ref={ref}
      className="inline-flex w-full items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-left text-white outline-none transition hover:bg-white/[0.07] focus:border-red-500 sm:w-[240px]"
    >
      <span className="inline-flex items-center gap-3">
        <CalendarDays className="h-5 w-5 text-red-300" />
        <span className={value ? "font-semibold text-white" : "text-slate-400"}>
          {value || "Select date"}
        </span>
      </span>

      <ChevronDown className="h-4 w-4 text-slate-400" />
    </button>
  );
});

DatePickerButton.displayName = "DatePickerButton";

const MovieDetailsPage = () => {
  const { id } = useParams();

  const [movie, setMovie] = useState(null);
  const [showtimes, setShowtimes] = useState([]);
  const [loadingMovie, setLoadingMovie] = useState(true);
  const [loadingShowtimes, setLoadingShowtimes] = useState(false);
  const [error, setError] = useState("");
  const [selectedDate, setSelectedDate] = useState(null);

  const date = selectedDate ? formatDateForApi(selectedDate) : "";

  const gallery = useMemo(() => {
    return [movie?.mainImage, ...(movie?.galleryImages || [])].filter(
      (img) => img?.url
    );
  }, [movie]);

  const filteredShowtimes = useMemo(() => {
    return showtimes
      .filter((showtime) => !isPastShowtime(showtime))
      .filter((showtime) => {
        if (!date) return true;

        return getInputDateFromShowDate(showtime.showDate) === date;
      })
      .sort((a, b) => {
        const dateA = `${getInputDateFromShowDate(a.showDate)} ${a.startTime}`;
        const dateB = `${getInputDateFromShowDate(b.showDate)} ${b.startTime}`;

        return dateA.localeCompare(dateB);
      });
  }, [showtimes, date]);

  const loadMovie = async () => {
    setLoadingMovie(true);
    setError("");

    try {
      const { data } = await api.get("/movies/public", {
        params: {
          limit: 100,
        },
      });

      const selectedMovie = (data.movies || []).find((item) => item._id === id);

      setMovie(selectedMovie || null);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load movie"));
    } finally {
      setLoadingMovie(false);
    }
  };

  const loadShowtimes = async () => {
    setLoadingShowtimes(true);

    try {
      const { data } = await api.get("/showtimes/public", {
        params: {
          movie: id,
          date: date || undefined,
        },
      });

      setShowtimes(data.showtimes || []);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load showtimes"));
    } finally {
      setLoadingShowtimes(false);
    }
  };

  useEffect(() => {
    loadMovie();
  }, [id]);

  useEffect(() => {
    loadShowtimes();
  }, [id, date]);

  const clearDateFilter = () => {
    setSelectedDate(null);
  };

  if (loadingMovie) {
    return <Loading label="Loading movie details..." />;
  }

  if (error) {
    return (
      <div className="mx-auto max-w-7xl p-8 text-red-200">
        <div className="rounded-3xl border border-red-500/30 bg-red-500/10 p-6">
          {error}
        </div>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="mx-auto max-w-7xl p-8">
        <EmptyState title="Movie not found" />
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="grid gap-8 lg:grid-cols-[380px_1fr]">
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04]">
          {imageUrl(movie) ? (
            <img
              src={imageUrl(movie)}
              alt={movie.title}
              className="aspect-[2/3] w-full object-cover"
            />
          ) : (
            <div className="flex aspect-[2/3] items-center justify-center text-slate-600">
              No image
            </div>
          )}
        </div>

        <div>
          <div className="mb-4 flex flex-wrap gap-2">
            <StatusBadge value={movie.format} />
            <StatusBadge value={movie.ageRating} />
            <StatusBadge value={movie.isActive !== false ? "active" : "inactive"} />
          </div>

          <h1 className="text-4xl font-black md:text-6xl">{movie.title}</h1>

          <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">
            {movie.description}
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <Clock className="mb-2 h-5 w-5 text-red-300" />
              <p className="text-sm text-slate-400">Duration</p>
              <p className="font-bold">{movie.duration} minutes</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <CalendarDays className="mb-2 h-5 w-5 text-red-300" />
              <p className="text-sm text-slate-400">Release</p>
              <p className="font-bold">{dateOnly(movie.releaseDate)}</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <Ticket className="mb-2 h-5 w-5 text-red-300" />
              <p className="text-sm text-slate-400">3D fee</p>
              <p className="font-bold">{money(movie.threeDGlassesFee)}</p>
            </div>
          </div>

          <div className="mt-5 text-sm text-slate-400">
            <b className="text-slate-200">Genre:</b> {movie.genre} ·{" "}
            <b className="text-slate-200">Language:</b> {movie.language} ·{" "}
            <b className="text-slate-200">Director:</b> {movie.director || "-"}
          </div>

          {movie.trailerUrl && (
            <a
              href={movie.trailerUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-6 inline-flex items-center rounded-2xl border border-white/10 px-5 py-3 font-bold hover:bg-white/5"
            >
              <PlayCircle className="mr-2 h-5 w-5" />
              Watch trailer
            </a>
          )}
        </div>
      </div>

      {gallery.length > 1 && (
        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {gallery.map((img, index) => (
            <img
              key={img.publicId || index}
              src={img.url}
              alt={`${movie.title} gallery ${index + 1}`}
              className="aspect-video rounded-2xl border border-white/10 object-cover"
            />
          ))}
        </div>
      )}

      <section className="mt-12">
        <div className="mb-6 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-3xl font-black">Showtimes</h2>
            <p className="mt-1 text-slate-400">
              Select a future showtime to reserve seats.
            </p>

            {date && (
              <p className="mt-2 text-sm text-red-300">
                Showing results for: <b>{dateOnly(date)}</b>
              </p>
            )}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <DatePicker
              selected={selectedDate}
              onChange={(dateValue) => setSelectedDate(dateValue)}
              minDate={new Date()}
              dateFormat="MMM d, yyyy"
              placeholderText="Select date"
              customInput={<DatePickerButton />}
              calendarClassName="movie-calendar"
              popperClassName="movie-calendar-popper"
              popperPlacement="bottom-end"
              isClearable={false}
            />

            {selectedDate && (
              <button
                type="button"
                onClick={clearDateFilter}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-bold text-white transition hover:bg-white/[0.08]"
              >
                <FilterX className="h-4 w-4" />
                Clear date
              </button>
            )}
          </div>
        </div>

        {loadingShowtimes ? (
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8">
            <Loading label="Loading showtimes..." />
          </div>
        ) : filteredShowtimes.length === 0 ? (
          <EmptyState
            title={
              date ? "No showtimes for selected date" : "No future showtimes found"
            }
            subtitle={
              date
                ? "Please select another date or clear the date filter."
                : "Please check again later."
            }
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredShowtimes.map((showtime) => (
              <div
                key={showtime._id}
                className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 transition hover:border-red-500/30 hover:bg-white/[0.06]"
              >
                <div className="mb-3 flex justify-between gap-3">
                  <StatusBadge value={showtime.hall?.screenType} />
                  <span className="text-sm text-slate-400">
                    {showtime.availableSeats} seats left
                  </span>
                </div>

                <h3 className="font-black">{showtime.hall?.name}</h3>

                <p className="mt-2 text-sm text-slate-400">
                  {dateOnly(showtime.showDate)} · {showtime.startTime} -{" "}
                  {showtime.endTime}
                </p>

                <p className="mt-2 font-bold text-red-200">
                  {money(showtime.finalTicketPrice)}
                </p>

                <Link
                  to={`/book/${showtime._id}`}
                  className="mt-4 flex justify-center rounded-2xl bg-red-600 px-4 py-3 font-bold text-white transition hover:bg-red-700"
                >
                  Select seats
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
};

export default MovieDetailsPage;