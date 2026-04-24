import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Conditions générales d\u2019utilisation',
  description: 'Les conditions qui régissent l\u2019usage de Monétika.',
};

export default function TermsPage() {
  return (
    <>
      <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
        Conditions
      </p>
      <h1
        className="mt-3 font-display font-medium leading-[1.05] tracking-[-0.02em]"
        style={{ fontSize: 'clamp(2rem, 5vw, 3rem)' }}
      >
        Conditions générales d&rsquo;utilisation
      </h1>
      <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        Dernière mise à jour : avril 2026
      </p>
      <div className="rule-ochre mt-6" />

      <div className="mt-10 space-y-6 text-base leading-[1.7] text-foreground">
        <section>
          <h2 className="font-display text-xl">1. Nature du service</h2>
          <p className="mt-2 text-muted-foreground">
            Monétika est un outil de tenue de livre personnel. L&rsquo;application n&rsquo;est
            <strong className="text-foreground"> ni une banque, ni un établissement de paiement,
            ni un conseiller en investissement</strong>. Elle ne se connecte à aucune
            institution financière. Vous saisissez vous-même vos chiffres.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl">2. Exactitude des données</h2>
          <p className="mt-2 text-muted-foreground">
            Les calculs affichés (solde net, Note d&rsquo;Évolution Financière, progression
            d&rsquo;objectifs) dépendent des données que vous saisissez. Monétika ne garantit
            aucune exactitude si les données sont incomplètes ou erronées.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl">3. Responsabilité</h2>
          <p className="mt-2 text-muted-foreground">
            Monétika est fourni « en l&rsquo;état ». Les décisions financières prises sur la
            base des données affichées relèvent de la seule responsabilité de
            l&rsquo;utilisateur. Monétika décline toute responsabilité en cas de perte,
            d&rsquo;erreur de saisie ou de mauvaise interprétation.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl">4. Disponibilité</h2>
          <p className="mt-2 text-muted-foreground">
            Le service est hébergé sur Vercel et Neon. Des interruptions peuvent survenir pour
            maintenance ou incidents tiers. Aucun SLA n&rsquo;est garanti sur cette V1.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl">5. Résiliation</h2>
          <p className="mt-2 text-muted-foreground">
            Vous pouvez supprimer votre compte à tout moment depuis{' '}
            <em>Réglages → Zone sensible → Supprimer mon compte</em>. La suppression est
            immédiate et irréversible.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl">6. Droit applicable</h2>
          <p className="mt-2 text-muted-foreground">
            Droit français à défaut de disposition contraire. Tout litige relève des tribunaux
            compétents du ressort où Monétika a son siège social.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl">7. Contact</h2>
          <p className="mt-2 text-muted-foreground">
            Pour toute question : legal@monetika.app.
          </p>
        </section>
      </div>
    </>
  );
}
