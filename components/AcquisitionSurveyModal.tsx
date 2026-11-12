'use client';

import { useEffect, useRef, useState } from 'react';

type Channel = 'chatgpt' | 'google' | 'instagram' | 'proche' | 'autre';

const CHANNELS: Array<{ value: Channel; label: string }> = [
  { value: 'chatgpt', label: 'ChatGPT' },
  { value: 'google', label: 'Google' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'proche', label: 'Un proche, un club, le bouche-à-oreille' },
  { value: 'autre', label: 'Autre' },
];

// Deuxième question, adaptée à la réponse (jamais de formulation qui évoque un suivi).
function followUpQuestion(channel: Channel): string | null {
  switch (channel) {
    case 'chatgpt':
      return 'Qu’avez-vous demandé à ChatGPT qui vous a amené sur Tifo ?';
    case 'google':
      return 'Qu’avez-vous tapé dans Google pour arriver sur Tifo ?';
    case 'instagram':
    case 'proche':
      return 'Qu’est-ce qui vous a donné envie d’essayer Tifo ?';
    default:
      return null;
  }
}

type Step = 'channel' | 'followup' | 'thanks';

export default function AcquisitionSurveyModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<Step>('channel');
  const [channel, setChannel] = useState<Channel | null>(null);
  const [channelOther, setChannelOther] = useState('');
  const [queryText, setQueryText] = useState('');
  const [sending, setSending] = useState(false);
  const answeredRef = useRef(false);

  async function post(payload: Record<string, unknown>) {
    try {
      await fetch('/api/acquisition-survey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch {
      // Sans importance pour l'utilisateur : on ne l'embête pas avec une erreur.
    }
  }

  async function dismiss() {
    if (!answeredRef.current) {
      answeredRef.current = true;
      await post({ action: 'dismiss' });
    }
    onClose();
  }

  async function submit(withQuery: boolean) {
    if (!channel || sending) return;
    setSending(true);
    answeredRef.current = true;
    await post({
      action: 'answer',
      channel,
      channelOther: channel === 'autre' ? channelOther : undefined,
      queryText: withQuery ? queryText : undefined,
    });
    setSending(false);
    setStep('thanks');
  }

  function handleContinue() {
    if (!channel) return;
    if (followUpQuestion(channel)) {
      setStep('followup');
    } else {
      void submit(false);
    }
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') void dismiss();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (step !== 'thanks') return;
    const timer = setTimeout(onClose, 2500);
    return () => clearTimeout(timer);
  }, [step, onClose]);

  const question = channel ? followUpQuestion(channel) : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="acquisition-survey-title"
    >
      <div
        className="w-full max-w-md bg-[#052e16] p-6 shadow-2xl"
        style={{ border: '1px solid rgba(22,163,74,0.4)' }}
      >
        {step === 'thanks' ? (
          <div className="space-y-4 text-center">
            <h2 id="acquisition-survey-title" className="font-display text-2xl uppercase text-white">
              Merci !
            </h2>
            <p className="font-body text-sm text-slate-300">
              Votre réponse nous aide à améliorer Tifo pour les clubs comme le vôtre.
            </p>
            <button
              onClick={onClose}
              className="bg-green-700 px-5 py-2 font-body text-xs font-black uppercase tracking-[0.2em] text-white transition-colors hover:bg-green-600"
            >
              Fermer
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-body text-[10px] font-bold uppercase tracking-[0.3em] text-green-500">
                  Une petite question
                </p>
                <h2 id="acquisition-survey-title" className="mt-1 font-display text-2xl uppercase text-white">
                  {step === 'channel' ? 'Où avez-vous connu Tifo ?' : question}
                </h2>
              </div>
              <button
                onClick={() => void dismiss()}
                aria-label="Fermer"
                className="font-body text-xl leading-none text-slate-400 transition-colors hover:text-white"
              >
                ×
              </button>
            </div>

            {step === 'channel' ? (
              <>
                <div className="space-y-2">
                  {CHANNELS.map((item) => (
                    <label
                      key={item.value}
                      className="flex cursor-pointer items-center gap-3 px-3 py-2 font-body text-sm text-slate-200 transition-colors hover:bg-green-900/40"
                      style={{
                        border: `1px solid ${channel === item.value ? 'rgba(34,197,94,0.8)' : 'rgba(22,163,74,0.25)'}`,
                      }}
                    >
                      <input
                        type="radio"
                        name="acquisition-channel"
                        value={item.value}
                        checked={channel === item.value}
                        onChange={() => setChannel(item.value)}
                        className="accent-green-500"
                      />
                      {item.label}
                    </label>
                  ))}
                </div>
                {channel === 'autre' && (
                  <input
                    type="text"
                    value={channelOther}
                    onChange={(event) => setChannelOther(event.target.value)}
                    maxLength={200}
                    placeholder="Précisez (facultatif)"
                    className="w-full bg-[#020f07] px-3 py-2 font-body text-sm text-white placeholder:text-slate-500 focus:outline-none"
                    style={{ border: '1px solid rgba(22,163,74,0.3)' }}
                  />
                )}
                <div className="flex items-center justify-between gap-3 pt-1">
                  <button
                    onClick={() => void dismiss()}
                    className="font-body text-xs text-slate-400 transition-colors hover:text-white"
                  >
                    Non merci
                  </button>
                  <button
                    onClick={handleContinue}
                    disabled={!channel || sending}
                    className="bg-green-700 px-5 py-2 font-body text-xs font-black uppercase tracking-[0.2em] text-white transition-colors hover:bg-green-600 disabled:opacity-40"
                  >
                    {channel === 'autre' ? 'Envoyer' : 'Continuer'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <textarea
                  value={queryText}
                  onChange={(event) => setQueryText(event.target.value)}
                  maxLength={600}
                  rows={4}
                  placeholder="Votre réponse (facultatif)"
                  className="w-full resize-none bg-[#020f07] px-3 py-2 font-body text-sm text-white placeholder:text-slate-500 focus:outline-none"
                  style={{ border: '1px solid rgba(22,163,74,0.3)' }}
                />
                <p className="font-body text-[11px] text-slate-400">
                  Facultatif : ça nous aide à mieux répondre aux clubs comme le vôtre. N’indiquez pas de données
                  personnelles.
                </p>
                <div className="flex items-center justify-between gap-3">
                  <button
                    onClick={() => void submit(false)}
                    disabled={sending}
                    className="font-body text-xs text-slate-400 transition-colors hover:text-white disabled:opacity-40"
                  >
                    Passer cette question
                  </button>
                  <button
                    onClick={() => void submit(true)}
                    disabled={sending}
                    className="bg-green-700 px-5 py-2 font-body text-xs font-black uppercase tracking-[0.2em] text-white transition-colors hover:bg-green-600 disabled:opacity-40"
                  >
                    Envoyer
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
