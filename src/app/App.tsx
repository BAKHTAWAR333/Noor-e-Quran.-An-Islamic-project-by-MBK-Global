import { Component, useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { createHashRouter, Link, NavLink, Outlet, RouterProvider, useLocation, useOutletContext } from "react-router";
import { Heart, Phone, Mail, ArrowUpRight, Menu, X, ArrowRight, MessageCircle, CheckCircle2 } from "lucide-react";
import QuranSection from "./components/QuranSection";

const navigation = [
  { path: "/", label: "Quran" },
  { path: "/about", label: "About" },
  { path: "/reading-guide", label: "Reading guide" },
  { path: "/contact", label: "Contact" },
  { path: "/request-website", label: "Request a website" },
];

type ReaderContext = { setReading: (reading: boolean) => void };

class QuranErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean; attempt: number }> {
  state = { failed: false, attempt: 0 };
  static getDerivedStateFromError() { return { failed: true }; }
  retry = () => {
    try { Object.keys(localStorage).filter(key => key.startsWith("sukoon:quran:")).forEach(key => localStorage.removeItem(key)); } catch {}
    this.setState(state => ({ failed: false, attempt: state.attempt + 1 }));
  };
  render() {
    if (this.state.failed) return <section role="alert" className="mx-4 my-10 rounded-xl border border-border bg-white p-8 text-center sm:mx-8"><h1 className="text-2xl font-semibold text-emerald-950">Quran reader could not open</h1><p className="mt-3 text-sm leading-7 text-slate-600">Please retry to clear the saved Quran cache and load the content again.</p><button onClick={this.retry} className="mt-6 min-h-11 rounded-lg bg-emerald-900 px-6 text-sm font-medium text-white">Reload Quran</button></section>;
    return <div key={this.state.attempt}>{this.props.children}</div>;
  }
}

