import type { Metadata } from 'next'
import { og } from '@/lib/og-velden'
import { Kop } from '@/components/secties/Kop'
import { Voet } from '@/components/secties/Voet'
import { Beeld } from '@/components/Beeld'
import { contact, linkedin, home } from '@/content/teksten'
import { AvailabilityBadge } from '@/features/availability-badge/AvailabilityBadge'
import { Intake } from '@/components/v2c/Intake'
import { PakketAdvies } from '@/components/v2c/PakketAdvies'
import { Prijzen } from '@/components/v2c/Prijzen'
import { Kennismaken } from '@/components/v2c/Kennismaken'
import '@/components/v2c/contact-v2.css'
import { HeroMotion } from '@/features/hero-motion/HeroMotion'
import { FloatDecor } from '@/features/float-decor/FloatDecor'
import { GhostText } from '@/features/ghost-text/GhostText'
import '@/components/v3b/beeld.css'
import { Werkwijze } from '@/components/v3x/Werkwijze'
import { site } from '@/content/site'
import { breadcrumbSchema } from '@/lib/schema'

/** Maandnaam van volgende maand (Nederlandse tijd) als tekst zonder JS; availability-badge rekent hem in de browser opnieuw uit. */
const volgendeMaand = () => {
  const [j, m] = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Amsterdam', year: 'numeric', month: '2-digit' }).format(new Date()).split('-').map(Number)
  return new Intl.DateTimeFormat('nl-NL', { month: 'long', timeZone: 'UTC' }).format(new Date(Date.UTC(j, m, 1)))
}

export const metadata: Metadata = {
  title: { absolute: contact.titel },
  description: contact.beschrijving,
  alternates: { canonical: '/contact' },
  openGraph: og(contact.titel, contact.beschrijving, '/contact'),
}

export default function Contact() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema([{ naam: 'Home', url: site.domein }, { naam: contact.kop, url: `${site.domein}/contact` }])) }}
      />
      <Kop pad="/contact" />
      <main id="inhoud" tabIndex={-1} className="outline-none flex-1">
        <section className="container-site contact">
          <HeroMotion className="contact-links" recede={false} fadeBase={0.3} fadeStep={0.1}>
            <h1 className="contact-h1" data-hero-heading=""><span data-hero-line="">{contact.kop}</span><span className="x" aria-hidden="true">×</span></h1>
            <div data-hero-fade=""><AvailabilityBadge className="contact-badge" label={contact.badge} standaardMaand={volgendeMaand()} maandenVooruit={1} /></div>
            <p className="contact-tekst" data-hero-fade="">{contact.tekst}</p>
            <FloatDecor className="contact-foto-kader">
              <div className="contact-foto-houder" data-offset-kader="" data-hero-fade="">
                <div className="contact-foto beeld">
                  <Beeld naam="chris-duimen" maten={[540, 900]} breedte={1737} hoogte={3088} sizes="(min-width: 900px) 24vw, 60vw" alt={home.over.fotoAlt} prioriteit />
                </div>
              </div>
            </FloatDecor>
            <a className="knop knop--rand" href={linkedin} target="_blank" rel="noopener noreferrer" data-hero-fade="">{contact.linkedin}</a>
          </HeroMotion>
          <div className="contact-rechts">
            <Intake />
          </div>
        </section>
        <section id="advies" className="sectie container-site contact-advies" aria-labelledby="advies-kop">
          <div className="sectie-kop">
            <p className="kicker">{contact.advies.kicker}</p>
            <h2 id="advies-kop">{contact.advies.kop}</h2>
            <p className="sectie-tekst">{contact.advies.tekst}</p>
          </div>
          <PakketAdvies />
        </section>
        <section id="prijzen" className="sectie container-site contact-prijzen" aria-labelledby="prijzen-kop">
          <GhostText word="€" parallax className="sectie-kop prijzen-ghost">
            <p className="kicker">{contact.prijzen.kicker}</p>
            <h2 id="prijzen-kop">{contact.prijzen.kop}</h2>
            <p className="sectie-tekst">{contact.prijzen.tekst}</p>
          </GhostText>
          <Prijzen />
        </section>
        <Werkwijze />
        <section className="sectie container-site contact-kennismaken">
          <Kennismaken />
        </section>
      </main>
      <Voet uitnodiging />
    </>
  )
}
