import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Search, Play, Pause, X, Headphones, RefreshCw } from "lucide-react";
import MushafPage from "./MushafPage";

interface Surah {
  number: number;
  name: string;
  englishName: string;
  numberOfAyahs: number;
  revelationType: string;
}
interface SurahData extends Surah {
  ayahs: { number: number; numberInSurah: number; text: string; page: number; juz: number }[];
}

function isSurah(value: unknown): value is Surah {
  if (!value || typeof value !== "object") return false;
  const surah = value as Surah;
  return Number.isInteger(surah.number) && surah.number >= 1 && surah.number <= 114 && typeof surah.name === "string" && typeof surah.englishName === "string" && typeof surah.revelationType === "string" && Number.isInteger(surah.numberOfAyahs);
}

function validQuranData(path: string, value: unknown): boolean {
  if (path === "surah") return Array.isArray(value) && value.length > 0 && value.every(isSurah);
  if (!isSurah(value)) return false;
  const surah = value as SurahData;
  return Array.isArray(surah.ayahs) && surah.ayahs.length === surah.numberOfAyahs && surah.ayahs.every(ayah => ayah && typeof ayah.text === "string" && Number.isInteger(ayah.number) && Number.isInteger(ayah.numberInSurah) && Number.isInteger(ayah.page) && Number.isInteger(ayah.juz));
}

async function getQuran<T>(path: string): Promise<T> {
  const key = `sukoon:quran:${path}`;
  try {
    const cached = localStorage.getItem(key);
    if (cached) {
      const value = JSON.parse(cached);
      if (validQuranData(path, value)) return value;
      localStorage.removeItem(key);
    }
  } catch {}
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch(`https://api.alquran.cloud/v1/${path}`, { signal: controller.signal });
    if (!response.ok) throw new Error("Unable to connect to the Quran library.");
    const result = await response.json();
    if (result.code !== 200 || !validQuranData(path, result.data)) throw new Error("Quran content could not be loaded.");
    try { localStorage.setItem(key, JSON.stringify(result.data)); } catch {}
    return result.data;
  } finally {
    clearTimeout(timer);
  }
}

