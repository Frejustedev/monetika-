// Placeholder Phase 0 — implémentation complète en Phase 1.
// L'écran final portera la création de compte (email, prénom, nom, téléphone).

export default function SignupPage() {
  return (
    <section>
      <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
        Phase 1 · Création de compte
      </p>
      <h1
        className="mt-4 font-display font-medium leading-[1.05] tracking-[-0.02em]"
        style={{ fontSize: 'clamp(2rem, 5vw, 3rem)' }}
      >
        Bientôt.
      </h1>
      <p className="mt-6 max-w-md leading-[1.7] text-muted-foreground">
        L’inscription sera disponible en Phase 1 (authentification & onboarding).
      </p>
      <div className="rule-ochre mt-8" />
    </section>
  );
}
