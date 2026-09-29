import type { Metadata } from 'next'
import { Kop } from '@/components/secties/Kop'
import { Voet } from '@/components/secties/Voet'
import { nietGevonden } from '@/content/teksten'

export const metadata: Metadata = { title: nietGevonden.kop, robots: { index: false, follow: true } }

export default function NietGevonden() {
  return (
    <>
      <Kop pad="/404" />
      <main id="inhoud" tabIndex={-1} className="outline-none flex-1">
        <section className="container-site niet-gevonden">
          <p className="niet-gevonden-x" aria-hidden="true">4<span className="x">×</span>4</p>
          <h1>{nietGevonden.kop}</h1>
          <p>{nietGevonden.tekst}</p>
          <a className="knop" href="/">{nietGevonden.home}</a>
        </section>
      </main>
      <Voet />
    </>
  )
}
