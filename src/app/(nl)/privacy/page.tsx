import type { Metadata } from 'next'
import { Kop } from '@/components/secties/Kop'
import { Voet } from '@/components/secties/Voet'
import { privacy } from '@/content/teksten'

export const metadata: Metadata = {
  title: { absolute: privacy.titel },
  description: privacy.beschrijving,
  alternates: { canonical: '/privacy' },
  openGraph: { title: privacy.titel, description: privacy.beschrijving, url: '/privacy' },
}

export default function Privacy() {
  return (
    <>
      <Kop pad="/privacy" />
      <main id="inhoud" tabIndex={-1} className="outline-none flex-1">
        <article className="container-site tekstpagina">
          <h1>{privacy.kop}</h1>
          {privacy.blokken.map((b) => (
            <section key={b.kop}>
              <h2>{b.kop}</h2>
              <p>{b.tekst}</p>
            </section>
          ))}
        </article>
      </main>
      <Voet />
    </>
  )
}