function SiteLayout() {
  const [reading, setReading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const { pathname } = useLocation();

  useEffect(() => {
    setReading(false);
    setMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "instant" });
    const title = navigation.find(link => link.path === pathname)?.label ?? "Page not found";
    document.title = `${title} | Noor-e-Quran · MBK Global`;
  }, [pathname]);

  useEffect(() => { if (reading) setMenuOpen(false); }, [reading]);
  useEffect(() => {
    if (!menuOpen) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        menuButton.current?.focus();
      }
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [menuOpen]);

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1024px)");
    const close = () => { if (desktop.matches) setMenuOpen(false); };
    desktop.addEventListener("change", close);
    return () => desktop.removeEventListener("change", close);
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-[#f5f7f6] font-['Inter',sans-serif] text-[#18342b] selection:bg-emerald-100 [&_a]:focus-visible:outline-2 [&_a]:focus-visible:outline-offset-4 [&_a]:focus-visible:outline-emerald-700 [&_button]:focus-visible:outline-2 [&_button]:focus-visible:outline-offset-4 [&_button]:focus-visible:outline-emerald-700">
      {!reading && <header className="sticky top-0 z-30 border-b border-border bg-white">
        <a href="#main-content" onClick={event => { event.preventDefault(); document.getElementById("main-content")?.focus(); }} className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-4 focus:z-50 focus:rounded-lg focus:bg-emerald-900 focus:px-4 focus:py-3 focus:text-white">Skip to content</a>
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-8">
          <Link to="/" aria-label="Noor-e-Quran, home" className="min-w-0 py-1"><p className="text-lg font-semibold leading-6 text-emerald-950 sm:text-xl">Noor-e-Quran<span className="text-emerald-600">.</span></p><p className="text-[9px] leading-4 tracking-[0.04em] text-slate-500">An Islamic project by MBK Global</p></Link>
          <nav aria-label="Main navigation" className="hidden items-center gap-1 lg:flex">{navigation.map(link => <NavLink key={link.path} to={link.path} end={link.path === "/"} className={({ isActive }) => `flex min-h-11 items-center rounded-md px-3 text-xs font-medium transition-colors ${isActive ? "bg-emerald-50 text-emerald-900" : "text-slate-600 hover:bg-slate-50 hover:text-emerald-900"}`}>{link.label}{link.path === "/contact" && <ArrowUpRight size={13} className="ml-2" />}</NavLink>)}</nav>
          <button ref={menuButton} aria-label={menuOpen ? "Close navigation" : "Open navigation"} aria-expanded={menuOpen} aria-controls="mobile-navigation" onClick={() => setMenuOpen(open => !open)} className="flex size-11 shrink-0 items-center justify-center rounded-lg border border-border text-emerald-900 transition-colors hover:bg-emerald-50 lg:hidden">{menuOpen ? <X size={19} strokeWidth={1.6} /> : <Menu size={19} strokeWidth={1.6} />}</button>
        </div>
        <nav id="mobile-navigation" aria-label="Mobile navigation" hidden={!menuOpen} className="border-t border-border px-4 py-3 lg:hidden"><div className="mx-auto grid max-w-6xl grid-cols-2 gap-2">{navigation.map(link => <NavLink key={link.path} to={link.path} end={link.path === "/"} onClick={() => setMenuOpen(false)} className={({ isActive }) => `flex min-h-12 items-center justify-between rounded-lg px-4 text-sm font-medium ${isActive ? "bg-emerald-50 text-emerald-900" : "text-slate-600 hover:bg-slate-50"}`}>{link.label}<ArrowUpRight size={14} /></NavLink>)}</div></nav>
      </header>}
      <main id="main-content" tabIndex={-1} className="mx-auto w-full min-w-0 max-w-6xl flex-1 pb-6 [&_button]:cursor-pointer"><Outlet context={{ setReading } satisfies ReaderContext} /></main>
      {!reading && pathname === "/" && <footer className="border-t border-border bg-white">
        <div className="mx-auto max-w-6xl px-4 pt-5 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:px-8">
          <div className="grid gap-3 pb-4 lg:grid-cols-[1fr_auto] lg:gap-8">
            <div><Link to="/" className="inline-flex min-h-11 items-center text-lg font-semibold text-emerald-950">Noor-e-Quran<span className="text-emerald-600">.</span></Link><p className="text-xs leading-5 text-slate-500">An Islamic project by <span className="font-medium text-emerald-900">MBK Global.</span></p><p className="mt-1 text-[11px] leading-5 text-slate-500">Arabic Quran <span className="px-1 text-slate-300">•</span> Mushaf reading <span className="px-1 text-slate-300">•</span> Recitation</p></div>
            <div>
              <nav aria-label="Footer navigation"><ul className="flex flex-wrap gap-x-5 lg:justify-end">{navigation.map(link => <li key={link.path}><Link to={link.path} className="inline-flex min-h-11 items-center text-xs font-medium text-slate-600 transition-colors hover:text-emerald-800 hover:underline">{link.label}</Link></li>)}</ul></nav>
              <address className="flex flex-col not-italic sm:flex-row sm:flex-wrap sm:gap-x-5 lg:justify-end">
                <a href="tel:+923200276941" className="inline-flex min-h-11 items-center gap-2 text-xs text-slate-600 hover:text-emerald-800"><Phone size={13} strokeWidth={1.5} className="shrink-0 text-emerald-700" />+92 320 0276941</a>
                <a href="mailto:bakhtawark085@gmail.com" className="inline-flex min-h-11 min-w-0 items-center gap-2 text-xs text-slate-600 hover:text-emerald-800"><Mail size={13} strokeWidth={1.5} className="shrink-0 text-emerald-700" /><span className="break-all">bakhtawark085@gmail.com</span></a>
              </address>
            </div>
          </div>
          <div className="flex flex-col gap-2 border-t border-border pt-3 lg:flex-row lg:items-center lg:justify-between"><p className="text-[11px] leading-5 text-slate-500">© 2026 MBK Global. All rights reserved.</p><p className="flex items-start gap-2 text-[11px] leading-5 text-slate-500"><Heart size={12} strokeWidth={1.5} className="mt-1 shrink-0 text-emerald-700" /><span>🤲 Please pray for me - MBK Muhammad Bakhtawar Khan</span></p></div>
        </div>
      </footer>}
    </div>
  );
}

