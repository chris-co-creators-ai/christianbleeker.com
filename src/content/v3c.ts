/**
 * v3, maker C (28-10-2026): teksten van de leesstand, de kaarten en de knoppen. Voorstel; alles staat ook in
 * docs/copy-nieuw.md onder "v3 maker C". Geen nieuwe feiten: hergebruik van bestaande zinnen waar dat kan.
 */
export const v3c = {
  leesstand: {
    logoLabel: 'Chris Bleeker, naar de homepage', // voorstel (toegankelijke naam)
    navLabel: 'Leesmenu', // voorstel (naam van het menu in de leesstand)
    sluit: 'Sluit', // voorstel (knop)
  },
  snelContact: {
    label: 'Snel contact', // voorstel
    knop: 'Stuur me een bericht', // bron: de voet
  },
  omslag: {
    draai: (naam: string) => `Draai de omslag van ${naam} om`, // voorstel (toegankelijke naam)
  },
  verder: {
    kop: 'Misschien zocht je dit', // voorstel (404)
  },
}
