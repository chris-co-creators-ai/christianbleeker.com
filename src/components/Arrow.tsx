/**
 * Het pijltje in vol-gekleurde CTA-knoppen ("Doe een aanvraag →", "Aanvraag voor een
 * oplossing →", "Inschrijven →", "Plan een koffie →"). Letterlijke svg-path uit de bron
 * (`viewBox="0 0 20 20"`, `d="M3.5 10h13M11 4.5l5.5 5.5-5.5 5.5"`) — niet op alle knoppen: de
 * secundaire hero-knop ("Bekijk het aanbod") en de kop-knop ("Koffie?") hebben er in de bron
 * geen, dus geef `<Arrow>` alleen mee aan de knoppen die 'm ook echt dragen.
 */
export function Arrow({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 20 20"
      aria-hidden="true"
      className={`size-[1.1em] shrink-0 ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3.5 10h13M11 4.5l5.5 5.5-5.5 5.5" />
    </svg>
  )
}
