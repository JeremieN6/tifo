"use client";
import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setSent(true);
    setLoading(false);
  }

  return (
    <div className="relative min-h-screen bg-[#020f07]">
      {/* Grid overlay */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(22,163,74,1) 1px, transparent 1px), linear-gradient(90deg, rgba(22,163,74,1) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative z-10 mx-auto grid min-h-screen max-w-6xl grid-cols-1 items-center gap-10 px-6 py-12 md:grid-cols-2">
        {/* Left column */}
        <div className="hidden flex-col justify-between py-12 md:flex">
          <Link
            aria-label="Tifo"
            href="/"
            className="font-display text-4xl uppercase"
          >
            <span className="text-white">TI</span>
            <span className="text-green-600">FO</span>
          </Link>

          <div>
            <div className="badge-beta mt-10 mb-8 inline-flex rounded-full border border-green-800/50 items-center gap-2 px-4 py-2 font-body text-xs font-bold uppercase tracking-[0.2em]">
              <span
                aria-hidden="true"
                className="h-1.5 w-1.5 rounded-full bg-green-500"
              />
              Récupération sécurisée
            </div>

            <h1
              className="font-display uppercase leading-[0.9] text-white"
              style={{
                fontSize: "clamp(2.5rem, 5vw, 4.5rem)",
                letterSpacing: "-0.02em",
              }}
            >
              Récupérez l&apos;accès
              <br />à votre <span className="text-gradient-green">compte.</span>
            </h1>

            <p className="mt-6 max-w-sm font-body text-sm leading-relaxed text-slate-400">
              Demandez un lien de réinitialisation depuis votre adresse email
              Tifo. Si un compte existe, nous enverrons un lien valable pendant
              une heure.
            </p>

            <div className="mt-10 grid max-w-xl grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded border border-green-900/40 bg-[#0d1f13]/60 p-4">
                <p className="font-display text-xl uppercase tracking-[0.08em] text-white">
                  Même réponse
                </p>
                <p className="mt-1 font-body text-xs font-semibold uppercase tracking-[0.2em] text-green-700">
                  Envoi discret
                </p>
              </div>
              <div className="rounded border border-green-900/40 bg-[#0d1f13]/60 p-4">
                <p className="font-display text-2xl uppercase tracking-[0.08em] text-white">
                  1 usage
                </p>
                <p className="mt-1 font-body text-xs font-semibold uppercase tracking-[0.2em] text-green-700">
                  Lien unique
                </p>
              </div>
              <div className="rounded border border-green-900/40 bg-[#0d1f13]/60 p-4">
                <p className="font-display text-2xl uppercase tracking-[0.08em] text-white">
                  60 min
                </p>
                <p className="mt-1 font-body text-xs font-semibold uppercase tracking-[0.2em] text-green-700">
                  Durée limitée
                </p>
              </div>
            </div>
          </div>

          <div />
        </div>

        {/* Right column — form */}
        <div className="flex items-center justify-center py-12">
          <div
            className="w-full max-w-md p-8 md:p-10"
            style={{
              background: "rgba(5,46,22,0.15)",
              border: "1px solid rgba(22,163,74,0.2)",
            }}
          >
            {/* Mobile logo */}
            <Link
              aria-label="Tifo"
              href="/"
              className="mb-8 block font-display text-4xl uppercase md:hidden"
            >
              <span className="text-white">TI</span>
              <span className="text-green-600">FO</span>
            </Link>

            {sent ? (
              <div className="space-y-4">
                <p className="font-body text-xs font-bold uppercase tracking-[0.3em] text-green-600">
                  Email envoyé
                </p>
                <h2
                  className="font-display text-3xl uppercase text-white"
                  style={{ letterSpacing: "-0.01em" }}
                >
                  Vérifiez votre boîte
                </h2>
                <p className="font-body text-sm leading-relaxed text-slate-400">
                  Si un compte existe avec cet email, vous recevrez un lien de
                  réinitialisation dans quelques minutes. Pensez à vérifier vos
                  spams.
                </p>
                <Link
                  className="mt-4 block font-body text-sm font-semibold text-green-500 hover:text-green-400 transition-colors"
                  href="/auth/login"
                >
                  Retour à la connexion →
                </Link>
              </div>
            ) : (
              <>
                <p className="font-body text-xs font-bold uppercase tracking-[0.3em] text-green-600">
                  Mot de passe oublié
                </p>
                <h2
                  className="mt-1 font-display text-4xl uppercase text-white"
                  style={{ letterSpacing: "-0.01em" }}
                >
                  Recevoir un lien
                </h2>

                <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
                  <div>
                    <label className="block font-body text-xs font-bold uppercase tracking-[0.2em] text-slate-400 mb-2">
                      Email
                    </label>
                    <input
                      required
                      autoComplete="email"
                      className="w-full bg-[#020f07] px-4 py-3 font-body text-sm text-white placeholder-slate-600 focus:outline-none focus-visible:ring-1 focus-visible:ring-green-600"
                      placeholder="coach@club.fr"
                      style={{ border: "1px solid rgba(22,163,74,0.2)" }}
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>

                  <button
                    disabled={loading}
                    type="submit"
                    className="group relative w-full overflow-hidden bg-green-700 py-4 font-body text-sm font-black uppercase tracking-[0.25em] text-white transition-all duration-300 hover:bg-green-600 disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
                  >
                    <span
                      aria-hidden="true"
                      className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-500 group-hover:translate-x-full"
                    />
                    <span className="relative z-10">
                      {loading
                        ? "Envoi…"
                        : "Envoyer le lien de réinitialisation"}
                    </span>
                  </button>
                </form>

                <p className="mt-6 font-body text-sm text-slate-500">
                  Vous vous souvenez de votre mot de passe ?{" "}
                  <Link
                    className="font-semibold text-green-500 hover:text-green-400 transition-colors"
                    href="/auth/login"
                  >
                    Retour à la connexion
                  </Link>
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
