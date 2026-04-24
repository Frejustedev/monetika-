import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Politique de confidentialité',
  description: 'Comment Monétika traite vos données personnelles.',
};

export default function PrivacyPage() {
  return (
    <>
      <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
        Confidentialité
      </p>
      <h1
        className="mt-3 font-display font-medium leading-[1.05] tracking-[-0.02em]"
        style={{ fontSize: 'clamp(2rem, 5vw, 3rem)' }}
      >
        Politique de confidentialité
      </h1>
      <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        Dernière mise à jour : avril 2026
      </p>
      <div className="rule-ochre mt-6" />

      <div className="mt-10 space-y-6 text-base leading-[1.7] text-foreground">
        <section>
          <h2 className="font-display text-xl">1. Données collectées</h2>
          <p className="mt-2 text-muted-foreground">
            Monétika collecte uniquement les données que vous saisissez : email, prénom, nom,
            téléphone (optionnel), pays, devise, comptes, mouvements, budgets, objectifs, PIN
            (stocké sous forme bcryptée, jamais en clair). Aucune donnée bancaire n&rsquo;est
            collectée automatiquement — Monétika ne se connecte à aucune banque ni service de
            paiement.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl">2. Finalité du traitement</h2>
          <p className="mt-2 text-muted-foreground">
            Vos données servent exclusivement à faire fonctionner votre journal financier
            personnel, calculer votre Note d&rsquo;Évolution Financière, afficher vos budgets et
            objectifs. Elles ne sont ni vendues, ni partagées à des tiers à des fins marketing.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl">3. Hébergement</h2>
          <p className="mt-2 text-muted-foreground">
            Vos données sont stockées sur Neon (base Postgres, zone US-East) et Vercel
            (application Next.js). Les e-mails transitent par Resend. Tous ces prestataires sont
            conformes RGPD (SCC ou DPA).
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl">4. Vos droits (RGPD)</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
            <li>
              <strong className="text-foreground">Accès & portabilité</strong> : exportez
              l&rsquo;intégralité de vos données au format JSON depuis <em>Réglages → Zone
              sensible → Exporter mes données</em>.
            </li>
            <li>
              <strong className="text-foreground">Rectification</strong> : modifiez profil,
              préférences, comptes à tout moment depuis l&rsquo;app.
            </li>
            <li>
              <strong className="text-foreground">Effacement</strong> : supprimez votre compte et
              toutes les données liées en un clic depuis <em>Réglages → Zone sensible</em>.
            </li>
            <li>
              <strong className="text-foreground">Opposition</strong> : écrivez à
              privacy@monetika.app.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-xl">5. Cookies</h2>
          <p className="mt-2 text-muted-foreground">
            Monétika utilise trois cookies, tous strictement nécessaires :{' '}
            <code className="font-mono text-sm">authjs.session-token</code> (session chiffrée
            HttpOnly), <code className="font-mono text-sm">NEXT_LOCALE</code> (langue),{' '}
            <code className="font-mono text-sm">NEXT_THEME</code> (thème). Aucun cookie publicitaire.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl">6. Contact</h2>
          <p className="mt-2 text-muted-foreground">
            Pour toute question : privacy@monetika.app.
          </p>
        </section>
      </div>
    </>
  );
}
