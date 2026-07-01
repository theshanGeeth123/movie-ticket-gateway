import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";
import api from "../../api/axios";
import Loading from "../../components/ui/Loading";
import StatusBadge from "../../components/ui/StatusBadge";
import { dateOnly, getErrorMessage, imageUrl, money } from "../../utils/formatters";

const seatClass = (status, selected) => {
  if (selected) return "bg-red-600 text-white border-red-400";
  if (status === "available") return "bg-emerald-500/15 text-emerald-200 border-emerald-500/30 hover:bg-emerald-500/25";
  if (status === "reserved") return "bg-amber-500/20 text-amber-200 border-amber-500/30 cursor-not-allowed";
  if (status === "booked") return "bg-red-500/20 text-red-200 border-red-500/30 cursor-not-allowed";
  return "bg-slate-700/50 text-slate-500 border-slate-600 cursor-not-allowed";
};

const BookingPage = () => {
  const { showtimeId } = useParams(); const navigate=useNavigate();
  const [showtime,setShowtime]=useState(null); const [selected,setSelected]=useState([]); const [loading,setLoading]=useState(true); const [submitting,setSubmitting]=useState(false); const [error,setError]=useState("");
  const fetchShow=async()=>{setLoading(true); setError(""); try{const {data}=await api.get(`/showtimes/public/${showtimeId}`); setShowtime(data.showtime);}catch(err){setError(getErrorMessage(err,"Failed to load seats"));}finally{setLoading(false);}};
  useEffect(()=>{fetchShow();},[showtimeId]);
  const seats=useMemo(()=>selected.map((code)=>{for(const row of showtime?.seatAvailability||[]){const s=row.seats.find((x)=>x.seatCode===code); if(s)return s;} return null;}).filter(Boolean),[selected,showtime]);
  const total=seats.reduce((sum,s)=>sum+Number(s.price||0),0);
  const toggle=(seat)=>{if(seat.status!=="available")return; setSelected((prev)=>prev.includes(seat.seatCode)?prev.filter((c)=>c!==seat.seatCode):[...prev,seat.seatCode]);};
  const reserve=async()=>{if(selected.length===0)return toast.error("Select at least one seat"); setSubmitting(true); try{const {data}=await api.post("/bookings/reserve",{showtimeId,seats:selected}); toast.success(data.message||"Seats reserved"); navigate(`/payment/${data.booking._id}`);}catch(err){toast.error(getErrorMessage(err,"Seat reservation failed")); fetchShow();}finally{setSubmitting(false);}};
  if(loading)return <div className="min-h-screen bg-slate-950"><Loading label="Loading seat map..."/></div>; if(error)return <div className="min-h-screen bg-slate-950 p-8 text-red-200">{error}</div>;
  return <main className="min-h-screen bg-slate-950 px-4 py-8 text-white sm:px-6 lg:px-8"><div className="mx-auto max-w-7xl"><Link to={`/movies/${showtime.movie?._id}`} className="text-sm text-red-300">← Back to movie</Link><div className="mt-5 grid gap-6 lg:grid-cols-[1fr_360px]"><section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5"><div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center"><div className="h-24 w-20 overflow-hidden rounded-2xl bg-slate-900">{imageUrl(showtime.movie)&&<img src={imageUrl(showtime.movie)} className="h-full w-full object-cover"/>}</div><div><h1 className="text-3xl font-black">{showtime.movie?.title}</h1><p className="mt-1 text-slate-400">{showtime.hall?.name} · {dateOnly(showtime.showDate)} · {showtime.startTime} - {showtime.endTime}</p><div className="mt-2 flex gap-2"><StatusBadge value={showtime.hall?.screenType}/><StatusBadge value={showtime.status}/></div></div></div><div className="mx-auto mb-8 h-3 max-w-3xl rounded-full bg-gradient-to-r from-transparent via-slate-400 to-transparent opacity-60"/><p className="mb-3 text-center text-xs uppercase tracking-[0.25em] text-slate-500">Screen</p><div className="overflow-x-auto pb-4"><div className="min-w-max space-y-3">{showtime.seatAvailability?.map((row)=><div key={row.rowLabel} className="flex items-center gap-2"><span className="w-8 text-center text-sm font-bold text-slate-500">{row.rowLabel}</span>{row.seats.map((seat)=><button key={seat.seatCode} onClick={()=>toggle(seat)} className={`h-10 min-w-10 rounded-xl border px-2 text-xs font-bold ${seatClass(seat.status,selected.includes(seat.seatCode))}`}>{seat.seatCode}</button>)}</div>)}</div></div><div className="mt-6 flex flex-wrap gap-3 text-xs text-slate-400">{["available","reserved","booked","blocked"].map((s)=><span key={s} className="flex items-center gap-2"><span className={`h-3 w-3 rounded ${seatClass(s,false).split(" ").slice(0,1).join(" ")}`}/> {s}</span>)}</div></section><aside className="h-fit rounded-3xl border border-white/10 bg-white/[0.04] p-5"><h2 className="text-xl font-black">Booking summary</h2><div className="mt-4 space-y-3 text-sm text-slate-300"><div className="flex justify-between"><span>Selected seats</span><b className="text-white">{selected.length?selected.join(", "):"None"}</b></div><div className="flex justify-between"><span>Ticket price</span><b className="text-white">{money(showtime.finalTicketPrice)}</b></div><div className="border-t border-white/10 pt-3 flex justify-between text-lg"><span>Total</span><b className="text-red-200">{money(total)}</b></div></div><button onClick={reserve} disabled={submitting||selected.length===0} className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 py-3 font-bold hover:bg-red-700 disabled:opacity-50">{submitting&&<Loader2 className="h-5 w-5 animate-spin"/>}Reserve and Pay</button><p className="mt-3 text-xs text-slate-500">Your seats are reserved for 10 minutes after confirmation.</p></aside></div></div></main>;
};
export default BookingPage;
