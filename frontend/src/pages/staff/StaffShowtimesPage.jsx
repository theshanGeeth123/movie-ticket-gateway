import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../../api/axios";
import EmptyState from "../../components/ui/EmptyState";
import Loading from "../../components/ui/Loading";
import PageHeader from "../../components/ui/PageHeader";
import StatusBadge from "../../components/ui/StatusBadge";
import { dateOnly, getErrorMessage, money } from "../../utils/formatters";
const StaffShowtimesPage=()=>{const[items,setItems]=useState([]),[loading,setLoading]=useState(true),[date,setDate]=useState(new Date().toISOString().slice(0,10));const load=async()=>{setLoading(true);try{const{data}=await api.get("/dashboard/staff/today-showtimes",{params:{date}});setItems(data.showtimes||[]);}catch(e){toast.error(getErrorMessage(e,"Failed to load showtimes"));}finally{setLoading(false);}};useEffect(()=>{load();},[date]);return <><PageHeader title="Staff Showtimes" subtitle="View showtimes by date." action={<input type="date" className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3" value={date} onChange={e=>setDate(e.target.value)}/>}/>{loading?<Loading/>:items.length===0?<EmptyState/>:<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{items.map(s=><div key={s._id} className="rounded-3xl border border-white/10 bg-white/[0.04] p-5"><h3 className="text-xl font-black">{s.movie?.title}</h3><p className="mt-2 text-slate-400">{s.hall?.name} · {dateOnly(s.showDate)} · {s.startTime}-{s.endTime}</p><div className="mt-3 flex gap-2"><StatusBadge value={s.hall?.screenType}/><StatusBadge value={s.status}/></div><p className="mt-3 font-bold text-red-200">{money(s.finalTicketPrice)}</p></div>)}</div>}</>};export default StaffShowtimesPage;
