import { useState, useEffect } from 'react';

interface Name {
  number: number;
  name: string;
  transliteration: string;
  en: {
    meaning: string;
  };
}


export default function NamesSection() {
  const [names, setNames] = useState<Name[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [counters, setCounters] = useState<Record<number, number>>({});
  const [randomName, setRandomName] = useState<Name | null>(null);

  useEffect(() => {
    fetchNames();
    loadCounters();
  }, []);

  const fetchNames = async () => {
    setLoading(true);
    setError('');
    setNames([]);
    setRandomName(null);
    try {
      const response = await fetch('https://api.aladhan.com/v1/asmaAlHusna', { signal: AbortSignal.timeout(15000) });
      if (!response.ok) throw new Error('Names API failed');
      const data = await response.json();
      if (data.code === 200 && Array.isArray(data.data) && data.data.every((name: Name) => name.name && name.transliteration && name.en?.meaning)) {
        setNames(data.data);
        if (data.data.length) setRandomName(data.data[Math.floor(Date.now() / 86400000) % data.data.length]);
      } else {
        throw new Error('Invalid Names API response');
      }
    } catch (error) {
      console.error('Error fetching names:', error);
      setError('Names could not be loaded from the API. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadCounters = () => {
    try {
    const saved = localStorage.getItem('dhikrCounters');
    if (saved) {
      setCounters(JSON.parse(saved));
    }
    } catch { setCounters({}); }
  };

  const saveCounters = (newCounters: Record<number, number>) => {
    try { localStorage.setItem('dhikrCounters', JSON.stringify(newCounters)); } catch {}
  };

  const incrementCounter = (number: number) => {
    const newCounters = { ...counters, [number]: (counters[number] || 0) + 1 };
    setCounters(newCounters);
    saveCounters(newCounters);
  };

  const resetCounter = (number: number) => {
    const newCounters = { ...counters };
    delete newCounters[number];
    setCounters(newCounters);
    saveCounters(newCounters);
  };

  const filteredNames = names.filter(n =>
    n.transliteration.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.en.meaning.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.number.toString() === searchQuery
  );

  return (
    <div className="container mx-auto px-4 py-7 sm:px-8 sm:py-10">
      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-extrabold text-emerald-900 mb-2">✨ Asma-ul-Husna</h1>
        <p className="text-slate-500 text-lg">The 99 Beautiful Names of Allah</p>
      </div>

      {/* Random Name of the Day */}
      {randomName && (
        <div className="max-w-md mx-auto mb-8 bg-emerald-900 text-white rounded-2xl p-6">
          <div className="text-center">
            <p className="text-sm font-semibold mb-2 opacity-90">Name of the Day</p>
            <p className="font-['Amiri',serif] text-4xl mb-2">{randomName.name}</p>
            <p className="text-xl font-bold mb-1">{randomName.transliteration}</p>
            <p className="text-sm opacity-90">"{randomName.en.meaning}"</p>
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="max-w-md mx-auto mb-8 relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search (e.g. Rahman, Mercy...)"
          className="w-full px-5 py-3 pl-12 rounded-full border border-slate-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
        />
        <i className="fas fa-search absolute left-4 top-4 text-slate-400"></i>
      </div>

      {/* Names Grid */}
      {loading ? (
        <div className="grid grid-cols-1 min-[400px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 border border-slate-100 animate-pulse">
              <div className="h-4 bg-slate-200 w-8 mb-4 rounded"></div>
              <div className="h-10 bg-slate-200 w-24 mx-auto mb-3 rounded"></div>
              <div className="h-4 bg-slate-200 w-32 mx-auto mb-2 rounded"></div>
              <div className="h-3 bg-slate-200 w-20 mx-auto rounded"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 min-[400px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredNames.map((name) => (
            <div
              key={name.number}
              className="bg-white rounded-2xl p-6 text-center border border-slate-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 hover:border-emerald-500 relative overflow-hidden group"
            >
              <span className="absolute top-2 left-3 text-xs font-bold text-slate-300 font-mono">
                #{name.number}
              </span>

              <h2 className="font-['Amiri',serif] text-3xl md:text-4xl text-emerald-800 mb-2 mt-2 group-hover:scale-110 transition-transform duration-300">
                {name.name}
              </h2>

              <h3 className="text-lg font-bold text-slate-800 mb-1">
                {name.transliteration}
              </h3>

              <p className="text-sm text-slate-500 italic mb-3">
                "{name.en.meaning}"
              </p>

              {/* Counter */}
              <div className="mt-4 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={() => incrementCounter(name.number)}
                    className="w-8 h-8 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 rounded-full flex items-center justify-center transition active:scale-90"
                  >
                    <i className="fas fa-plus text-sm"></i>
                  </button>
                  <span className="text-emerald-700 font-bold min-w-[3rem] text-center">
                    {counters[name.number] || 0}
                  </span>
                  {counters[name.number] > 0 && (
                    <button
                      onClick={() => resetCounter(name.number)}
                      className="w-8 h-8 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full flex items-center justify-center transition active:scale-90"
                    >
                      <i className="fas fa-redo text-xs"></i>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {error && <div role="alert" className="my-6 rounded-xl border border-rose-200 bg-white p-5 text-sm"><p>{error}</p><button onClick={fetchNames} className="mt-3 rounded-lg bg-emerald-900 px-4 py-3 text-white">Retry</button></div>}
      {filteredNames.length === 0 && !loading && !error && (
        <div className="text-center py-10 text-slate-400">No names found matching your search.</div>
      )}

    </div>
  );
}
