import { useState, useEffect } from 'react';

interface Book {
  bookSlug: string;
  bookName: string;
  chapters_count: number;
  hadiths_count: number;
  description?: string;
}

interface Chapter {
  chapterNumber: number;
  name: string;
  hadiths_count: number | string;
}

interface Hadith {
  hadithNumber: number;
  englishNarrator?: string;
  hadithEnglish: string;
  hadithArabic?: string;
  hadithUrdu?: string;
}


const WORKER_URL = 'https://hdith-api.fakcloud.tech';

export default function HadithSection() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentState, setCurrentState] = useState(0); // 0=books, 1=chapters, 2=hadiths
  const [bookData, setBookData] = useState<Book[]>([]);
  const [selectedBookSlug, setSelectedBookSlug] = useState('');
  const [selectedBookName, setSelectedBookName] = useState('');
  const [chapterData, setChapterData] = useState<Chapter[]>([]);
  const [selectedChapterNumber, setSelectedChapterNumber] = useState('');
  const [selectedChapterName, setSelectedChapterName] = useState('');
  const [hadiths, setHadiths] = useState<Hadith[]>([]);
  const [currentHadithPage, setCurrentHadithPage] = useState(1);
  const [totalHadithPages, setTotalHadithPages] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);

  useEffect(() => {
    fetchBooks();
  }, []);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const container = document.getElementById('toast-container-hadith') || document.body;
    const toast = document.createElement('div');
    const colors = type === 'error' ? 'bg-gradient-to-r from-rose-500 to-rose-600' :
      type === 'info' ? 'bg-gradient-to-r from-blue-500 to-indigo-500' : 'bg-gradient-to-r from-emerald-600 to-teal-600';
    const icon = type === 'error' ? 'fa-circle-exclamation' : type === 'info' ? 'fa-circle-info' : 'fa-circle-check';
    toast.className = `${colors} text-white px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 fixed top-20 right-5 z-50`;
    toast.innerHTML = `<i class="fas ${icon} text-lg"></i> <span class="font-medium text-sm">${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  };

  const fetchBooks = async () => {
    setLoading(true);
    setError('');
    setBookData([]);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const response = await fetch(`${WORKER_URL}/books`, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();

      if (data.books && Array.isArray(data.books) && data.books.length > 0) {
        setBookData(data.books);
        showToast(`✅ Loaded ${data.books.length} Hadith books`, 'success');
      } else {
        throw new Error('Invalid data format');
      }
    } catch (error) {
      console.warn('API Error:', error);
      setError('Books could not be loaded from the API. Please retry.');
    } finally {
      setLoading(false);
    }
  };

  const selectBook = (slug: string, name: string) => {
    setSelectedBookSlug(slug);
    setSelectedBookName(name);
    setChapterData([]);
    setCurrentState(1);
    showToast(`📖 Selected: ${name} — loading chapters`, 'info');
    fetchChapters(slug);
  };

  const fetchChapters = async (bookSlug: string) => {
    setLoading(true);
    setError('');
    setChapterData([]);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      const response = await fetch(`${WORKER_URL}/${bookSlug}/chapters`, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();

      if (data.chapters && Array.isArray(data.chapters) && data.chapters.length > 0) {
        const formatted = data.chapters.map((ch: any) => ({
          name: ch.chapterEnglish || ch.chapterUrdu || ch.chapterArabic || `Chapter ${ch.chapterNumber}`,
          hadiths_count: ch.hadiths_count ?? '—',
          chapterNumber: ch.chapterNumber
        }));
        setChapterData(formatted);
        showToast(`📑 Loaded ${formatted.length} chapters`, 'success');
      } else {
        throw new Error('No chapters');
      }
    } catch (error) {
      setError('Chapters could not be loaded from the API. Please retry.');
    } finally {
      setLoading(false);
    }
  };

  const selectChapter = (chapterNum: string, chapterName: string) => {
    setSelectedChapterNumber(chapterNum);
    setSelectedChapterName(chapterName);
    setHadiths([]);
    setCurrentHadithPage(1);
    setCurrentState(2);
    showToast(`📖 Chapter ${chapterNum} selected — loading narrations`, 'info');
    fetchHadiths(chapterNum, 1, true);
  };

  const fetchHadiths = async (chapterNum: string, page: number, isReload: boolean) => {
    setLoading(true);
    setError('');
    try {
      const url = `${WORKER_URL}/hadiths?book=${selectedBookSlug}&chapter=${chapterNum}&page=${page}&paginate=8`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();

      if (data.hadiths?.data && data.hadiths.data.length > 0) {
        const hadithsArray = data.hadiths.data;
        const pagination = data.hadiths;

        if (isReload) {
          setHadiths(hadithsArray);
        } else {
          setHadiths(prev => [...prev, ...hadithsArray]);
        }

        setCurrentHadithPage(pagination.current_page);
        setTotalHadithPages(pagination.last_page);
        setHasNextPage(!!pagination.next_page_url);
        showToast(`Displaying page ${pagination.current_page} of ${pagination.last_page}`, 'info');
      } else {
        throw new Error('No data');
      }
    } catch (error) {
      setError('Hadiths could not be loaded from the API. Please retry.');
    } finally {
      setLoading(false);
    }
  };

  const loadMoreHadiths = () => {
    if (hasNextPage) {
      fetchHadiths(selectedChapterNumber, currentHadithPage + 1, false);
    }
  };

  const displayBooks = bookData;
  const displayChapters = chapterData;

  return (
    <div className="container mx-auto px-4 sm:px-8 py-7 sm:py-10 max-w-7xl">
      <div id="toast-container-hadith"></div>
      {loading && <p role="status" className="py-6 text-center text-emerald-800">Loading from API…</p>}
      {error && <div role="alert" className="mb-6 rounded-xl border border-rose-200 bg-white p-5 text-sm"><p>{error}</p><button onClick={() => currentState === 0 ? fetchBooks() : currentState === 1 ? fetchChapters(selectedBookSlug) : fetchHadiths(selectedChapterNumber, hadiths.length ? currentHadithPage + 1 : 1, !hadiths.length)} className="mt-3 rounded-lg bg-emerald-900 px-4 py-3 text-white">Retry</button></div>}

      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-full text-emerald-700 text-sm font-semibold mb-4">
          <i className="fas fa-star-of-life text-xs"></i>
          <span>Hadith Collections</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-semibold text-emerald-950 mb-3">
          Hadith Explorer
        </h1>
        <p className="text-slate-500 max-w-2xl mx-auto text-lg">
          Explore Hadith collections provided by the API
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center mb-10 gap-2 md:gap-4">
        <div className="flex items-center gap-1 md:gap-3 flex-wrap justify-center">
          {[
            { name: 'Select Book', icon: 'fa-book', state: 0 },
            { name: 'Choose Chapter', icon: 'fa-list-ol', state: 1 },
            { name: 'Read Hadiths', icon: 'fa-quran', state: 2 }
          ].map((step, idx) => (
            <div key={idx} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 shadow-md ${currentState === step.state
                      ? 'bg-emerald-600 text-white shadow-emerald-300'
                      : currentState > step.state
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-300 text-slate-600'
                    }`}
                >
                  <i className={`fas ${step.icon} text-sm`}></i>
                </div>
                <span
                  className={`text-xs mt-1 font-medium ${currentState === step.state ? 'text-emerald-700' : 'text-slate-400'} hidden sm:block`}
                >
                  {step.name}
                </span>
              </div>
              {idx < 2 && <i className="fas fa-chevron-right text-slate-300 text-xs mx-1 md:mx-2"></i>}
            </div>
          ))}
        </div>
      </div>

      {/* STEP 1: Book Selection */}
      {currentState === 0 && (
        <div className="bg-white/95 rounded-2xl shadow-xl overflow-hidden border border-emerald-100/50">
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 px-6 py-5 border-b border-emerald-100">
            <div className="flex justify-between items-center flex-wrap gap-3">
              <div>
                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                  <i className="fas fa-book-open text-emerald-600"></i> Select a Hadith Collection
                </h2>
                <p className="text-slate-500 text-sm mt-1">
                  Choose from 9 authentic books (Kutub al-Sittah + 3 major collections)
                </p>
              </div>
              <button
                onClick={fetchBooks}
                className="text-sm bg-white/70 hover:bg-white text-slate-600 px-4 py-2 rounded-xl transition flex items-center gap-2"
              >
                <i className="fas fa-sync-alt"></i> Refresh
              </button>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 max-h-[65vh] overflow-y-auto pr-2">
              {displayBooks.map((book) => (
                <div
                  key={book.bookSlug}
                  onClick={() => selectBook(book.bookSlug, book.bookName)}
                  className="bg-white hover:bg-gradient-to-br hover:from-white hover:to-emerald-50 rounded-xl p-5 cursor-pointer border border-slate-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200"
                >
                  <div className="flex items-start justify-between">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-100/70 to-emerald-50/50 flex items-center justify-center text-emerald-700">
                      <i className="fas fa-book text-xl"></i>
                    </div>
                    <i className="fas fa-chevron-right text-slate-300 text-sm mt-2"></i>
                  </div>
                  <h3 className="font-bold text-lg text-slate-800 mt-3">{book.bookName}</h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                    {book.description}
                  </p>
                  <div className="flex gap-3 mt-3 text-xs text-slate-500">
                    <span>
                      <i className="far fa-copy"></i> {book.chapters_count ?? '—'} Chapters
                    </span>
                    <span>
                      <i className="fas fa-hashtag"></i> {book.hadiths_count?.toLocaleString() || '?'} Hadiths
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: Chapter Selection */}
      {currentState === 1 && (
        <div className="bg-white/95 rounded-2xl shadow-xl overflow-hidden border border-blue-100/50">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-5 border-b border-blue-100">
            <div className="flex justify-between items-center flex-wrap gap-3">
              <div>
                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                  <i className="fas fa-layer-group text-blue-600"></i> Chapters of{' '}
                  <span className="text-emerald-700">{selectedBookName}</span>
                </h2>
                <p className="text-slate-500 text-sm mt-1">Select a chapter to view narrations</p>
              </div>
              <button
                onClick={() => setCurrentState(0)}
                className="bg-white/70 hover:bg-white text-slate-600 px-4 py-2 rounded-xl text-sm shadow-sm flex items-center gap-2"
              >
                <i className="fas fa-arrow-left"></i> Back to Books
              </button>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 max-h-[60vh] overflow-y-auto pr-2">
              {displayChapters.slice(0, 60).map((ch) => (
                <div
                  key={ch.chapterNumber}
                  onClick={() => selectChapter(String(ch.chapterNumber), ch.name)}
                  className="bg-white rounded-xl p-4 text-center cursor-pointer hover:shadow-md transition-all border border-slate-100 hover:border-blue-300"
                >
                  <span className="text-2xl font-bold text-blue-600">{ch.chapterNumber}</span>
                  <p className="text-xs text-slate-600 font-medium mt-2 line-clamp-2">{ch.name || 'Chapter'}</p>
                  <span className="inline-block mt-2 text-xs bg-slate-100 px-2 py-0.5 rounded-full text-slate-500">
                    {ch.hadiths_count} narrations
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: Hadith Display */}
      {currentState === 2 && (
        <div className="bg-white/95 rounded-2xl shadow-xl overflow-hidden border border-amber-100/50">
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 px-6 py-5 border-b border-amber-100">
            <div className="flex flex-wrap justify-between items-center gap-3">
              <div>
                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                  <i className="fas fa-scroll text-amber-600"></i> Hadith Narrations
                </h2>
                <p className="text-slate-500 text-sm">
                  <span className="font-semibold">{selectedBookName}</span> · Chapter {selectedChapterNumber}:{' '}
                  {selectedChapterName || 'Selected Chapter'}
                </p>
              </div>
              <button
                onClick={() => setCurrentState(1)}
                className="bg-white/80 hover:bg-white text-slate-600 px-4 py-2 rounded-xl text-sm shadow-sm flex items-center gap-2"
              >
                <i className="fas fa-arrow-left"></i> Back to Chapters
              </button>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-6 max-h-[65vh] overflow-y-auto pr-2">
              {hadiths.length === 0 && loading ? (
                <div className="text-center py-12">
                  <i className="fas fa-spinner fa-spin text-3xl text-emerald-500"></i>
                  <p className="mt-3">Loading blessed narrations...</p>
                </div>
              ) : (
                hadiths.map((hadith) => (
                  <div
                    key={hadith.hadithNumber}
                    className="bg-white rounded-xl p-5 shadow-sm border-l-4 border-emerald-400 hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full">
                        #{hadith.hadithNumber}
                      </span>
                      <i className="fas fa-quote-right text-emerald-200 text-xl"></i>
                    </div>
                    {hadith.englishNarrator && (
                      <div className="flex items-center gap-2 text-sm bg-amber-50 inline-block px-3 py-1.5 rounded-full text-amber-700 mb-3">
                        <i className="fas fa-user-circle"></i>
                        <span>{hadith.englishNarrator}</span>
                      </div>
                    )}
                    <p className="text-slate-700 leading-relaxed text-base">
                      {hadith.hadithEnglish || 'Text not available.'}
                    </p>
                    {hadith.hadithArabic && (
                      <p
                        className="font-['Amiri',serif] text-right text-emerald-800 mt-4 pt-3 border-t border-slate-100 text-xl leading-[1.9]"
                        dir="rtl"
                      >
                        {hadith.hadithArabic}
                      </p>
                    )}
                    {hadith.hadithUrdu && (
                      <p className="text-sm text-slate-500 mt-3 border-t pt-2">
                        <span className="font-semibold">اردو:</span> {hadith.hadithUrdu}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
            {hadiths.length > 0 && (
              <div className="mt-6 flex justify-center">
                <button
                  onClick={loadMoreHadiths}
                  disabled={!hasNextPage || loading}
                  className="bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-700 font-semibold py-3 px-8 rounded-xl transition-all flex items-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {hasNextPage ? (
                    <>
                      <i className="fas fa-arrow-down"></i> Page {currentHadithPage + 1}
                    </>
                  ) : (
                    <>
                      <i className="fas fa-check-circle"></i> Complete Chapter
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
