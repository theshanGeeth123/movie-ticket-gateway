const normalizeSeatCode = (seat) => {
  if (!seat) return "";

  if (typeof seat === "string") {
    return seat.toUpperCase().trim();
  }

  return (
    seat.seatCode ||
    seat.code ||
    seat.label ||
    seat.name ||
    ""
  )
    .toString()
    .toUpperCase()
    .trim();
};

export const extractBookingSeatCodes = (booking) => {
  if (!booking) return [];

  if (Array.isArray(booking.seats)) {
    return booking.seats
      .map((seat) => normalizeSeatCode(seat))
      .filter(Boolean);
  }

  if (Array.isArray(booking.selectedSeats)) {
    return booking.selectedSeats
      .map((seat) => normalizeSeatCode(seat))
      .filter(Boolean);
  }

  if (Array.isArray(booking.seatCodes)) {
    return booking.seatCodes
      .map((seat) => normalizeSeatCode(seat))
      .filter(Boolean);
  }

  return [];
};

export const releaseSeatsInShowtime = (showtime, seatCodes) => {
  if (!showtime || !Array.isArray(seatCodes) || seatCodes.length === 0) {
    return false;
  }

  const targetSeats = new Set(
    seatCodes.map((seatCode) => seatCode.toString().toUpperCase().trim())
  );

  let changed = false;

  const releaseSeat = (seat) => {
    const seatCode = normalizeSeatCode(seat);

    if (!targetSeats.has(seatCode)) return;
    if (seat.status !== "reserved") return;

    seat.status = "available";
    changed = true;
  };

  if (Array.isArray(showtime.seatAvailability)) {
    showtime.seatAvailability.forEach((row) => {
      if (Array.isArray(row.seats)) {
        row.seats.forEach(releaseSeat);
      }
    });

    showtime.markModified("seatAvailability");
  }

  return changed;
};