function ContactDetails() {
  return <address className="space-y-2 not-italic"><a href="tel:+923200276941" className="flex min-h-11 items-center gap-3 text-sm text-slate-600 hover:text-emerald-800"><Phone size={16} strokeWidth={1.5} className="shrink-0 text-emerald-700" /><span>+92 320 0276941</span></a><a href="mailto:bakhtawark085@gmail.com" className="flex min-h-11 min-w-0 items-center gap-3 text-sm text-slate-600 hover:text-emerald-800"><Mail size={16} strokeWidth={1.5} className="shrink-0 text-emerald-700" /><span className="break-all">bakhtawark085@gmail.com</span></a></address>;
}

function InformationPage({ eyebrow, title, description, children }: { eyebrow: string; title: string; description: string; children: ReactNode }) {
  return <article className="px-4 py-9 sm:px-8 sm:py-14"><div className="mb-8 max-w-2xl sm:mb-10"><p className="mb-4 text-[10px] font-semibold tracking-[0.18em] text-emerald-700 uppercase">{eyebrow}</p><h1 className="font-['Amiri',serif] text-4xl leading-[1.3] text-emerald-950 sm:text-5xl">{title}</h1><p className="mt-5 text-sm leading-8 text-slate-500">{description}</p></div>{children}<Link to="/" className="mt-10 inline-flex min-h-11 items-center gap-3 text-xs font-semibold text-emerald-800">Open the Quran library<ArrowRight size={15} /></Link></article>;
}

function QuranHome() {
  const { setReading } = useOutletContext<ReaderContext>();
  return <QuranErrorBoundary><QuranSection onReaderChange={setReading} /></QuranErrorBoundary>;
}

function AboutPage() {
  return (
    <article className="px-4 py-8 sm:px-8 sm:py-12">
      <header className="mb-7 flex items-center gap-3 sm:mb-10">
        <span className="h-px w-8 bg-emerald-700" aria-hidden="true" />
        <p className="text-[10px] font-semibold tracking-[0.18em] text-emerald-700 uppercase">About the project</p>
      </header>
      <div className="overflow-hidden rounded-2xl border border-border bg-white">
        <section aria-labelledby="about-quran-title" className="grid gap-7 px-5 py-8 sm:px-10 sm:py-12 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
          <div>
            <h1 id="about-quran-title" className="font-['Amiri',serif] text-4xl leading-[1.25] text-emerald-950 sm:text-5xl">Noor-e-Quran<span className="text-emerald-600">.</span></h1>
            <p className="mt-3 text-xs leading-6 text-slate-600">An Islamic project by <span className="font-semibold text-emerald-900">MBK Global</span></p>
          </div>
          <div>
            <p className="text-base leading-8 text-slate-700 sm:text-lg sm:leading-9">Noor-e-Quran is created to make reading the Holy Quran simple, comfortable, and accessible for everyone.</p>
            <p className="mt-4 text-sm leading-7 text-slate-600">Choose any Surah and read it easily in a clean and distraction-free experience.</p>
            <Link to="/" className="mt-6 inline-flex min-h-11 items-center gap-3 rounded-lg bg-emerald-900 px-5 text-xs font-semibold text-white transition-colors hover:bg-emerald-800">Read the Quran<ArrowRight size={15} /></Link>
          </div>
        </section>
        <section aria-labelledby="about-mbk-title" className="grid border-t border-border lg:grid-cols-[1fr_1.1fr]">
          <div className="bg-[#f1f6f3] px-5 py-8 sm:px-10 sm:py-10">
            <p className="mb-4 text-[10px] font-semibold tracking-[0.16em] text-emerald-700 uppercase">The team behind the project</p>
            <h2 id="about-mbk-title" className="text-2xl font-semibold leading-8 text-emerald-950">About MBK Global</h2>
            <p className="mt-4 max-w-md text-sm leading-7 text-slate-600">MBK Global is a Pakistan-based IT &amp; technology agency providing website development, software, AI, and other digital solutions.</p>
            <ul aria-label="MBK Global services" className="mt-6 grid grid-cols-2 gap-x-4 border-t border-emerald-900/10 pt-2">
              {["Website development", "Software", "AI solutions", "Digital solutions"].map(service => <li key={service} className="flex items-start gap-2 py-2 text-xs leading-5 text-emerald-900"><span aria-hidden="true" className="mt-2 size-1 shrink-0 rounded-full bg-emerald-600" />{service}</li>)}
            </ul>
          </div>
          <div className="flex flex-col justify-center px-5 py-8 sm:px-10 sm:py-10 lg:border-l lg:border-border">
            <p className="text-xl font-medium leading-8 text-emerald-950">Need a website or any IT-related service?</p>
            <p className="mt-2 text-sm leading-7 text-slate-600">Contact MBK Global.</p>
            <div className="mt-5"><ContactDetails /></div>
            <Link to="/contact" className="mt-4 inline-flex min-h-11 w-fit items-center gap-2 text-xs font-semibold text-emerald-800 transition-colors hover:text-emerald-600 hover:underline">Get in touch<ArrowUpRight size={15} /></Link>
          </div>
        </section>
      </div>
      <p className="mt-7 flex items-center justify-center gap-2 text-center text-xs leading-6 text-slate-600 sm:mt-9">Thank you for using Noor-e-Quran. <span aria-label="White heart">🤍</span></p>
    </article>
  );
}

