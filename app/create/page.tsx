'use client';
import { useState, useRef, useCallback } from 'react';
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
  style: 'Moderne' | 'Vintage' | 'Ultra' | 'Minimaliste';
  homeColors: string;
  awayColors: string;
  description: string;
  referenceImage: File | null;
  referencePreview: string;
}

const STYLES = ['Moderne', 'Vintage', 'Ultra', 'Minimaliste'] as const;
const MAX_DESC = 1500;

// Team search component
function TeamSearch({
  label,
  value,
  logo,
  onChange,
  onLogoChange,
}: {
  label: string;
  value: string;
  logo: string;
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
      <label className="block text-sm font-medium text-gray-300 mb-1">{label}</label>
      <div className="flex items-center gap-3">
        {logo && (
          <Image src={logo} alt={value} width={36} height={36} className="rounded object-contain bg-white/10 p-1" />
        )}
        <input
          type="text"
          value={value}
          onChange={(e) => search(e.target.value)}
          className="flex-1 rounded-md border border-green-900/40 bg-[#0a1a10] px-4 py-2.5 text-white placeholder-gray-600 focus:border-green-500 focus:outline-none"
          placeholder="Ex: PSG, Marseille, Real Madrid…"
        />
      </div>
      {(results.length > 0 || searching) && (
        <div className="absolute z-10 mt-1 w-full rounded-md border border-green-900/40 bg-[#0d1f13] shadow-lg">
          {searching && <div className="px-4 py-2 text-sm text-gray-500">Recherche…</div>}
          {results.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => select(t.name, t.logo)}
              className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-white hover:bg-green-900/20"
            >
              {t.logo && <Image src={t.logo} alt={t.name} width={24} height={24} className="rounded object-contain bg-white/10" />}
              {t.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Step indicators
function StepBar({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }, (_, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
            i < current ? 'bg-green-500 text-black' :
            i === current ? 'border-2 border-green-500 text-green-400' :
            'border border-green-900/40 text-gray-600'
          }`}>
            {i < current ? '✓' : i + 1}
          </div>
          {i < total - 1 && (
            <div className={`h-0.5 w-8 transition-colors ${i < current ? 'bg-green-500' : 'bg-green-900/30'}`} />
          )}
        </div>
      ))}
    </div>
  );
}

export default function CreatePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState('');
  const [genError, setGenError] = useState('');

  const [data, setData] = useState<MatchData>({
    homeTeam: '',
    awayTeam: '',
    homeTeamLogo: '',
    awayTeamLogo: '',
    date: '',
    time: '',
    venue: '',
    style: 'Moderne',
    homeColors: '#1d4ed8',
    awayColors: '#dc2626',
    description: '',
    referenceImage: null,
    referencePreview: '',
  });

  const update = useCallback((patch: Partial<MatchData>) => {
    setData((prev) => ({ ...prev, ...patch }));
  }, []);

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
    formData.append('style', data.style);
    formData.append('colors', `${data.homeColors}, ${data.awayColors}`);
    formData.append('description', data.description.slice(0, MAX_DESC));
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

  const TOTAL_STEPS = 5;

  return (
    <div className="min-h-screen bg-[#020f07]">
      <Navbar />
      <main className="mx-auto max-w-2xl px-4 pb-16 pt-28">
        {/* Result screen */}
        {step === 5 && generatedImage ? (
          <div className="text-center space-y-6 animate-fade-in-up">
            <h1 className="font-display text-4xl uppercase text-white">Ton affiche est prête !</h1>
            <div className="mx-auto max-w-sm overflow-hidden rounded-xl border border-green-900/40">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={generatedImage} alt="Affiche générée" className="w-full" />
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button
                onClick={downloadImage}
                className="rounded-md bg-green-500 px-6 py-3 font-semibold text-black hover:bg-green-400 transition-colors"
              >
                Télécharger l'affiche
              </button>
              <button
                onClick={() => { setStep(0); setGeneratedImage(''); update({ referenceImage: null, referencePreview: '' }); }}
                className="rounded-md border border-green-900/40 px-6 py-3 text-white hover:border-green-500/50 transition-colors"
              >
                Créer une nouvelle affiche
              </button>
              <Link href="/dashboard" className="rounded-md border border-green-900/40 px-6 py-3 text-white hover:border-green-500/50 transition-colors text-center">
                Voir mes affiches
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-8 flex flex-col items-center gap-4">
              <StepBar current={step} total={TOTAL_STEPS} />
              <h1 className="font-display text-4xl uppercase text-white text-center">
                {['Les équipes', 'Les détails', 'Le style', 'La description', 'Génération'][step]}
              </h1>
            </div>

            {/* Step 1 - Teams */}
            {step === 0 && (
              <div className="space-y-6 animate-fade-in-up">
                <TeamSearch
                  label="Équipe domicile"
                  value={data.homeTeam}
                  logo={data.homeTeamLogo}
                  onChange={(v) => update({ homeTeam: v })}
                  onLogoChange={(v) => update({ homeTeamLogo: v })}
                />
                <TeamSearch
                  label="Équipe extérieure"
                  value={data.awayTeam}
                  logo={data.awayTeamLogo}
                  onChange={(v) => update({ awayTeam: v })}
                  onLogoChange={(v) => update({ awayTeamLogo: v })}
                />
              </div>
            )}

            {/* Step 2 - Match details */}
            {step === 1 && (
              <div className="space-y-5 animate-fade-in-up">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Date du match</label>
                  <input
                    type="date"
                    value={data.date}
                    onChange={(e) => update({ date: e.target.value })}
                    className="w-full rounded-md border border-green-900/40 bg-[#0a1a10] px-4 py-2.5 text-white focus:border-green-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Heure du match</label>
                  <input
                    type="time"
                    value={data.time}
                    onChange={(e) => update({ time: e.target.value })}
                    className="w-full rounded-md border border-green-900/40 bg-[#0a1a10] px-4 py-2.5 text-white focus:border-green-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Stade / Lieu</label>
                  <input
                    type="text"
                    value={data.venue}
                    onChange={(e) => update({ venue: e.target.value })}
                    className="w-full rounded-md border border-green-900/40 bg-[#0a1a10] px-4 py-2.5 text-white placeholder-gray-600 focus:border-green-500 focus:outline-none"
                    placeholder="Ex: Parc des Princes, Paris"
                  />
                </div>
              </div>
            )}

            {/* Step 3 - Style */}
            {step === 2 && (
              <div className="space-y-8 animate-fade-in-up">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">Style graphique</label>
                  <div className="grid grid-cols-2 gap-3">
                    {STYLES.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => update({ style: s })}
                        className={`rounded-lg border px-4 py-3 text-sm font-medium transition-colors ${
                          data.style === s
                            ? 'border-green-500 bg-green-500/20 text-green-400'
                            : 'border-green-900/40 text-gray-400 hover:border-green-900/60'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Couleur domicile</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={data.homeColors}
                        onChange={(e) => update({ homeColors: e.target.value })}
                        className="h-10 w-10 rounded cursor-pointer border border-green-900/40 bg-transparent"
                      />
                      <span className="text-sm text-gray-400">{data.homeColors}</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Couleur extérieur</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={data.awayColors}
                        onChange={(e) => update({ awayColors: e.target.value })}
                        className="h-10 w-10 rounded cursor-pointer border border-green-900/40 bg-transparent"
                      />
                      <span className="text-sm text-gray-400">{data.awayColors}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4 - Description */}
            {step === 3 && (
              <div className="space-y-6 animate-fade-in-up">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Description de l'ambiance
                    <span className="ml-2 text-gray-600 font-normal">(optionnel)</span>
                  </label>
                  <textarea
                    value={data.description}
                    onChange={(e) => update({ description: e.target.value.slice(0, MAX_DESC) })}
                    rows={6}
                    className="w-full rounded-md border border-green-900/40 bg-[#0a1a10] px-4 py-3 text-white placeholder-gray-600 focus:border-green-500 focus:outline-none resize-none"
                    placeholder="Décris l'ambiance souhaitée, les éléments visuels importants, le ton de l'affiche…"
                  />
                  <div className="mt-1 text-right text-xs text-gray-600">
                    {data.description.length} / {MAX_DESC}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Image de référence
                    <span className="ml-2 text-gray-600 font-normal">(optionnel — inspire le style)</span>
                  </label>
                  {data.referencePreview ? (
                    <div className="relative inline-block">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={data.referencePreview} alt="Référence" className="h-32 w-auto rounded-lg border border-green-900/40 object-cover" />
                      <button
                        type="button"
                        onClick={() => update({ referenceImage: null, referencePreview: '' })}
                        className="absolute -top-2 -right-2 rounded-full bg-red-600 p-1 text-white text-xs"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-green-900/40 py-8 text-sm text-gray-500 hover:border-green-500/40 hover:text-gray-400 transition-colors"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                      </svg>
                      Uploader une image (PNG/JPG, max 5MB)
                    </button>
                  )}
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

            {/* Step 5 - Recap & Generate */}
            {step === 4 && (
              <div className="space-y-6 animate-fade-in-up">
                <div className="rounded-xl border border-green-900/30 bg-green-950/10 p-6 space-y-3">
                  <h3 className="font-semibold text-white text-lg">Récapitulatif</h3>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <span className="text-gray-500">Match</span>
                    <span className="text-white">{data.homeTeam || '—'} vs {data.awayTeam || '—'}</span>
                    <span className="text-gray-500">Date</span>
                    <span className="text-white">{data.date || '—'} {data.time && `à ${data.time}`}</span>
                    <span className="text-gray-500">Lieu</span>
                    <span className="text-white">{data.venue || '—'}</span>
                    <span className="text-gray-500">Style</span>
                    <span className="text-white">{data.style}</span>
                    <span className="text-gray-500">Image de référence</span>
                    <span className="text-white">{data.referenceImage ? 'Oui' : 'Non'}</span>
                  </div>
                </div>

                {genError && (
                  <p className="rounded-md bg-red-900/30 border border-red-700/40 px-3 py-2 text-sm text-red-400">
                    {genError}
                  </p>
                )}

                <button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="w-full rounded-md bg-green-500 py-4 text-base font-semibold text-black hover:bg-green-400 disabled:opacity-60 transition-colors"
                >
                  {generating ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Génération en cours… (30s environ)
                    </span>
                  ) : 'Générer mon affiche'}
                </button>
              </div>
            )}

            {/* Navigation */}
            <div className="mt-8 flex justify-between">
              <button
                onClick={() => setStep((s) => Math.max(0, s - 1))}
                disabled={step === 0}
                className="rounded-md border border-green-900/40 px-6 py-2.5 text-sm text-gray-400 hover:border-green-500/50 hover:text-white disabled:opacity-40 transition-colors"
              >
                ← Précédent
              </button>
              {step < 4 && (
                <button
                  onClick={() => setStep((s) => Math.min(TOTAL_STEPS - 1, s + 1))}
                  disabled={(step === 0 && !data.homeTeam && !data.awayTeam)}
                  className="rounded-md bg-green-500 px-6 py-2.5 text-sm font-semibold text-black hover:bg-green-400 disabled:opacity-60 transition-colors"
                >
                  Suivant →
                </button>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
