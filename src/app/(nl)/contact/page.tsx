import type { Metadata } from 'next'
import { Kop } from '@/components/secties/Kop'
import { Voet } from '@/components/secties/Voet'
import { Beeld } from '@/components/Beeld'
import { ChecklistKnop } from '@/components/ChecklistKnop'
import { ContactFormulier } from '@/components/ContactFormulier'
import { contact, kop, linkedin, home } from '@/content/teksten'
import { site } from '@/content/site'
import { breadcrumbSchema } from '@/lib/schema'

export const metadata: Metadata = {
  title: { absolute: contact.titel },
  description: contact.beschrijving,
  alternates: { canonical: '/contact' },
  openGraph: { title: contact.titel, description: contact.beschrijving, url: '/contact' },
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
          <div className="contact-links">
            <h1 className="contact-h1">{contact.kop}<span className="x" aria-hidden="true">×</span></h1>
            <p className="contact-tekst">{contact.tekst}</p>
            <div className="contact-foto beeld">
              <Beeld naam="chris-duimen" maten={[540, 900]} breedte={1737} hoogte={3088} sizes="(min-width: 900px) 24vw, 60vw" alt={home.over.fotoAlt} prioriteit />
            </div>
            <a className="knop knop--rand" href={linkedin} target="_blank" rel="noopener noreferrer">{contact.linkedin}</a>
          </div>
          <div className="contact-rechts">
            <ContactFormulier />
            <div className="contact-checklist">
              <h2>{contact.checklist.kop}</h2>
              <p>{contact.checklist.tekst}</p>
              <ChecklistKnop className="knop knop--mint">{kop.checklist}</ChecklistKnop>
            </div>
          </div>
        </section>
      </main>
      <Voet uitnodiging />
    </>
  )
}