function GuidePage() {
  const steps = [{ title: "Choose a surah", text: "Browse the Quran library or search by surah name or number. Select a surah to open its reader." }, { title: "Read the complete surah", text: "Scroll through the selected surah from beginning to end. Mushaf pages load as you approach them; no next-page button is needed." }, { title: "Listen while you read", text: "Select Listen for Alafasy’s full-surah recitation. Use the audio player to pause, resume, or close the recitation." }];
  return <InformationPage eyebrow="Reading guide" title="Using the Quran reader" description="A short guide to finding a surah, reading its complete text, and playing the recitation."><ol className="max-w-3xl divide-y divide-border rounded-xl border border-border bg-white px-4 sm:px-8">{steps.map((step, index) => <li key={step.title} className="flex gap-4 py-6 sm:gap-6 sm:py-8"><span className="pt-0.5 text-sm font-semibold tabular-nums text-emerald-700">0{index + 1}</span><div><h2 className="text-sm font-semibold text-emerald-950">{step.title}</h2><p className="mt-3 text-sm leading-8 text-slate-500">{step.text}</p></div></li>)}</ol></InformationPage>;
}

function ContactPage() {
  return <InformationPage eyebrow="Contact" title="Get in Touch" description="Have a question, feedback, suggestion, or found an issue with Noor-e-Quran? We’d be happy to hear from you."><div className="grid gap-5 lg:grid-cols-[1.2fr_1fr]"><section className="rounded-xl border border-border bg-white p-5 sm:p-8"><h2 className="mb-5 text-xl font-semibold text-emerald-950">MBK Global</h2><ContactDetails /><p className="mt-6 border-t border-border pt-5 text-sm leading-7 text-slate-600">For Quran reading issues, please include the Surah name, Ayah or page number, and a screenshot if available. This helps us understand and resolve the issue more quickly.</p><p className="mt-4 text-xs leading-6 text-emerald-800">Thank you for helping us improve Noor-e-Quran.</p></section><section className="flex flex-col items-start justify-center rounded-xl border border-border bg-[#eef5f0] p-5 sm:p-8"><p className="text-[10px] font-semibold tracking-[0.16em] text-emerald-700 uppercase">MBK Global · Digital services</p><h2 className="mt-4 text-2xl font-semibold leading-9 text-emerald-950">Have a website in mind?</h2><p className="mt-3 text-sm leading-7 text-slate-600">Share your requirements with our team. Prepare your project request here and send it directly on WhatsApp.</p><Link to="/request-website" className="mt-6 inline-flex min-h-11 items-center gap-3 rounded-lg bg-emerald-900 px-5 text-xs font-semibold text-white hover:bg-emerald-800">Request a website<ArrowUpRight size={15} /></Link></section></div></InformationPage>;
}