export default function QuranSection({ onReaderChange }: { onReaderChange: (reading: boolean) => void }) {
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [currentSurah, setCurrentSurah] = useState<SurahData | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [revelation, setRevelation] = useState("All");
  const [playing, setPlaying] = useState(false);
  const [playerTitle, setPlayerTitle] = useState("");
  const audio = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    onReaderChange(selected !== null);
  }, [selected, onReaderChange]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    if (selected) setCurrentSurah(null);
    const request = selected ? getQuran<SurahData>(`surah/${selected}/quran-uthmani`) : getQuran<Surah[]>("surah");
    request.then(data => {
      if (!active) return;
      if (selected) setCurrentSurah(data as SurahData);
      else setSurahs(data as Surah[]);
    }).catch(() => { if (active) setError("Content could not be loaded. Please check your connection and try again. Previously opened surahs are available offline."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [selected, retry]);

  useEffect(() => { const timer = setTimeout(() => setSearch(query.trim()), 300); return () => clearTimeout(timer); }, [query]);
  useEffect(() => () => { if (audio.current) { audio.current.pause(); audio.current.src = ""; } }, []);

  const openSurah = (number: number | null) => {
    audio.current?.pause();
    setPlaying(false);
    setPlayerTitle("");
    setSelected(number);
    window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
  };
  const listen = async () => {
    if (!currentSurah) return;
    if (audio.current && playerTitle) {
      if (playing) { audio.current.pause(); setPlaying(false); return; }
    } else {
      audio.current = new Audio(`https://download.quranicaudio.com/quran/mishaari_raashid_al_3afaasee/${String(currentSurah.number).padStart(3, "0")}.mp3`);
      audio.current.onended = () => setPlaying(false);
      audio.current.onerror = () => { setPlaying(false); setError("Recitation could not be played. Please try again."); };
      setPlayerTitle(currentSurah.englishName);
    }
    try { await audio.current!.play(); setPlaying(true); } catch { setError("Recitation could not be played. Please try again."); setPlaying(false); }
  };
  const filtered = surahs.filter(surah => (revelation === "All" || surah.revelationType === revelation) && (surah.englishName.toLowerCase().includes(search.toLowerCase()) || surah.name.includes(search) || String(surah.number) === search));
  const pages = currentSurah ? Array.from(new Set(currentSurah.ayahs.map(ayah => ayah.page))) : [];

  return (
    <section className={`px-4 py-7 sm:px-8 sm:py-10 ${playerTitle ? "pb-28 sm:pb-28" : ""}`}>
      {selected === null ? <>
        <div id="surah-library" className="scroll-mt-6">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-5"><div><h1 className="text-2xl font-semibold text-emerald-950 sm:text-3xl">Surah library</h1><p className="mt-2 text-[13px] leading-6 text-slate-500">Choose a surah to read in full.</p></div>
            <div className="relative w-full sm:w-80"><Search className="absolute top-3.5 left-4 size-4 text-slate-400" /><input aria-label="Search surahs" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search by name or number" className="h-11 w-full rounded-lg border border-border bg-white pr-11 pl-11 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100" />{query && <button aria-label="Clear search" onClick={() => setQuery("")} className="absolute top-0 right-0 flex size-11 items-center justify-center text-slate-500"><X size={15} /></button>}</div>
          </div>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4"><div role="group" aria-label="Filter by revelation" className="flex gap-1 rounded-lg border border-border bg-white p-1">{["All", "Meccan", "Medinan"].map(filter => <button key={filter} aria-pressed={revelation === filter} onClick={() => setRevelation(filter)} className={`min-h-11 rounded-md px-3 text-xs font-medium transition ${revelation === filter ? "bg-emerald-900 text-white" : "text-slate-500 hover:bg-emerald-50 hover:text-emerald-900"}`}>{filter === "All" ? "All surahs" : filter}</button>)}</div>{!loading && !error && <p aria-live="polite" className="text-[11px] text-slate-500">{filtered.length} of {surahs.length} surahs</p>}</div>
          {!loading && <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">{filtered.map(surah => <button key={surah.number} onClick={() => openSurah(surah.number)} className="group flex min-h-24 min-w-0 items-center gap-3 rounded-xl border border-border bg-white px-3.5 py-5 text-left transition-colors hover:border-emerald-600/40 hover:bg-emerald-50/50 active:bg-emerald-50 sm:px-4">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-emerald-900/10 text-xs font-medium tabular-nums text-emerald-800 transition-colors group-hover:bg-emerald-900 group-hover:text-white">{String(surah.number).padStart(2, "0")}</span>
            <span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-slate-800 [overflow-wrap:anywhere]">{surah.englishName}</span><span className="mt-1.5 block text-[11px] leading-5 text-slate-500">{surah.revelationType} <span className="px-1 text-slate-300">·</span> {surah.numberOfAyahs} ayahs</span></span>
            <span lang="ar" dir="rtl" className="max-w-[38%] shrink-0 font-['Amiri',serif] text-[25px] leading-[1.8] text-emerald-800">{surah.name.replace(/^سُورَةُ\s*/, "")}</span>
          </button>)}</div>}
        </div>
        {!loading && !error && filtered.length === 0 && <p className="py-12 text-center text-sm text-slate-500">No surahs match your search.</p>}
      </> : <>
        <div className="mx-auto mb-6 flex max-w-[680px] flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-white px-3 py-2 sm:px-5">
          <button onClick={() => openSurah(null)} className="flex min-h-11 items-center gap-2 text-sm text-emerald-800"><ArrowLeft size={17} />Surah library</button>
          <button onClick={listen} disabled={!currentSurah} className="flex min-h-11 items-center gap-2 rounded-lg bg-emerald-900 px-4 text-xs font-medium text-white disabled:opacity-50"><Headphones size={16} />{playing ? "Pause" : "Listen"}</button>
        </div>
        {currentSurah && <>
          <div className="mx-auto mb-6 flex max-w-[680px] flex-wrap items-center justify-between gap-3">
            <div><h1 className="text-xl font-semibold text-emerald-950">{currentSurah.englishName}</h1><p className="mt-1 text-xs text-slate-500">{currentSurah.revelationType} · {currentSurah.numberOfAyahs} ayahs · Arabic reading</p></div>
            <span className="rounded-full border border-emerald-900/10 bg-emerald-50 px-3 py-1.5 text-[11px] font-medium text-emerald-800">Complete surah</span>
          </div>
          <div className="space-y-6 sm:space-y-10">{pages.map((page, index) => <MushafPage key={`${selected}:${page}`} page={page} surahNumber={currentSurah.number} eager={index === 0} surahs={surahs} />)}</div>
          <p className="mx-auto mt-6 max-w-3xl text-center text-xs text-emerald-800">End of {currentSurah.englishName}</p>
          <div className="mx-auto mt-8 flex max-w-[680px] items-center justify-between gap-3 border-t border-border pt-4 text-xs text-emerald-800"><button disabled={selected === 1} onClick={() => openSurah(selected - 1)} className="flex min-h-11 items-center gap-2 disabled:opacity-30"><ArrowLeft size={16} />Previous surah</button><button disabled={selected === 114} onClick={() => openSurah(selected + 1)} className="flex min-h-11 items-center gap-2 disabled:opacity-30">Next surah<ArrowRight size={16} /></button></div>
        </>}
      </>}
      {loading && <div role="status" className="flex min-h-60 flex-col items-center justify-center gap-4"><div className="size-8 animate-spin rounded-full border-2 border-emerald-100 border-t-emerald-700" /><p className="text-sm text-slate-500">Loading Quran…</p></div>}
      {error && <div role="alert" className="my-6 rounded-xl border border-rose-100 bg-white p-5 text-sm text-slate-600"><p>{error}</p><button onClick={() => { if (error.startsWith("Recitation")) { setError(""); audio.current = null; setPlayerTitle(""); } else setRetry(value => value + 1); }} className="mt-3 flex min-h-11 items-center gap-2 font-medium text-emerald-800"><RefreshCw size={15} />Try again</button></div>}
      {playerTitle && <div className="fixed right-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] left-4 z-40 mx-auto flex max-w-md items-center gap-3 rounded-xl border border-border bg-white p-3 shadow-lg"><button aria-label={playing ? "Pause recitation" : "Play recitation"} onClick={listen} className="flex size-11 shrink-0 items-center justify-center rounded-full bg-emerald-900 text-white">{playing ? <Pause size={18} /> : <Play size={18} />}</button><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{playerTitle}</p><p className="text-xs text-slate-500">Mishary Alafasy</p></div><button aria-label="Close audio player" onClick={() => { audio.current?.pause(); audio.current = null; setPlaying(false); setPlayerTitle(""); }} className="flex size-11 shrink-0 items-center justify-center text-slate-500"><X size={18} /></button></div>}
    </section>
  );
}
