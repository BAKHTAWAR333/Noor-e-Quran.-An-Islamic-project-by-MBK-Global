import { useState, useEffect } from 'react';

interface Dua {
  arabic: string;
  translation: string;
  reference: string;
  category?: string;
}

const API_BASE = 'https://dus-api.fakcloud.tech';

export default function DuasSection() {
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [duas, setDuas] = useState<Dua[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDuasList, setShowDuasList] = useState(false);
  const [listTitle, setListTitle] = useState('');
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const searching = searchQuery.trim().length >= 2;
    setLoading(true);
    setError('');
    setDuas([]);
    setCategories([]);
    setShowDuasList(searching || selectedCategory !== null);
    const timer = setTimeout(async () => {
      try {
        const path = searching ? '/search?q=' + encodeURIComponent(searchQuery.trim()) : selectedCategory ? '/category?name=' + encodeURIComponent(selectedCategory) : '/categories';
        const res = await fetch(API_BASE + path, { signal: AbortSignal.any([controller.signal, AbortSignal.timeout(15000)]) });
        if (!res.ok) throw new Error('API request failed');
        const data = await res.json();
        if (!Array.isArray(data)) throw new Error('Invalid API response');
        if (controller.signal.aborted) return;
        if (searching || selectedCategory) {
          if (!data.every((dua: Dua) => typeof dua.arabic === 'string' && dua.arabic.trim())) throw new Error('Invalid dua content');
          setDuas(data);
          setListTitle(searching ? 'Search results' : selectedCategory!);
        } else {
          if (!data.every((category: unknown) => typeof category === 'string')) throw new Error('Invalid categories');
          setCategories(data);
        }
      } catch {
        if (!controller.signal.aborted) setError('Duas could not be loaded from the API. Please check your connection and retry.');
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, searching ? 300 : 0);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [searchQuery, selectedCategory, retry]);

  const loadCategory = (name: string) => { setSearchQuery(''); setSelectedCategory(name); };
  const handleSearch = (query: string) => { setSelectedCategory(null); setSearchQuery(query); };
  const clearSearch = () => { setSearchQuery(''); setSelectedCategory(null); };

  const copyDua = async (dua: Dua) => {
    const text = `${dua.arabic}\n\nTranslation: ${dua.translation}\n\nReference: ${dua.reference}`;
    try { await navigator.clipboard.writeText(text); showToast('Copied to clipboard!'); }
    catch { showToast('Unable to copy. Please try again.'); }
  };

  const showToast = (message: string) => {
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-full shadow-2xl z-[100] transition-opacity';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, 2000);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="text-center mb-10">
        <h1 className="text-3xl sm:text-4xl font-semibold text-emerald-950 mb-2">Supplications</h1>
        <p className="text-slate-500 text-lg">Browse and search duas from the API.</p>
      </div>

      {/* Search Bar */}
      <div className="mb-8 relative group">
        <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors">
          <i className="fas fa-search text-xl"></i>
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search keywords (e.g. travel, protection, morning)..."
          className="w-full p-5 pl-14 rounded-2xl border-none shadow-md focus:ring-4 focus:ring-emerald-500/20 outline-none text-lg transition-all"
        />
        {searchQuery.length >= 2 && (
          <div className="absolute right-5 top-1/2 -translate-y-1/2">
            <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-3 py-1 rounded-lg">
              SEARCH MODE
            </span>
          </div>
        )}
      </div>

      {/* Back Button */}
      {showDuasList && (
        <div className="mb-6">
          <button
            onClick={clearSearch}
            className="flex items-center gap-2 text-emerald-700 font-bold hover:gap-4 transition-all"
          >
            <i className="fas fa-arrow-left"></i> Back to Categories
          </button>
        </div>
      )}

      {/* Loading Spinner */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-emerald-600 mb-4"></div>
          <p className="text-emerald-600 font-medium">Loading duas...</p>
        </div>
      )}

      {/* Category Grid */}
      {error && <div role="alert" className="mb-6 rounded-xl border border-rose-200 bg-white p-5 text-sm"><p>{error}</p><button onClick={() => setRetry(value => value + 1)} className="mt-3 rounded-lg bg-emerald-900 px-4 py-3 text-white">Retry</button></div>}
      {!showDuasList && !loading && !error && categories.length === 0 && <p className="py-10 text-center text-slate-500">No categories returned by the API.</p>}
      {!showDuasList && !loading && !error && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {categories.map((cat) => (
            <div
              key={cat}
              onClick={() => loadCategory(cat)}
              className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 cursor-pointer hover:transform hover:-translate-y-1 hover:shadow-xl hover:border-emerald-400 hover:bg-emerald-50 transition-all duration-300"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-700">{cat}</h3>
                <div className="h-10 w-10 flex items-center justify-center bg-emerald-100 text-emerald-600 rounded-xl">
                  <i className="fas fa-folder-open"></i>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Duas List */}
      {showDuasList && !loading && !error && (
        <div className="space-y-6">
          <h2 className="text-2xl font-black text-emerald-900 mb-6 flex items-center gap-3">
            <span className="w-2 h-8 bg-emerald-500 rounded-full"></span> {listTitle}
          </h2>

          {duas.length === 0 ? (
            <div className="text-center py-10 text-slate-400">No matching Duas found.</div>
          ) : (
            duas.map((dua, index) => (
              <div key={index} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 relative group">
                <div className="flex justify-between items-start mb-4">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-100 px-2 py-1 rounded">
                    {dua.category}
                  </span>
                  <button
                    onClick={() => copyDua(dua)}
                    className="text-slate-300 hover:text-emerald-600 transition-colors"
                  >
                    <i className="far fa-copy text-lg"></i>
                  </button>
                </div>

                <p
                  className="font-['Amiri',serif] text-3xl text-right mb-8 text-slate-900 leading-[3.5rem]"
                  dir="rtl"
                >
                  {dua.arabic}
                </p>

                <div className="pt-5 border-t border-slate-100">
                  <p className="text-slate-600 leading-relaxed italic text-lg mb-4">
                    "{dua.translation}"
                  </p>

                  <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs">
                    <i className="fas fa-quote-left opacity-20"></i>
                    <span>{dua.reference}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
