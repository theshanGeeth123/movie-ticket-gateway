import { useEffect, useState } from "react";
import { CalendarDays, CreditCard, Film, Ticket, Users, Warehouse } from "lucide-react";
import api from "../../api/axios";
import Card from "../../components/ui/Card";
import Loading from "../../components/ui/Loading";
import PageHeader from "../../components/ui/PageHeader";
import { getErrorMessage, money } from "../../utils/formatters";

const AdminDashboardPage = () => {
  const [data,setData]=useState(null); const [loading,setLoading]=useState(true); const [error,setError]=useState("");
  useEffect(()=>{(async()=>{try{const {data}=await api.get("/dashboard/admin/summary"); setData(data);}catch(err){setError(getErrorMessage(err,"Failed to load dashboard"));}finally{setLoading(false);}})();},[]);
  if(loading)return <Loading/>; if(error)return <div className="text-red-200">{error}</div>;
  const s=data?.summary||{};
  return <><PageHeader title="Admin Dashboard" subtitle="Monitor users, revenue, bookings, tickets, movies, halls and showtimes."/><div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3"> <Card title="Total revenue" value={money(s.revenue?.totalRevenue)} icon={CreditCard} subtitle="Confirmed paid bookings"/><Card title="Users" value={s.users?.totalUsers||0} icon={Users} subtitle={`${s.users?.totalCustomers||0} customers · ${s.users?.totalStaff||0} staff`}/><Card title="Movies" value={s.movies?.totalMovies||0} icon={Film} subtitle={`${s.movies?.activeMovies||0} active`}/><Card title="Halls" value={s.halls?.totalHalls||0} icon={Warehouse} subtitle={`${s.halls?.activeHalls||0} active`}/><Card title="Showtimes" value={s.showtimes?.totalShowtimes||0} icon={CalendarDays} subtitle={`${s.showtimes?.scheduledShowtimes||0} scheduled`}/><Card title="Tickets" value={s.tickets?.totalTickets||0} icon={Ticket} subtitle={`${s.tickets?.activeTickets||0} active · ${s.tickets?.usedTickets||0} used`}/></div><section className="mt-8 grid gap-5 lg:grid-cols-2"><Card><h2 className="mb-4 text-xl font-black">Latest bookings</h2><div className="space-y-3">{(data.latestBookings||[]).map((b)=><div key={b._id} className="rounded-2xl bg-slate-950/70 p-4"><p className="font-bold">{b.bookingReference}</p><p className="text-sm text-slate-400">{b.movie?.title} · {money(b.totalAmount)}</p></div>)}</div></Card><Card><h2 className="mb-4 text-xl font-black">Top movies</h2><div className="space-y-3">{(data.topMovies||[]).map((m)=><div key={m._id} className="rounded-2xl bg-slate-950/70 p-4"><p className="font-bold">{m.title}</p><p className="text-sm text-slate-400">{m.totalBookings||0} bookings · {money(m.totalRevenue)}</p></div>)}</div></Card></section></>;
};
export default AdminDashboardPage;
