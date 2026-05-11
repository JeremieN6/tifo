"use client";
import Link from "next/link";
import { useSession } from "next-auth/react";

export default function HeroSection() {
  const { data: session } = useSession();

  return (
    <section className="relative z-10 flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 pb-20 pt-32 md:px-12">
      {/* Stadium glow */}
      <div className="stadium-glow pointer-events-none fixed inset-0 z-0" />

      {/* Grid overlay */}
      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-15"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(22, 163, 74, 0.3) 1px, transparent 1px)",
          backgroundSize: "25% 100%",
        }}
      />

      {/* Big watermark "90" */}
      <div
        aria-hidden="true"
        className="animate-fade-in pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden select-none"
      >
        <span
          className="font-display leading-none text-white/[0.015]"
          style={{
            fontSize: "clamp(10rem, 40vw, 32rem)",
            letterSpacing: "-0.05em",
          }}
        >
          90
        </span>
      </div>

      <div className="relative z-10 mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
        {/* Left column — copy */}
        <div className="flex flex-col items-start">
          {/* Beta badge */}
          <div className="animate-slide-up badge-beta mb-6 inline-flex items-center gap-2 px-4 py-2 font-body text-xs font-bold uppercase tracking-[0.2em]">
            <span
              aria-hidden="true"
              className="h-1.5 w-1.5 rounded-full bg-green-500 cta-pulse"
            />
            Lancement — Prix fondateurs actifs
          </div>

          <h1
            className="animate-slide-up-delay-1 font-display uppercase leading-[0.9] text-white"
            style={{
              fontSize: "clamp(3rem, 7vw, 5.5rem)",
              letterSpacing: "-0.02em",
              textShadow: "0 0 80px rgba(22, 163, 74, 0.1)",
            }}
          >
            Une affiche pro
            <br />
            pour chaque
            <br />
            <span className="text-gradient-green">match.</span>
          </h1>

          <p className="animate-slide-up-delay-2 mt-6 max-w-lg font-body text-base font-medium leading-relaxed text-slate-400 md:text-lg">
            Tifo génère automatiquement des affiches visuelles qui{" "}
            <span className="text-slate-200">
              s&apos;adaptent à l&apos;enjeu du match
            </span>{" "}
            — derby, finale, relégation, titre en jeu. En quelques secondes,
            pour tous les réseaux.
          </p>

          <div className="animate-slide-up-delay-3 mt-10 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <Link
              href={session ? "/create" : "/auth/register"}
              className="group relative overflow-hidden bg-green-700 px-8 py-4 font-body text-sm font-black uppercase tracking-[0.2em] text-white transition-all duration-300 hover:bg-green-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 cta-pulse"
            >
              <span
                aria-hidden="true"
                className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-500 group-hover:translate-x-full"
              />
              <span className="relative z-10 flex items-center gap-3">
                Créer mon affiche
                <svg
                  aria-hidden="true"
                  className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  viewBox="0 0 16 16"
                >
                  <path d="M3 8h10M9 4l4 4-4 4" />
                </svg>
              </span>
            </Link>
            <Link
              href="#fonctionnalites"
              className="font-body text-sm font-semibold uppercase tracking-[0.2em] text-slate-400 transition-colors duration-200 hover:text-green-400"
            >
              Voir les fonctionnalités →
            </Link>
          </div>

          {/* Stats */}
          <div className="animate-fade-in mt-12 flex flex-wrap gap-8 border-t border-green-900/30 pt-8">
            <div className="flex flex-col gap-1">
              <span
                className="font-display text-2xl text-white md:text-3xl"
                style={{ letterSpacing: "0.05em" }}
              >
                &lt; 10s
              </span>
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-green-700">
                Génération
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span
                className="font-display text-2xl text-white md:text-3xl"
                style={{ letterSpacing: "0.05em" }}
              >
                4
              </span>
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-green-700">
                Segments cibles
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span
                className="font-display text-2xl text-white md:text-3xl"
                style={{ letterSpacing: "0.05em" }}
              >
                Tous
              </span>
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-green-700">
                Types de match
              </span>
            </div>
          </div>
        </div>

        {/* Right column — poster preview */}
        <div className="animate-fade-in flex items-center justify-center">
          <div
            className="poster-glow animate-float-poster relative mx-auto w-full max-w-[320px]"
            style={{ transform: "rotate(2deg)" }}
          >
            <div
              className="relative overflow-hidden"
              style={{
                aspectRatio: "3/4",
                background:
                  "linear-gradient(160deg, #0c2416 0%, #020f07 40%, #0a1c0e 100%)",
                border: "1px solid rgba(22, 163, 74, 0.25)",
                boxShadow: "inset 0 0 60px rgba(22, 163, 74, 0.05)",
              }}
            >
              {/* Top green bar */}
              <div className="absolute left-0 right-0 top-0 h-[3px] bg-gradient-to-r from-green-700 via-green-500 to-green-700" />

              {/* Competition badge */}
              <div className="px-6 pt-5 text-center">
                <div
                  className="inline-block px-3 py-1"
                  style={{
                    background: "rgba(22, 163, 74, 0.15)",
                    border: "1px solid rgba(22, 163, 74, 0.3)",
                  }}
                >
                  <span className="font-body text-[9px] font-black uppercase tracking-[0.35em] text-green-400">
                    ⚡ Finale · UEFA Champions League
                  </span>
                </div>
              </div>

              {/* Team colors */}
              <div className="pointer-events-none absolute inset-0 opacity-30">
                <div
                  className="absolute left-0 top-0 h-full w-1/2"
                  style={{
                    background:
                      "radial-gradient(ellipse at 0% 50%, rgba(30, 64, 175, 0.4) 0%, transparent 70%)",
                  }}
                />
                <div
                  className="absolute right-0 top-0 h-full w-1/2"
                  style={{
                    background:
                      "radial-gradient(ellipse at 100% 50%, rgba(124, 45, 18, 0.4) 0%, transparent 70%)",
                  }}
                />
              </div>

              {/* Teams */}
              <div className="relative mt-6 flex items-center justify-between px-6">
                <div className="flex flex-col items-center gap-2">
                  <div
                    className="flex h-14 w-14 items-center justify-center rounded-full"
                    style={{
                      background: "rgba(30, 64, 175, 0.3)",
                      border: "1px solid rgba(59, 130, 246, 0.4)",
                    }}
                  >
                    <span className="font-display text-lg text-blue-300">
                      PSG
                    </span>
                  </div>
                  <div className="text-center">
                    <div className="font-display text-sm tracking-widest text-white">
                      PARIS
                    </div>
                    <div className="font-display text-[10px] tracking-wider text-slate-500">
                      SG
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <span
                    className="font-display text-2xl"
                    style={{
                      color: "#16a34a",
                      textShadow: "0 0 20px rgba(22, 163, 74, 0.5)",
                    }}
                  >
                    VS
                  </span>
                  <div className="text-[8px] font-semibold uppercase tracking-[0.3em] text-slate-600">
                    18:00
                  </div>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div
                    className="flex h-14 w-14 items-center justify-center rounded-full"
                    style={{
                      background: "rgba(124, 45, 18, 0.3)",
                      border: "1px solid rgba(239, 68, 68, 0.4)",
                    }}
                  >
                    <span className="font-display text-lg text-red-300">
                      ACF
                    </span>
                  </div>
                  <div className="text-center">
                    <div className="font-display text-sm tracking-widest text-white">
                      ARSENAL
                    </div>
                    <div className="font-display text-[10px] tracking-wider text-slate-500">
                      FC
                    </div>
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div
                className="mx-6 mt-5 h-px opacity-30"
                style={{
                  background:
                    "linear-gradient(to right, transparent, rgba(22, 163, 74, 0.6), transparent)",
                }}
              />

              {/* Date */}
              <div className="mt-4 px-6 text-center">
                <div className="font-display text-xs tracking-[0.25em] text-white">
                  SAMEDI 30 MAI
                </div>
                <div className="mt-1 font-body text-[9px] font-medium uppercase tracking-widest text-slate-500">
                  Stade Ferenc-Puskás · Budapest
                </div>
              </div>

              {/* Bottom glow */}
              <div
                className="pointer-events-none absolute bottom-0 left-0 right-0 h-20"
                style={{
                  background:
                    "linear-gradient(to top, rgba(22, 163, 74, 0.08), transparent)",
                }}
              />

              {/* Grid texture */}
              <div
                className="pointer-events-none absolute inset-0 opacity-5"
                style={{
                  backgroundImage:
                    "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
                  backgroundSize: "20px 20px",
                }}
              />

              {/* TIFO watermark */}
              <div className="absolute bottom-4 left-0 right-0 text-center">
                <span
                  className="font-display text-[10px] tracking-[0.5em] uppercase"
                  style={{ color: "rgba(22, 163, 74, 0.3)" }}
                >
                  TIFO
                </span>
              </div>
            </div>

            {/* Shadow blob */}
            <div
              className="pointer-events-none absolute -bottom-6 left-1/2 h-8 w-4/5 -translate-x-1/2 blur-xl"
              style={{ background: "rgba(22, 163, 74, 0.2)" }}
            />
          </div>
        </div>
      </div>

      {/* Scroll hint */}
      <div
        className="animate-fade-in pointer-events-none absolute bottom-8 left-1/2 -translate-x-1/2"
        aria-hidden="true"
      >
        <div
          className="flex flex-col items-center gap-2 opacity-30"
          style={{ animation: "fadeIn 1s ease 2s forwards, floatPoster 2s ease-in-out infinite" }}
        >
          <span className="text-[9px] font-semibold uppercase tracking-[0.3em] text-green-600">
            Découvrir
          </span>
          <svg
            className="h-4 w-4 text-green-700"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M8 3v10M4 9l4 4 4-4"></path>
          </svg>
        </div>
      </div>
    </section>
  );
}