const requestFields = [
  { name: "fullName", label: "Full Name", placeholder: "Your full name", required: true, autoComplete: "name", maxLength: 100 },
  { name: "whatsapp", label: "WhatsApp Number", placeholder: "+92 320 1234567", type: "tel", required: true, autoComplete: "tel", maxLength: 25 },
  { name: "email", label: "Email Address", placeholder: "you@example.com", type: "email", required: true, autoComplete: "email", maxLength: 150 },
  { name: "company", label: "Business / Company Name", placeholder: "Your business or brand", autoComplete: "organization", maxLength: 150 },
  { name: "websiteType", label: "Website Type", options: ["Business", "E-commerce", "Portfolio", "Blog", "Web App", "Other"], required: true },
  { name: "pages", label: "Number of Pages", placeholder: "e.g. 5", type: "number" },
  { name: "requirements", label: "Website Purpose / Requirements", placeholder: "What should your website do? Tell us about your audience and goals.", multiline: true, required: true, wide: true, maxLength: 2000 },
  { name: "domain", label: "Do you have a Domain?", options: ["Yes", "No"], required: true },
  { name: "hosting", label: "Do you have Hosting?", options: ["Yes", "No"], required: true },
  { name: "features", label: "Required Features", placeholder: "e.g. Online payments, booking, contact form, admin dashboard", multiline: true, wide: true, maxLength: 1000 },
  { name: "design", label: "Design Preference", placeholder: "Preferred style, colours, or reference website links", multiline: true, wide: true, maxLength: 1000 },
  { name: "budget", label: "Budget", placeholder: "e.g. PKR 50,000–100,000 or not decided", maxLength: 100 },
  { name: "deadline", label: "Expected Deadline", type: "date" },
  { name: "details", label: "Additional Details", placeholder: "Anything else you’d like us to know", multiline: true, wide: true, maxLength: 1500 },
];

