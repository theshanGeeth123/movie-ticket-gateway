import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search } from "lucide-react";
import api from "../../api/axios";
import EmptyState from "../../components/ui/EmptyState";
import Loading from "../../components/ui/Loading";
import Pagination from "../../components/ui/Pagination";
import StatusBadge from "../../components/ui/StatusBadge";
import { getErrorMessage, imageUrl } from "../../utils/formatters";

const MoviesPage = ({ embedded = false }) => {
  const [movies,setMovies]=useState([]); const [loading,setLoading]=useState(true); const [error,setError]=useState(""); const [page,setPage]=useState(1); const [pages,setPages]=useState(1); const [search,setSearch]=useState("");
  const fetchMovies=async()=>{setLoading(true); setError(""); try{const {data}=await api.get("/movies/public",{params:{page,limit:8,search:search||undefined}}); setMovies(data.movies||[]); setPages(data.pages||1);}catch(err){setError(getErrorMessage(err,"Failed to load movies"));}finally{setLoading(false);}};
  useEffect(()=>{fetchMovies();},[page]);
  const onSearch=(e)=>{e.preventDefault(); setPage(1); fetchMovies();};
  return <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
    <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
      <div><p className="text-sm font-bold uppercase tracking-[0.25em] text-red-300">Now showing</p><h2 className="mt-2 text-3xl font-black text-white">Available Movies</h2></div>
      <form onSubmit={onSearch} className="flex w-full max-w-md gap-2"><input className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none focus:border-red-500" placeholder="Search movie, genre, language" value={search} onChange={(e)=>setSearch(e.target.value)} /><button className="rounded-2xl bg-red-600 px-4"><Search className="h-5 w-5"/></button></form>
    </div>
    {error&&<div className="mb-5 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-200">{error}</div>}
    {loading?<Loading label="Loading movies..."/>:movies.length===0?<EmptyState title="No movies found"/>:<div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{movies.map((movie)=><Link to={`/movies/${movie._id}`} key={movie._id} className="group overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] shadow-xl transition hover:-translate-y-1 hover:border-red-500/40"><div className="aspect-[2/3] bg-slate-900">{imageUrl(movie)?<img className="h-full w-full object-cover transition duration-500 group-hover:scale-105" src={imageUrl(movie)} alt={movie.title}/>:<div className="flex h-full items-center justify-center text-slate-600">No image</div>}</div><div className="p-4"><div className="mb-2 flex gap-2"><StatusBadge value={movie.format}/><StatusBadge value={movie.isActive!==false?"active":"inactive"}/></div><h3 className="line-clamp-1 text-lg font-black text-white">{movie.title}</h3><p className="mt-1 line-clamp-1 text-sm text-slate-400">{movie.genre} · {movie.language} · {movie.duration} min</p></div></Link>)}</div>}
    {!embedded&&<Pagination page={page} pages={pages} onPageChange={setPage}/>} {embedded&&<div className="mt-8 text-center"><Link to="/movies" className="rounded-2xl border border-white/10 px-6 py-3 font-bold hover:bg-white/5">View all movies</Link></div>}
  </section>;
};
export default MoviesPage;
