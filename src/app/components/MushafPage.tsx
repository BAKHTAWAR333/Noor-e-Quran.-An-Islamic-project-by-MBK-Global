import { useEffect, useRef, useState } from "react";

interface PageVerse {
  verse_key: string;
  verse_number: number;
  text_uthmani: string;
  page_number: number;
  juz_number: number;
  words: { code_v2: string; line_number: number; page_number: number }[];
}

interface MushafPageProps {
  page: number;
  surahNumber: number;
  eager: boolean;
  surahs: { number: number; name: string }[];
}

function validPage(value: unknown, page: number): value is PageVerse[] {
  return Array.isArray(value) && value.length > 0 && value.every(verse => verse && typeof verse.verse_key === "string" && typeof verse.text_uthmani === "string" && verse.page_number === page && Array.isArray(verse.words) && verse.words.length > 0 && verse.words.every((word: PageVerse["words"][number]) => word && typeof word.code_v2 === "string" && word.code_v2.length > 0 && word.page_number === page && Number.isInteger(word.line_number)));
}

export default function MushafPage({ page, surahNumber, eager, surahs }: MushafPageProps) {
  const [verses, setVerses] = useState<PageVerse[]>([]);
  const [pageVerses, setPageVerses] = useState<PageVerse[]>([]);
  const [visible, setVisible] = useState(eager);
  const [bismillah, setBismillah] = useState("");
  const [font, setFont] = useState("");
  const [fontSize, setFontSize] = useState(0);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  const column = useRef<HTMLDivElement>(null);
  const article = useRef<HTMLElement>(null);

  useEffect(() => {
    if (visible) return;
    if (!("IntersectionObserver" in window)) { setVisible(true); return; }
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) {
        setVisible(true);
        observer.disconnect();
      }
    }, { rootMargin: "600px" });
    if (article.current) observer.observe(article.current);
    return () => observer.disconnect();
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    let active = true;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    setVerses([]);
    setFont("");
    setFontSize(0);
    setError(false);
    const family = `MushafPage${page}`;
    const load = async () => {
      let content: PageVerse[] | null = null;
      const key = `sukoon:quran:printed:${page}`;
      try {
        const stored = JSON.parse(localStorage.getItem(key) ?? "null");
        if (validPage(stored, page)) content = stored;
      } catch {}
      if (!content) {
        const response = await fetch(`https://api.qurancdn.com/api/qdc/verses/by_page/${page}?words=true&word_fields=code_v2,line_number,text_uthmani&fields=text_uthmani&per_page=50`, { signal: controller.signal });
        if (!response.ok) throw new Error("Page request failed");
        const data = await response.json();
        if (!validPage(data.verses, page) || data.pagination?.next_page) throw new Error("Incomplete mushaf page");
        content = data.verses;
        try { localStorage.setItem(key, JSON.stringify(content)); } catch {}
      }
      const face = new FontFace(family, `url(https://static.qurancdn.com/fonts/quran/hafs/v2/woff2/p${page}.woff2)`);
      const selectedVerses = content!.filter(verse => Number(verse.verse_key.split(":")[0]) === surahNumber);
      if (!selectedVerses.length) throw new Error("Surah content missing on this page");
      let openingText = "";
      if (surahNumber !== 1 && surahNumber !== 9 && selectedVerses.some(verse => verse.verse_number === 1)) {
        const openingResponse = await fetch("https://api.alquran.cloud/v1/ayah/1/quran-uthmani", { signal: controller.signal });
        if (!openingResponse.ok) throw new Error("Opening request failed");
        const opening = await openingResponse.json();
        if (opening.code !== 200 || typeof opening.data?.text !== "string") throw new Error("Invalid opening text");
        openingText = opening.data.text;
      }
      const loadedFace = await Promise.race([face.load(), new Promise<never>((_, reject) => { controller.signal.addEventListener("abort", () => reject(new Error("Page load timed out")), { once: true }); })]);
      if (!active || controller.signal.aborted) return;
      document.fonts.add(loadedFace);
      setPageVerses(content!);
      setVerses(selectedVerses);
      setBismillah(openingText);
      setFont(family);
    };
    load().catch(() => { if (active) setError(true); }).finally(() => clearTimeout(timeout));
    return () => { active = false; controller.abort(); clearTimeout(timeout); };
  }, [page, surahNumber, visible, retry]);

  const lines = new Map<number, { glyphs: string[]; starts: number[] }>();
  verses.forEach(verse => {
    verse.words.forEach((word, index) => {
      const line = lines.get(word.line_number) ?? { glyphs: [], starts: [] };
      if (verse.verse_number === 1 && index === 0) line.starts.push(Number(verse.verse_key.split(":")[0]));
      line.glyphs.push(word.code_v2);
      lines.set(word.line_number, line);
    });
  });

  useEffect(() => {
    const element = column.current;
    if (!element || !font || !verses.length) return;
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) return;
    context.font = `100px "${font}"`;
    const pageLines = new Map<number, string[]>();
    pageVerses.forEach(verse => verse.words.forEach(word => {
      const line = pageLines.get(word.line_number) ?? [];
      line.push(word.code_v2);
      pageLines.set(word.line_number, line);
    }));
    const longest = Math.max(...Array.from(pageLines.values(), glyphs => context.measureText(glyphs.join(" ")).width));
    const resize = () => setFontSize((element.clientWidth - 4) * 100 / longest);
    const observer = new ResizeObserver(resize);
    observer.observe(element);
    resize();
    return () => observer.disconnect();
  }, [font, verses, pageVerses]);

  const number = (value: number) => value.toLocaleString("ar-EG", { useGrouping: false });
  const firstSurah = Number(verses[0]?.verse_key.split(":")[0]);
  const name = surahs.find(surah => surah.number === firstSurah)?.name;

  return (
    <article ref={article} lang="ar" dir="rtl" aria-label={`Mushaf page ${page}`} className="mx-auto max-w-[680px] border border-emerald-900/20 bg-[#fffef9] p-1.5 sm:p-3">
      <div className="border border-emerald-900/20 px-3 py-5 sm:px-7 sm:py-7">
        {error ? <div role="alert" dir="ltr" className="py-16 text-center"><p className="text-sm text-slate-600">The printed Quran page could not load. Please try again.</p><button onClick={() => setRetry(value => value + 1)} className="mt-5 min-h-11 rounded-lg bg-emerald-900 px-5 text-sm text-white">Retry page</button></div> : <>
          <div className="mb-5 flex items-center justify-between gap-3 border-b border-emerald-900/15 pb-3 font-['Amiri',serif] text-sm text-emerald-900 sm:text-base"><span>{name}</span>{verses[0] && <span>الجزء {number(verses[0].juz_number)}</span>}</div>
          <div ref={column} className="min-w-0">
            {!font && <div role="status" dir="ltr" className="flex min-h-[400px] items-center justify-center text-sm text-slate-500 sm:min-h-[700px]">{visible ? "Loading Quran text…" : `Quran page ${page}`}</div>}
            {font && fontSize > 0 && <>
              <div aria-hidden="true" className="select-none" style={{ fontFamily: `"${font}"`, fontSize, lineHeight: 1.95 }}>
                {Array.from(lines, ([lineNumber, line]) => <div key={lineNumber}>
                  {line.starts.map(surahNumber => <div key={surahNumber} className="mb-3 mt-4 font-['Amiri',serif] text-center">
                    <h2 className="border-y border-emerald-900/20 bg-emerald-50/50 py-2 text-2xl leading-[1.8] text-emerald-950 sm:text-3xl">{surahs.find(surah => surah.number === surahNumber)?.name}</h2>
                    {surahNumber !== 1 && surahNumber !== 9 && <p className="mt-3 font-['Quran_Naskh',serif] text-[clamp(20px,4.5vw,30px)] leading-[2] text-[#172a21]">{bismillah}</p>}
                  </div>)}
                  <p data-mushaf-line={lineNumber} dir="rtl" className="whitespace-nowrap text-center tracking-normal text-[#172a21] [font-synthesis:none] [unicode-bidi:isolate]">{line.glyphs.join(" ")}</p>
                </div>)}
              </div>
              <div className="sr-only">{verses.map(verse => <p key={verse.verse_key} data-original-verse={verse.verse_key} dir="rtl">{verse.text_uthmani}</p>)}</div>
            </>}
          </div>
          <p className="mt-7 text-center font-['Amiri',serif] text-base text-emerald-900">{number(page)}</p>
        </>}
      </div>
    </article>
  );
}
