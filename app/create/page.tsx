'use client';
import { useState, useRef, useCallback, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import Image from 'next/image';

// Types
interface MatchData {
  homeTeam: string;
  awayTeam: string;
  homeTeamLogo: string;
  awayTeamLogo: string;
  date: string;
  time: string;
  venue: string;
  competition: string;
  style: string;
  colorMode: 'auto' | 'custom';
  homeColors: string;
  awayColors: string;
  description: string;
  referenceImage: File | null;
  referencePreview: string;
  homeScore: string;
  awayScore: string;
  isReturnLeg: boolean;
}

interface Quota {
  plan: string;
  quota_remaining: number;
  quota_total: number;
}

const AMBIANCES = [
  { key: 'Électrique', icon: '⚡', desc: 'Énergie intense, éclairs, vibrations' },
  { key: 'Épique', icon: '🎬', desc: 'Cinématique, héroïque, dramatique' },
  { key: 'Sobre & Pro', icon: '🎯', desc: 'Épuré, minimaliste, élégant' },
  { key: 'Festif', icon: '🎉', desc: 'Coloré, joyeux, célébration' },
] as const;

const COMPETITIONS = [
  'Ligue 1', 'Ligue 2', 'Champions League', 'Europa League', 'Conference League',
  'Coupe de France', 'Liga', 'Premier League', 'Serie A', 'Bundesliga',
  'Eredivisie', 'Championnat National', 'Amical', 'Autre',
];

const MAX_DESC = 1500;
const TOTAL_STEPS = 5;

// Plain team input with autocomplete (no inline logo preview)
function TeamInput({
  label,
  placeholder,
  value,
  onChange,
  onLogoChange,
}: {
  label: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  onLogoChange: (url: string) => void;
}) {
  const [results, setResults] = useState<{ id: string; name: string; logo: string }[]>([]);
  const [searching, setSearching] = useState(false);

  async function search(query: string) {
    onChange(query);
    if (query.length < 2) { setResults([]); return; }
    setSearching(true);
    try {
      const res = await fetch(`/api/search-team?team=${encodeURIComponent(query)}`);
      const data = await res.json();
      setResults(data.teams ?? []);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }

  function select(name: string, logoUrl: string) {
    onChange(name);
    onLogoChange(logoUrl);
    setResults([]);
  }

  return (
    <div className="relative">
      <label className="mb-1.5 block font-body text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => search(e.target.value)}
        className="w-full px-4 py-3 font-body text-sm text-white placeholder-slate-600 focus:outline-none focus-visible:ring-1 focus-visible:ring-green-600"
        style={{ background: 'rgba(5,46,22,0.35)', border: '1px solid rgba(22,163,74,0.2)' }}
        placeholder={placeholder ?? 'ex. Paris Saint-Germain'}
      />
      {(results.length > 0 || searching) && (
        <div
          className="absolute z-10 mt-0.5 w-full shadow-xl"
          style={{ background: '#0d1f13', border: '1px solid rgba(22,163,74,0.3)' }}
        >
          {searching && <div className="px-4 py-2 font-body text-xs text-slate-500">Recherche…</div>}
          {results.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => select(t.name, t.logo)}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-left font-body text-sm text-white hover:bg-green-900/20"
            >
              {t.logo && <Image src={t.logo} alt={t.name} width={24} height={24} className="object-contain" />}
              {t.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const STEP_LABELS = ['Type', 'Infos match', 'Logos', 'Style', 'Génération'] as const;

function CreateStepBar({ current }: { current: number }) {
  const pct = (current / (STEP_LABELS.length - 1)) * 100;
  return (
    <div>
      {/* Thin progress line */}
      <div className="h-0.5 w-full" style={{ background: 'rgba(22,163,74,0.15)' }}>
        <div
          className="h-0.5 transition-all duration-500 ease-in-out"
          style={{ width: `${pct}%`, background: '#16a34a' }}
        />
      </div>
      {/* Step labels — desktop only */}
      <div className="relative z-10 hidden items-center justify-between px-12 pt-3 pb-0 md:flex">
        {STEP_LABELS.map((label, i) => (
          <div key={i} className="flex items-center gap-2">
            <div
              className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold transition-all duration-300 ${
                i < current
                  ? 'bg-green-700 text-white ring-2 ring-green-500/40'
                  : i === current
                  ? 'bg-green-700 text-white ring-2 ring-green-500/40'
                  : 'bg-green-950 text-green-700'
              }`}
            >
              {i < current ? (
                <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 12 12">
                  <path d="M2 6l3 3 5-5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                i + 1
              )}
            </div>
            <span
              className={`font-body text-xs font-semibold uppercase tracking-[0.2em] transition-colors duration-300 ${
                i <= current ? 'text-green-400' : 'text-green-900'
              }`}
            >
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function CreatePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const homeLogoInputRef = useRef<HTMLInputElement>(null);
  const awayLogoInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState(0);
  const [posterType, setPosterType] = useState<'avant-match' | 'apres-match' | 'annonce' | ''>('');
  const [generating, setGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState('');
  const [genError, setGenError] = useState('');
  const [quota, setQuota] = useState<Quota | null>(null);
  const [retryingHome, setRetryingHome] = useState(false);
  const [retryingAway, setRetryingAway] = useState(false);
  const [transitioning, setTransitioning] = useState(false);

  const [data, setData] = useState<MatchData>({
    homeTeam: '',
    awayTeam: '',
    homeTeamLogo: '',
    awayTeamLogo: '',
    date: '',
    time: '',
    venue: '',
    competition: '',
    style: 'Électrique',
    colorMode: 'auto',
    homeColors: '#1d4ed8',
    awayColors: '#dc2626',
    description: '',
    referenceImage: null,
    referencePreview: '',
    homeScore: '0',
    awayScore: '0',
    isReturnLeg: false,
  });

  const update = useCallback((patch: Partial<MatchData>) => {
    setData((prev) => ({ ...prev, ...patch }));
  }, []);

  useEffect(() => {
    fetch('/api/generation-quota').then((r) => r.ok && r.json().then(setQuota));
  }, []);

  async function retryLogo(team: 'home' | 'away') {
    const name = team === 'home' ? data.homeTeam : data.awayTeam;
    if (!name) return;
    team === 'home' ? setRetryingHome(true) : setRetryingAway(true);
    try {
      const res = await fetch(`/api/search-team?team=${encodeURIComponent(name)}`);
      const json = await res.json();
      const found = json.teams?.[0];
      if (found?.logo) {
        team === 'home' ? update({ homeTeamLogo: found.logo }) : update({ awayTeamLogo: found.logo });
      }
    } catch { /* silent */ } finally {
      team === 'home' ? setRetryingHome(false) : setRetryingAway(false);
    }
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>, team: 'home' | 'away') {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) { alert('Format invalide. Utilisez PNG, JPG ou WebP.'); return; }
    const url = URL.createObjectURL(file);
    team === 'home' ? update({ homeTeamLogo: url }) : update({ awayTeamLogo: url });
  }

  // Resize image client-side
  async function resizeImage(file: File, maxPx = 512): Promise<File> {
    return new Promise((resolve) => {
      const img = document.createElement('img');
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const scale = Math.min(maxPx / img.width, maxPx / img.height, 1);
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        canvas.getContext('2d')!.drawImage(img, 0, 0, w, h);
        canvas.toBlob((blob) => {
          URL.revokeObjectURL(url);
          resolve(new File([blob!], file.name, { type: 'image/png' }));
        }, 'image/png');
      };
      img.src = url;
    });
  }

  async function handleReferenceUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      alert('Format invalide. Utilisez PNG, JPG ou WebP.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('Image trop volumineuse (max 5MB).');
      return;
    }

    const resized = await resizeImage(file, 512);
    const preview = URL.createObjectURL(resized);
    update({ referenceImage: resized, referencePreview: preview });
  }

  async function handleGenerate() {
    setGenerating(true);
    setGenError('');

    const formData = new FormData();
    formData.append('homeTeam', data.homeTeam);
    formData.append('awayTeam', data.awayTeam);
    formData.append('date', data.date);
    formData.append('time', data.time);
    formData.append('venue', data.venue);
    formData.append('competition', data.competition);
    formData.append('style', data.style);
    formData.append('colors', data.colorMode === 'auto' ? 'auto' : `${data.homeColors}, ${data.awayColors}`);
    formData.append('description', data.description.slice(0, MAX_DESC));
    formData.append('posterType', posterType);
    if (posterType === 'apres-match') {
      formData.append('score', `${data.homeScore}-${data.awayScore}`);
      if (data.isReturnLeg) formData.append('isReturnLeg', 'true');
    }
    if (data.referenceImage) {
      formData.append('reference', data.referenceImage);
    }

    try {
      const res = await fetch('/api/generate-poster', {
        method: 'POST',
        body: formData,
      });
      const json = await res.json();
      if (!res.ok) {
        setGenError(json.error ?? 'Erreur lors de la génération.');
      } else {
        setGeneratedImage(json.image);
        setStep(5);
      }
    } catch {
      setGenError('Erreur réseau. Réessayez.');
    } finally {
      setGenerating(false);
    }
  }

  function downloadImage() {
    const a = document.createElement('a');
    a.href = generatedImage;
    a.download = `tifo-${data.homeTeam}-vs-${data.awayTeam}-${data.date}.png`;
    a.click();
  }

  if (status === 'loading') {
    return <div className="flex min-h-screen items-center justify-center bg-[#020f07] text-white">Chargement…</div>;
  }

  if (!session) {
    router.push('/auth/login');
    return null;
  }

  const POSTER_TYPES = [
    { key: 'avant-match' as const, icon: '⚡', title: 'AVANT-MATCH', description: "Annoncez le match avant le coup d'envoi" },
    { key: 'apres-match' as const, icon: '🏆', title: 'APRÈS-MATCH', description: 'Célébrez le résultat avec le score final' },
    { key: 'annonce' as const, icon: '📣', title: 'ANNONCE / ÉVÉNEMENT', description: 'Promouvez un événement ou actualité club' },
  ] as const;

  return (
    <div className="min-h-screen bg-[#020f07]">
      <Navbar createStep={{ current: step < 5 ? step : 4, total: TOTAL_STEPS }} />
      <CreateStepBar current={step < 5 ? step : 4} />

      <main className="mx-auto max-w-3xl px-6 pb-16 pt-10 md:px-12">

        {/* Result screen */}
        {step === 5 && generatedImage ? (
          <div className="animate-fade-in-up space-y-6 text-center">
            <div className="mb-2 flex items-center justify-center gap-2">
              <div className="h-px w-8 bg-green-600" />
              <p className="font-body text-xs font-bold uppercase tracking-[0.3em] text-green-600">Résultat</p>
              <div className="h-px w-8 bg-green-600" />
            </div>
            <h1 className="font-display text-4xl uppercase text-white">Votre affiche est prête !</h1>
            <div className="mx-auto max-w-sm overflow-hidden" style={{ border: '1px solid rgba(22,163,74,0.2)' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={generatedImage} alt="Affiche générée" className="w-full" />
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button
                onClick={downloadImage}
                className="bg-green-700 px-6 py-3 font-body text-xs font-black uppercase tracking-[0.2em] text-white hover:bg-green-600 transition-colors"
              >
                Télécharger l&apos;affiche
              </button>
              <button
                onClick={() => { setStep(0); setGeneratedImage(''); setPosterType(''); update({ referenceImage: null, referencePreview: '' }); }}
                className="px-6 py-3 font-body text-xs font-bold uppercase tracking-[0.2em] text-slate-400 hover:text-white transition-colors"
                style={{ border: '1px solid rgba(22,163,74,0.3)' }}
              >
                Créer une nouvelle affiche
              </button>
              <Link
                href="/dashboard"
                className="px-6 py-3 text-center font-body text-xs font-bold uppercase tracking-[0.2em] text-slate-400 hover:text-white transition-colors"
                style={{ border: '1px solid rgba(22,163,74,0.3)' }}
              >
                Voir mes affiches
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Step header */}
            <div className="mb-10">
              <div className="mb-3 flex items-center gap-2">
                <div className="h-px w-6 bg-green-600" />
                <p className="font-body text-xs font-bold uppercase tracking-[0.3em] text-green-600">
                  {step === 0 && 'Type d\'affiche'}
                  {step === 1 && 'Infos du match'}
                  {step === 2 && 'Logos des clubs'}
                  {step === 3 && 'Style & Ambiance'}
                  {step === 4 && 'Génération'}
                </p>
              </div>
              <h1 className="font-display uppercase leading-[0.88] text-white" style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', letterSpacing: '-0.02em' }}>
                {step === 0 && (<>Quel type<br /><span className="text-gradient-green">d&apos;affiche ?</span></>)}
                {step === 1 && (<>Les détails<br /><span className="text-gradient-green">du match</span></>)}
                {step === 2 && (<>Identité<br /><span className="text-gradient-green">visuelle</span></>)}
                {step === 3 && (<>L&apos;atmosphère<br /><span className="text-gradient-green">de l&apos;affiche</span></>)}
                {step === 4 && (<>Votre affiche<br /><span className="text-gradient-green">matchday</span></>)}
              </h1>
            </div>

            {/* ── STEP 0 — Type ── */}
            {step === 0 && (
              <div className="grid grid-cols-1 gap-4 animate-fade-in-up sm:grid-cols-3">
                {POSTER_TYPES.map((type) => (
                  <button
                    key={type.key}
                    type="button"
                    disabled={transitioning}
                    onClick={() => {
                      if (transitioning) return;
                      setPosterType(type.key);
                      setTransitioning(true);
                      setTimeout(() => {
                        setStep(1);
                        setTransitioning(false);
                      }, 480);
                    }}
                    className="relative p-6 text-left transition-all duration-200"
                    style={{
                      background: posterType === type.key ? 'rgba(22,163,74,0.15)' : 'rgba(5,46,22,0.15)',
                      border: posterType === type.key ? '1px solid rgba(22,163,74,0.5)' : '1px solid rgba(22,163,74,0.15)',
                    }}
                  >
                    {/* Checkmark overlay on selected */}
                    {posterType === type.key && transitioning && (
                      <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-green-500">
                        <svg className="h-3 w-3 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 12 12">
                          <path d="M2 6l3 3 5-5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </span>
                    )}
                    <div className="mb-3 text-3xl">{type.icon}</div>
                    <p className="font-display text-lg uppercase text-white">{type.title}</p>
                    <p className="mt-1 font-body text-xs leading-relaxed text-slate-400">{type.description}</p>
                  </button>
                ))}
              </div>
            )}

            {/* ── STEP 1 — Infos match ── */}
            {step === 1 && (
              <div className="animate-fade-in-up space-y-5">
                {/* Teams 2-col */}
                <div className="grid grid-cols-2 gap-4">
                  <TeamInput
                    label="Équipe A (Domicile) *"
                    placeholder="ex. Paris Saint-Germain"
                    value={data.homeTeam}
                    onChange={(v) => update({ homeTeam: v })}
                    onLogoChange={(v) => update({ homeTeamLogo: v })}
                  />
                  <TeamInput
                    label="Équipe B (Extérieur) *"
                    placeholder="ex. Olympique de Marseille"
                    value={data.awayTeam}
                    onChange={(v) => update({ awayTeam: v })}
                    onLogoChange={(v) => update({ awayTeamLogo: v })}
                  />
                </div>

                {/* Score final — only for après-match */}
                {posterType === 'apres-match' && (
                  <div className="p-4" style={{ background: 'rgba(5,46,22,0.2)', border: '1px solid rgba(22,163,74,0.25)' }}>
                    <p className="mb-3 font-body text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Score final</p>
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col items-center gap-1">
                        <span className="font-body text-[10px] uppercase tracking-widest text-slate-600">Éq. A</span>
                        <div className="flex items-center" style={{ background: 'rgba(5,46,22,0.4)', border: '1px solid rgba(22,163,74,0.3)' }}>
                          <button
                            type="button"
                            onClick={() => update({ homeScore: String(Math.max(0, Number(data.homeScore) - 1)) })}
                            className="px-3 py-2 font-body text-base text-slate-400 hover:text-white transition-colors"
                          >−</button>
                          <input
                            type="number"
                            min={0}
                            max={99}
                            value={data.homeScore}
                            onChange={(e) => update({ homeScore: e.target.value })}
                            className="w-12 bg-transparent py-2 text-center font-display text-xl text-white focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => update({ homeScore: String(Number(data.homeScore) + 1) })}
                            className="px-3 py-2 font-body text-base text-slate-400 hover:text-white transition-colors"
                          >+</button>
                        </div>
                      </div>
                      <span className="font-display text-xl text-slate-600">—</span>
                      <div className="flex flex-col items-center gap-1">
                        <span className="font-body text-[10px] uppercase tracking-widest text-slate-600">Éq. B</span>
                        <div className="flex items-center" style={{ background: 'rgba(5,46,22,0.4)', border: '1px solid rgba(22,163,74,0.3)' }}>
                          <button
                            type="button"
                            onClick={() => update({ awayScore: String(Math.max(0, Number(data.awayScore) - 1)) })}
                            className="px-3 py-2 font-body text-base text-slate-400 hover:text-white transition-colors"
                          >−</button>
                          <input
                            type="number"
                            min={0}
                            max={99}
                            value={data.awayScore}
                            onChange={(e) => update({ awayScore: e.target.value })}
                            className="w-12 bg-transparent py-2 text-center font-display text-xl text-white focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => update({ awayScore: String(Number(data.awayScore) + 1) })}
                            className="px-3 py-2 font-body text-base text-slate-400 hover:text-white transition-colors"
                          >+</button>
                        </div>
                      </div>
                    </div>
                    <label className="mt-3 flex cursor-pointer items-center gap-2">
                      <input
                        type="checkbox"
                        checked={data.isReturnLeg}
                        onChange={(e) => update({ isReturnLeg: e.target.checked })}
                        className="h-4 w-4 accent-green-600"
                      />
                      <span className="font-body text-xs text-slate-400">Match retour</span>
                    </label>
                  </div>
                )}

                {/* Date + Heure */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 block font-body text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Date *</label>
                    <input
                      type="date"
                      value={data.date}
                      onChange={(e) => update({ date: e.target.value })}
                      className="w-full px-4 py-3 font-body text-sm text-white focus:outline-none focus-visible:ring-1 focus-visible:ring-green-600"
                      style={{ background: 'rgba(5,46,22,0.35)', border: '1px solid rgba(22,163,74,0.2)', colorScheme: 'dark' }}
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block font-body text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Heure</label>
                    <input
                      type="time"
                      value={data.time}
                      onChange={(e) => update({ time: e.target.value })}
                      className="w-full px-4 py-3 font-body text-sm text-white focus:outline-none focus-visible:ring-1 focus-visible:ring-green-600"
                      style={{ background: 'rgba(5,46,22,0.35)', border: '1px solid rgba(22,163,74,0.2)', colorScheme: 'dark' }}
                    />
                  </div>
                </div>
                {/* Compétition */}
                <div>
                  <label className="mb-1.5 block font-body text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Compétition</label>
                  <div className="relative">
                    <select
                      value={data.competition}
                      onChange={(e) => update({ competition: e.target.value })}
                      className="w-full appearance-none px-4 py-3 font-body text-sm text-white focus:outline-none focus-visible:ring-1 focus-visible:ring-green-600"
                      style={{ background: 'rgba(5,46,22,0.35)', border: '1px solid rgba(22,163,74,0.2)', colorScheme: 'dark' }}
                    >
                      <option value="">Sélectionner…</option>
                      {COMPETITIONS.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                    <svg className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>
                {/* Lieu */}
                <div>
                  <label className="mb-1.5 block font-body text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Lieu / Stade</label>
                  <input
                    type="text"
                    value={data.venue}
                    onChange={(e) => update({ venue: e.target.value })}
                    className="w-full px-4 py-3 font-body text-sm text-white placeholder-slate-600 focus:outline-none focus-visible:ring-1 focus-visible:ring-green-600"
                    placeholder="ex. Parc des Princes (optionnel)"
                    style={{ background: 'rgba(5,46,22,0.35)', border: '1px solid rgba(22,163,74,0.2)' }}
                  />
                </div>
              </div>
            )}

            {/* ── STEP 2 — Logos ── */}
            {step === 2 && (
              <div className="animate-fade-in-up space-y-5">
                <p className="font-body text-sm text-slate-400">
                  Logos récupérés automatiquement — vous pouvez les remplacer manuellement.
                </p>
                <div className="grid grid-cols-2 gap-5">
                  {/* Home logo */}
                  <div style={{ background: 'rgba(5,46,22,0.15)', border: '1px solid rgba(22,163,74,0.2)' }}>
                    <div className="p-4">
                      <p className="font-body text-[10px] font-bold uppercase tracking-[0.2em] text-green-600">
                        Équipe A — {data.homeTeam || '—'}
                      </p>
                    </div>
                    <div
                      className="flex h-36 items-center justify-center"
                      style={{ borderTop: '1px solid rgba(22,163,74,0.12)', borderBottom: '1px solid rgba(22,163,74,0.12)' }}
                    >
                      {data.homeTeamLogo ? (
                        <Image src={data.homeTeamLogo} alt={data.homeTeam} width={90} height={90} className="object-contain" />
                      ) : (
                        <p className="font-body text-xs text-slate-600">Aucun logo trouvé</p>
                      )}
                    </div>
                    <div className="flex" style={{ borderTop: '1px solid rgba(22,163,74,0.12)' }}>
                      <button
                        type="button"
                        onClick={() => retryLogo('home')}
                        disabled={retryingHome}
                        className="flex flex-1 items-center justify-center gap-1.5 py-2.5 font-body text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 hover:text-green-400 transition-colors disabled:opacity-40"
                        style={{ borderRight: '1px solid rgba(22,163,74,0.12)' }}
                      >
                        <span>↺</span> Réessayer
                      </button>
                      <button
                        type="button"
                        onClick={() => homeLogoInputRef.current?.click()}
                        className="flex flex-1 items-center justify-center gap-1.5 py-2.5 font-body text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 hover:text-green-400 transition-colors"
                      >
                        <span>↑</span> Uploader
                      </button>
                    </div>
                    <input ref={homeLogoInputRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => handleLogoUpload(e, 'home')} className="hidden" />
                  </div>

                  {/* Away logo */}
                  <div style={{ background: 'rgba(5,46,22,0.15)', border: '1px solid rgba(22,163,74,0.2)' }}>
                    <div className="p-4">
                      <p className="font-body text-[10px] font-bold uppercase tracking-[0.2em] text-green-600">
                        Équipe B — {data.awayTeam || '—'}
                      </p>
                    </div>
                    <div
                      className="flex h-36 items-center justify-center"
                      style={{ borderTop: '1px solid rgba(22,163,74,0.12)', borderBottom: '1px solid rgba(22,163,74,0.12)' }}
                    >
                      {data.awayTeamLogo ? (
                        <Image src={data.awayTeamLogo} alt={data.awayTeam} width={90} height={90} className="object-contain" />
                      ) : (
                        <p className="font-body text-xs text-slate-600">Aucun logo trouvé</p>
                      )}
                    </div>
                    <div className="flex" style={{ borderTop: '1px solid rgba(22,163,74,0.12)' }}>
                      <button
                        type="button"
                        onClick={() => retryLogo('away')}
                        disabled={retryingAway}
                        className="flex flex-1 items-center justify-center gap-1.5 py-2.5 font-body text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 hover:text-green-400 transition-colors disabled:opacity-40"
                        style={{ borderRight: '1px solid rgba(22,163,74,0.12)' }}
                      >
                        <span>↺</span> Réessayer
                      </button>
                      <button
                        type="button"
                        onClick={() => awayLogoInputRef.current?.click()}
                        className="flex flex-1 items-center justify-center gap-1.5 py-2.5 font-body text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 hover:text-green-400 transition-colors"
                      >
                        <span>↑</span> Uploader
                      </button>
                    </div>
                    <input ref={awayLogoInputRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => handleLogoUpload(e, 'away')} className="hidden" />
                  </div>
                </div>
                <p className="font-body text-xs text-slate-500">
                  Les logos sont optionnels — l&apos;IA peut travailler sans eux.
                </p>
              </div>
            )}

            {/* ── STEP 3 — Style ── */}
            {step === 3 && (
              <div className="animate-fade-in-up space-y-7">
                {/* Ambiance cards */}
                <div>
                  <p className="mb-3 font-body text-[10px] font-bold uppercase tracking-[0.25em] text-slate-500">Ambiance</p>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {AMBIANCES.map((a) => (
                      <button
                        key={a.key}
                        type="button"
                        onClick={() => update({ style: a.key })}
                        className="p-4 text-left transition-all"
                        style={{
                          background: data.style === a.key ? 'rgba(22,163,74,0.12)' : 'rgba(5,46,22,0.15)',
                          border: data.style === a.key ? '1px solid rgba(22,163,74,0.5)' : '1px solid rgba(22,163,74,0.15)',
                        }}
                      >
                        <div className="mb-2 text-2xl">{a.icon}</div>
                        <p className={`font-display text-sm uppercase ${data.style === a.key ? 'text-green-400' : 'text-white'}`}>{a.key}</p>
                        <p className="mt-0.5 font-body text-[10px] leading-relaxed text-slate-500">{a.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color mode toggle */}
                <div>
                  <p className="mb-3 font-body text-[10px] font-bold uppercase tracking-[0.25em] text-slate-500">Couleur dominante</p>
                  <div className="flex">
                    <button
                      type="button"
                      onClick={() => update({ colorMode: 'auto' })}
                      className="flex-1 py-2.5 font-body text-xs font-bold uppercase tracking-[0.12em] transition-colors"
                      style={{
                        background: data.colorMode === 'auto' ? 'rgba(22,163,74,0.15)' : 'transparent',
                        border: data.colorMode === 'auto' ? '1px solid rgba(22,163,74,0.5)' : '1px solid rgba(22,163,74,0.2)',
                        color: data.colorMode === 'auto' ? '#4ade80' : '#94a3b8',
                      }}
                    >
                      Auto (couleurs clubs)
                    </button>
                    <button
                      type="button"
                      onClick={() => update({ colorMode: 'custom' })}
                      className="flex-1 py-2.5 font-body text-xs font-bold uppercase tracking-[0.12em] transition-colors"
                      style={{
                        background: data.colorMode === 'custom' ? 'rgba(22,163,74,0.15)' : 'transparent',
                        border: data.colorMode === 'custom' ? '1px solid rgba(22,163,74,0.5)' : '1px solid rgba(22,163,74,0.2)',
                        borderLeft: 'none',
                        color: data.colorMode === 'custom' ? '#4ade80' : '#94a3b8',
                      }}
                    >
                      Couleur personnalisée
                    </button>
                  </div>
                  {data.colorMode === 'custom' && (
                    <div className="mt-3 grid grid-cols-2 gap-4">
                      <div>
                        <p className="mb-2 font-body text-[10px] text-slate-500">Couleur domicile</p>
                        <div className="flex items-center gap-3">
                          <input type="color" value={data.homeColors} onChange={(e) => update({ homeColors: e.target.value })} className="h-10 w-10 cursor-pointer border-0 bg-transparent" />
                          <span className="font-body text-xs text-slate-400">{data.homeColors}</span>
                        </div>
                      </div>
                      <div>
                        <p className="mb-2 font-body text-[10px] text-slate-500">Couleur extérieur</p>
                        <div className="flex items-center gap-3">
                          <input type="color" value={data.awayColors} onChange={(e) => update({ awayColors: e.target.value })} className="h-10 w-10 cursor-pointer border-0 bg-transparent" />
                          <span className="font-body text-xs text-slate-400">{data.awayColors}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label className="mb-1 block font-body text-[10px] font-bold uppercase tracking-[0.25em] text-slate-500">
                    Description libre
                    <span className="ml-2 font-normal text-slate-600">(optionnel)</span>
                  </label>
                  <p className="mb-2 font-body text-xs text-slate-600">
                    Décris l&apos;affiche idéale en détail: ambiance, palette, lumière, composition, typographies ou références visuelles.
                  </p>
                  <textarea
                    value={data.description}
                    onChange={(e) => update({ description: e.target.value.slice(0, MAX_DESC) })}
                    rows={5}
                    className="w-full resize-none px-4 py-3 font-body text-sm text-white placeholder-slate-700 focus:outline-none focus-visible:ring-1 focus-visible:ring-green-600"
                    placeholder="ex. Fond sombre avec des flammes dorées, grandes typographies blanches, atmosphère de derby électrique…"
                    style={{ background: 'rgba(5,46,22,0.35)', border: '1px solid rgba(22,163,74,0.2)' }}
                  />
                  <div className="mt-1 text-right font-body text-[10px] text-slate-600">
                    {data.description.length} / {MAX_DESC}
                  </div>
                </div>

                {/* Reference image */}
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleReferenceUpload}
                    className="hidden"
                  />
                </div>
              </div>
            )}

            {/* ── STEP 4 — Génération ── */}
            {step === 4 && (
              <div className="animate-fade-in-up space-y-5">
                {/* Quota card */}
                {quota && (
                  <div className="p-5" style={{ background: 'rgba(5,46,22,0.15)', border: '1px solid rgba(22,163,74,0.2)' }}>
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-body text-[10px] font-bold uppercase tracking-[0.25em] text-green-600">Quota de génération</p>
                        <p className="mt-1 font-body text-sm font-semibold text-white">
                          Plan {quota.plan.charAt(0).toUpperCase() + quota.plan.slice(1)}
                        </p>
                        <p className="mt-1 font-body text-xs text-slate-400">
                          {quota.quota_total === 999999
                            ? 'Générations illimitées.'
                            : `${quota.quota_remaining} génération${quota.quota_remaining !== 1 ? 's' : ''} restante${quota.quota_remaining !== 1 ? 's' : ''} sur ${quota.quota_total} pour ce mois.`}
                        </p>
                      </div>
                      <div
                        className="px-3 py-1.5 font-body text-[10px] font-bold uppercase tracking-[0.15em] text-white"
                        style={{ background: 'rgba(22,163,74,0.2)', border: '1px solid rgba(22,163,74,0.35)' }}
                      >
                        {quota.quota_total === 999999
                          ? '∞ illimitées'
                          : `${quota.quota_total - quota.quota_remaining}/${quota.quota_total} utilisées ce mois`}
                      </div>
                    </div>
                  </div>
                )}

                {/* Recap card */}
                <div className="p-5" style={{ background: 'rgba(5,46,22,0.15)', border: '1px solid rgba(22,163,74,0.2)' }}>
                  <p className="mb-4 font-body text-[10px] font-bold uppercase tracking-[0.25em] text-green-600">Récapitulatif</p>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                    <div>
                      <p className="font-body text-[10px] font-bold uppercase tracking-[0.2em] text-green-600">Type</p>
                      <p className="mt-0.5 font-body text-sm capitalize text-white">{posterType.replace('-', ' ') || '—'}</p>
                    </div>
                    <div>
                      <p className="font-body text-[10px] font-bold uppercase tracking-[0.2em] text-green-600">Match</p>
                      <p className="mt-0.5 font-body text-sm text-white">{data.homeTeam && data.awayTeam ? `${data.homeTeam} vs ${data.awayTeam}` : '—'}</p>
                    </div>
                    <div>
                      <p className="font-body text-[10px] font-bold uppercase tracking-[0.2em] text-green-600">Date</p>
                      <p className="mt-0.5 font-body text-sm text-white">
                        {data.date ? new Date(data.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}
                      </p>
                    </div>
                    <div>
                      <p className="font-body text-[10px] font-bold uppercase tracking-[0.2em] text-green-600">Compétition</p>
                      <p className="mt-0.5 font-body text-sm text-white">{data.competition || '—'}</p>
                    </div>
                    <div>
                      <p className="font-body text-[10px] font-bold uppercase tracking-[0.2em] text-green-600">Ambiance</p>
                      <p className="mt-0.5 font-body text-sm text-white">{data.style}</p>
                    </div>
                  </div>
                </div>

                {genError && (
                  <p
                    className="px-4 py-3 font-body text-sm text-red-400"
                    style={{ background: 'rgba(153,27,27,0.2)', border: '1px solid rgba(153,27,27,0.4)' }}
                  >
                    {genError}
                  </p>
                )}

                <button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="w-full bg-green-700 py-4 font-body text-sm font-black uppercase tracking-[0.25em] text-white hover:bg-green-600 disabled:opacity-60 transition-colors"
                >
                  {generating ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Génération en cours… (30s environ)
                    </span>
                  ) : (
                    '✦ Générer l\'affiche'
                  )}
                </button>
              </div>
            )}

            {/* Navigation */}
            <div className="mt-10 flex items-center justify-between">
              {step === 0 ? (
                /* No nav on step 0 — selection auto-advances */
                <div />
              ) : step === 4 ? (
                <button
                  onClick={() => setStep(3)}
                  className="font-body text-xs font-bold uppercase tracking-[0.2em] text-slate-500 hover:text-slate-300 transition-colors"
                >
                  ← Modifier le style
                </button>
              ) : (
                <button
                  onClick={() => setStep((s) => Math.max(0, s - 1))}
                  className="font-body text-xs font-bold uppercase tracking-[0.2em] text-slate-500 hover:text-slate-300 transition-colors"
                >
                  ← Retour
                </button>
              )}
              {step >= 1 && step < 4 && (
                <button
                  onClick={() => setStep((s) => Math.min(4, s + 1))}
                  disabled={step === 1 && !data.homeTeam && !data.awayTeam}
                  className="bg-green-700 px-8 py-3 font-body text-xs font-black uppercase tracking-[0.2em] text-white hover:bg-green-600 disabled:opacity-50 transition-colors"
                >
                  Continuer →
                </button>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