function WebsiteRequestPage() {
  const [status, setStatus] = useState<"idle" | "preparing" | "ready">("idle");
  const [chatUrl, setChatUrl] = useState("");
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    setStatus("preparing");
    const data = new FormData(form);
    const message = ["WEBSITE REQUEST · MBK GLOBAL", "", ...requestFields.map(field => `${field.label}:\n${String(data.get(field.name) ?? "").trim() || "Not provided"}`), "", "Sent from Noor-e-Quran · Website request"].join("\n\n");
    const url = `https://wa.me/923200276941?text=${encodeURIComponent(message)}`;
    setChatUrl(url);
    window.open(url, "_blank", "noopener,noreferrer");
    setStatus("ready");
  };
  const inputClass = "mt-2 min-h-12 w-full min-w-0 rounded-lg border border-border bg-[#fafcfb] px-3 py-3 text-sm text-slate-800 outline-none transition-colors placeholder:text-slate-400 focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/10";
  return (
    <article className="px-4 py-8 sm:px-8 sm:py-12">
      <div className="mb-8 max-w-2xl"><p className="text-[10px] font-semibold tracking-[0.18em] text-emerald-700 uppercase">MBK Global · Project enquiries</p><h1 className="mt-4 font-['Amiri',serif] text-4xl leading-[1.3] text-emerald-950 sm:text-5xl">Request a Website</h1><p className="mt-4 text-sm leading-7 text-slate-600">Tell us what you have in mind. We’ll prepare your requirements as a WhatsApp message for you to review and send to MBK Global.</p></div>
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
        <form onSubmit={submit} onChange={() => { setStatus("idle"); setChatUrl(""); }} className="min-w-0 rounded-2xl border border-border bg-white p-5 sm:p-8">
          <div className="mb-6 border-b border-border pb-5"><h2 className="text-lg font-semibold text-emerald-950">Your project brief</h2><p className="mt-2 text-xs leading-6 text-slate-600">Fields marked <span className="text-emerald-800">*</span> are required. Share as much detail as you can.</p></div>
          <div className="grid gap-5 sm:grid-cols-2">{requestFields.map(field => <div key={field.name} className={field.wide ? "min-w-0 sm:col-span-2" : "min-w-0"}>
            <label htmlFor={`request-${field.name}`} className="text-xs font-semibold text-slate-700">{field.label}{field.required && <span className="ml-1 text-emerald-700" aria-hidden="true">*</span>}</label>
            {field.options ? <select id={`request-${field.name}`} name={field.name} required={field.required} defaultValue="" className={inputClass}><option value="" disabled>Select an option</option>{field.options.map(option => <option key={option} value={option}>{option}</option>)}</select> : field.multiline ? <textarea id={`request-${field.name}`} name={field.name} required={field.required} placeholder={field.placeholder} rows={4} maxLength={field.maxLength} className={`${inputClass} resize-y`} onChange={event => event.currentTarget.setCustomValidity(field.required && !event.currentTarget.value.trim() ? "Please describe your website requirements." : "")} /> : <input id={`request-${field.name}`} name={field.name} type={field.type ?? "text"} required={field.required} placeholder={field.placeholder} autoComplete={field.autoComplete} maxLength={field.maxLength} min={field.type === "number" ? 1 : field.type === "date" ? new Date().toLocaleDateString("en-CA") : undefined} max={field.type === "number" ? 10000 : undefined} step={field.type === "number" ? 1 : undefined} pattern={field.name === "whatsapp" ? "\\+?[0-9 ()\\-]{7,25}" : field.required && !field.type ? ".*\\S.*" : undefined} className={inputClass} onChange={event => { const value = event.currentTarget.value; event.currentTarget.setCustomValidity(field.name === "whatsapp" && (value.replace(/\D/g, "").length < 7 || value.replace(/\D/g, "").length > 15) ? "Enter a valid WhatsApp number with 7–15 digits, including your country code." : ""); }} />}
            {field.name === "whatsapp" && <p className="mt-2 text-[11px] leading-5 text-slate-500">Include your country code, e.g. +92.</p>}
          </div>)}</div>
          <div className="mt-7 border-t border-border pt-6"><button type="submit" disabled={status === "preparing"} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-emerald-900 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-800 disabled:cursor-wait disabled:opacity-60"><MessageCircle size={18} />{status === "preparing" ? "Preparing your request…" : "Submit Request on WhatsApp"}<ArrowUpRight size={16} className="shrink-0" /></button><p className="mt-3 text-center text-[11px] leading-6 text-slate-500">Opens WhatsApp. Nothing is sent until you press Send there.</p></div>
          {status === "ready" && <div role="status" className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 p-4"><p className="flex items-center gap-2 text-sm font-semibold text-emerald-900"><CheckCircle2 size={17} />Your request is ready</p><p className="mt-2 text-xs leading-6 text-emerald-900">Review your message in WhatsApp and press Send. If WhatsApp didn’t open, use the link below.</p><a href={chatUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex min-h-11 items-center gap-2 text-xs font-semibold text-emerald-900 underline">Open request in WhatsApp<ArrowUpRight size={14} /></a></div>}
        </form>
        <aside className="rounded-xl border border-border bg-[#eef5f0] p-6"><p className="text-[10px] font-semibold tracking-[0.16em] text-emerald-700 uppercase">A direct conversation</p><h2 className="mt-3 text-xl font-semibold text-emerald-950">Let’s build your idea.</h2><ol className="mt-5 space-y-4 text-xs leading-6 text-slate-600"><li><span className="mr-2 font-semibold text-emerald-800">01</span>Fill in your project requirements.</li><li><span className="mr-2 font-semibold text-emerald-800">02</span>Review the prepared WhatsApp message.</li><li><span className="mr-2 font-semibold text-emerald-800">03</span>Send it to the MBK Global team.</li></ol><div className="mt-6 border-t border-emerald-900/10 pt-5"><h3 className="mb-2 text-sm font-semibold text-emerald-950">MBK Global</h3><ContactDetails /></div><p className="mt-4 text-[11px] leading-6 text-slate-600">Your form is not submitted to a website server. The details are included in the WhatsApp link. Please don’t include passwords or sensitive information.</p></aside>
      </div>
    </article>
  );
}

const router = createHashRouter([{ Component: SiteLayout, children: [
  { index: true, Component: QuranHome },
  { path: "about", Component: AboutPage },
  { path: "reading-guide", Component: GuidePage },
  { path: "contact", Component: ContactPage },
  { path: "request-website", Component: WebsiteRequestPage },
  { path: "*", element: <InformationPage eyebrow="404" title="Page not found" description="The page you requested is not available."><p className="text-sm text-slate-500">Use the navigation to return to the Quran library.</p></InformationPage> },
] }]);

export default function App() {
  return <RouterProvider router={router} />;
}
