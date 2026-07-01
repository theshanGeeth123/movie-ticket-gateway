import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { CalendarDays, Clock, PlayCircle, Ticket } from "lucide-react";
import api from "../../api/axios";
import EmptyState from "../../components/ui/EmptyState";
import Loading from "../../components/ui/Loading";
import StatusBadge from "../../components/ui/StatusBadge";
import { dateOnly, getErrorMessage, imageUrl, money } from "../../utils/formatters";

const MovieDetailsPage = () => {
  const { id } = useParams();
  const [movie,setMovie]=useState(null); const [showtimes,setShowtimes]=useState([]); const [loading,setLoading]=useState(true); const [error,setError]=useState(""); const [date,setDate]=useState("");
  const gallery=useMemo(()=>[movie?.mainImage, ...(movie?.galleryImages||[])].filter((img)=>img?.url),[movie]);
  const fetchData=async()=>{setLoading(true); setError(""); try{const [moviesRes,showsRes]=await Promise.all([api.get("/movies/public",{params:{limit:100}}), api.get("/showtimes/public",{params:{movie:id,date:date||undefined}})]); setMovie((moviesRes.data.movies||[]).find((m)=>m._id===id)); setShowtimes(showsRes.data.showtimes||[]);}catch(err){setError(getErrorMessage(err,"Failed to load movie"));}finally{setLoading(false);}};
  useEffect(()=>{fetchData();},[id,date]);
  if(loading)return <Loading label="Loading movie details..."/>; if(error)return <div className="mx-auto max-w-7xl p-8 text-red-200">{error}</div>; if(!movie)return <div className="mx-auto max-w-7xl p-8"><EmptyState title="Movie not found"/></div>;
  return <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
    <div className="grid gap-8 lg:grid-cols-[380px_1fr]">
      <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04]">{imageUrl(movie)?<img src={imageUrl(movie)} alt={movie.title} className="aspect-[2/3] w-full object-cover"/>:<div className="flex aspect-[2/3] items-center justify-center text-slate-600">No image</div>}</div>
      <div>
        <div className="mb-4 flex flex-wrap gap-2"><StatusBadge value={movie.format}/><StatusBadge value={movie.ageRating}/><StatusBadge value={movie.isActive!==false?"active":"inactive"}/></div>
        <h1 className="text-4xl font-black md:text-6xl">{movie.title}</h1>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">{movie.description}</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"><Clock className="mb-2 h-5 w-5 text-red-300"/><p className="text-sm text-slate-400">Duration</p><p className="font-bold">{movie.duration} minutes</p></div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"><CalendarDays className="mb-2 h-5 w-5 text-red-300"/><p className="text-sm text-slate-400">Release</p><p className="font-bold">{dateOnly(movie.releaseDate)}</p></div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"><Ticket className="mb-2 h-5 w-5 text-red-300"/><p className="text-sm text-slate-400">3D fee</p><p className="font-bold">{money(movie.threeDGlassesFee)}</p></div>
        </div>
        <div className="mt-5 text-sm text-slate-400"><b className="text-slate-200">Genre:</b> {movie.genre} · <b className="text-slate-200">Language:</b> {movie.language} · <b className="text-slate-200">Director:</b> {movie.director || "-"}</div>
        {movie.trailerUrl&&<a href={movie.trailerUrl} target="_blank" rel="noreferrer" className="mt-6 inline-flex items-center rounded-2xl border border-white/10 px-5 py-3 font-bold hover:bg-white/5"><PlayCircle className="mr-2 h-5 w-5"/>Watch trailer</a>}
      </div>
    </div>
    {gallery.length>1&&<div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{gallery.map((img,i)=><img key={img.publicId||i} src={img.url} className="aspect-video rounded-2xl border border-white/10 object-cover"/> )}</div>}
    <section className="mt-12"><div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><h2 className="text-3xl font-black">Showtimes</h2><p className="text-slate-400">Select a showtime to reserve seats.</p></div><input type="date" className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white" value={date} onChange={(e)=>setDate(e.target.value)}/></div>{showtimes.length===0?<EmptyState title="No showtimes found" subtitle="Try another date or check again later."/>:<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{showtimes.map((s)=><div key={s._id} className="rounded-3xl border border-white/10 bg-white/[0.04] p-5"><div className="mb-3 flex justify-between gap-3"><StatusBadge value={s.hall?.screenType}/><span className="text-sm text-slate-400">{s.availableSeats} seats left</span></div><h3 className="font-black">{s.hall?.name}</h3><p className="mt-2 text-sm text-slate-400">{dateOnly(s.showDate)} · {s.startTime} - {s.endTime}</p><p className="mt-2 font-bold text-red-200">{money(s.finalTicketPrice)}</p><Link to={`/book/${s._id}`} className="mt-4 flex justify-center rounded-2xl bg-red-600 px-4 py-3 font-bold hover:bg-red-700">Select seats</Link></div>)}</div>}</section>
  </main>;
};
export default MovieDetailsPage;
