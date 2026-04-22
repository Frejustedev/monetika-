// Placeholder Phase 0 — Phase 1 livrera magic link + PIN 6 chiffres.

export default function LoginPage() {
  return (
    <section>
      <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
        Phase 1 · Connexion
      </p>
      <h1
        className="mt-4 font-display font-medium leading-[1.05] tracking-[-0.02em]"
        style={{ fontSize: 'clamp(2rem, 5vw, 3rem)' }}
      >
        Bientôt.
      </h1>
      <p className="mt-6 max-w-md leading-[1.7] text-muted-foreground">
        La connexion sera disponible en Phase 1 (magic link + PIN 6 chiffres).
      </p>
      <div className="rule-ochre mt-8" />
    </section>
  );
}
