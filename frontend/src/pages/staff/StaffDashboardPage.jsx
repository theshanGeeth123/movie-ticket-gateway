import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarDays, ScanLine, Ticket } from "lucide-react";
import api from "../../api/axios";
import Card from "../../components/ui/Card";
import Loading from "../../components/ui/Loading";
import PageHeader from "../../components/ui/PageHeader";
import { getErrorMessage, showTimeLabel } from "../../utils/formatters";

const StaffDashboardPage=()=>{const[data,setData]=useState(null),[loading,setLoading]=useState(true),[error,setError]=useState("");useEffect(()=>{(async()=>{try{const{data}=await api.get("/dashboard/staff/summary");setData(data);}catch(e){setError(getErrorMessage(e,"Failed to load dashboard"));}finally{setLoading(false);}})();},[]); if(loading)return <Loading/>; if(error)return <div className="text-red-200">{error}</div>; const s=data?.summary||{}; return <><PageHeader title="Staff Dashboard" subtitle="Verify tickets and monitor today's cinema operations." action={<Link to="/staff/verify" className="rounded-2xl bg-red-600 px-5 py-3 font-bold hover:bg-red-700"><ScanLine className="mr-2 inline h-5 w-5"/>Verify ticket</Link>}/><div className="grid gap-5 sm:grid-cols-3"><Card title="Today's showtimes" value={s.showtimes?.todayShowtimesCount||0} icon={CalendarDays}/><Card title="Active tickets" value={s.tickets?.activeTicketsCount||0} icon={Ticket}/><Card title="Checked by me today" value={s.tickets?.ticketsCheckedByMeTodayCount||0} icon={ScanLine}/></div><section className="mt-8"><Card><h2 className="mb-4 text-xl font-black">Today's showtimes</h2><div className="grid gap-3 md:grid-cols-2">{(data.todaysShowtimes||[]).map((x)=><div key={x._id} className="rounded-2xl bg-slate-950/70 p-4"><p className="font-bold">{x.movie?.title}</p><p className="text-sm text-slate-400">{x.hall?.name} · {showTimeLabel(x)}</p></div>)}</div></Card></section></>};
export default StaffDashboardPage;
