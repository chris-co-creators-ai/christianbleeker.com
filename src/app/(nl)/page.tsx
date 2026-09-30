import type { Metadata } from 'next'
import { og } from '@/lib/og-velden'
import { Kop } from '@/components/secties/Kop'
import { Voet } from '@/components/secties/Voet'
import { Beeld, OMSLAG } from '@/components/Beeld'
import { EigenProduct } from '@/components/secties/EigenProduct'
import { Dock } from '@/components/Dock'
import { home, werk, casePagina } from '@/content/teksten'
import { cases, caseVoor, homeSelectie } from '@/content/cases'
import { MediaHero } from '@/features/media-hero/MediaHero'
import { HeroWissel } from '@/components/HeroWissel'
import { CountUp } from '@/features/count-up/CountUp'
import { Stapelpanelen } from '@/features/stapelpanelen/StapelpanelenBlok'
import { LottieIcon } from '@/features/lottie-icon/LottieIcon'
import { HoverSet, HoverCard } from '@/features/hover-set/HoverSet'
import { RevealOnScroll } from '@/features/reveal-on-scroll/RevealOnScroll'

export const metadata: Metadata = {
  title: { absolute: home.titel },
  description: home.beschrijving,
  alternates: { canonical: '/' },
  openGraph: og(home.titel, home.beschrijving, '/'),
}

export default function Home() {
  const selectie = homeSelectie.map((s) => caseVoor(s)!)
  const meer = cases.filter((c) => !homeSelectie.includes(c.slug))

  return (
    <>
      <Kop pad="/" />
      <main id="inhoud" tabIndex={-1} className="outline-none flex-1">
        <MediaHero
          modus="diashow"
          className="hero"
          poster="/beeld/tedx-1920.webp"
          aspectRatio="auto"
          dias={[{ src: '/beeld/tedx-1920.webp', srcSet: '/beeld/tedx-768.webp 768w, /beeld/tedx-1280.webp 1280w, /beeld/tedx-1920.webp 1920w, /beeld/tedx-2560.webp 2560w', alt: home.fotoAlt }]}
        >
          <h1 className="hero-kop">
            <span>{home.kop[0]}</span>{' '}
            <span className="hero-regel2">{home.kop[1]}</span>
          </h1>
          <p className="hero-wissel">
            <span className="x" aria-hidden="true">{home.wissel.voor}</span>
            <HeroWissel woorden={home.wissel.woorden} />
          </p>
          <div className="hero-rij">
            <p className="hero-intro">{home.intro}</p>
            <a className="knop" href="/work">
              {home.knop} <span className="pijl" aria-hidden="true">→</span>
            </a>
          </div>
        </MediaHero>

        <RevealOnScroll once threshold={0.01} rootMargin="0px 0px -6% 0px">
          <div className="tel container-site">
            {home.tellers.map((t) => (
              <CountUp key={t.label} waarde={t.waarde} label={t.label} className="tel-item" />
            ))}
          </div>

          <section id="werk" className="sectie container-site">
            <div className="sectie-kop" data-reveal="">
              <p className="nr">01</p>
              <h2>{home.werk.kop}</h2>
              <p className="sectie-tekst">{home.werk.tekst}</p>
            </div>
            <Stapelpanelen
              className="stapel"
              koppen={3}
              mobiel="onder"
              breakpoint={768}
              motor="auto"
              rust={0.2}
              minHoogte={760}
              panelen={selectie.map((c) => ({
                titel: c.naam,
                inhoud: (
                  <div className="stapel-inhoud">
                    <div className="beeld stapel-beeld">
                      <Beeld naam={`${c.slug}-omslag`} {...OMSLAG} sizes="(min-width: 768px) 40vw, 90vw" alt={casePagina.omslagAlt(c.naam)} />
                    </div>
                    <div className="stapel-tekst">
                      <p className="kicker">{werk.kort}</p>
                      <p className="stapel-kort">{c.kort}</p>
                      <a className="knop knop--rand" href={`/work/${c.slug}`}>
                        {home.werk.naarCase}<span className="sr-only">: {c.naam}</span> <span className="pijl" aria-hidden="true">→</span>
                      </a>
                    </div>
                  </div>
                ),
              }))}
            />
            <div className="meer" data-reveal="">
              <div className="meer-kop">
                <h3>{home.meer.kop}</h3>
                <p>{home.meer.ondertitel}</p>
              </div>
              <HoverSet className="meer-rij">
                {meer.map((c) => (
                  <HoverCard
                    key={c.slug}
                    hover="lift"
                    href={`/work/${c.slug}`}
                    title={c.naam}
                    description={c.kort}
                    image={`/beeld/${c.slug}-omslag-480.webp`}
                    linkLabel={casePagina.omslagAlt(c.naam)}
                  />
                ))}
              </HoverSet>
              <a className="knop" href="/work">
                {home.werk.alle} <span className="pijl" aria-hidden="true">→</span>
              </a>
            </div>
          </section>

          <section id="doen" className="sectie container-site">
            <div className="sectie-kop" data-reveal="">
              <p className="nr">02</p>
              <h2>{home.doen.kop}</h2>
            </div>
            <ol className="doen">
              {home.doen.items.map((d, i) => (
                <li key={d.nr} className="doen-item" data-reveal="" data-reveal-delay={String(i * 0.06)}>
                  <LottieIcon src={`/lottie/${d.lottie}.json`} fallbackSrc={`/lottie/${d.lottie}.svg`} size={88} loop className="doen-icoon" />
                  <p className="doen-nr">{d.nr}</p>
                  <h3>{d.titel}</h3>
                  <p className="doen-sub">{d.sub}</p>
                  <p className="doen-tekst">{d.tekst}</p>
                </li>
              ))}
            </ol>
          </section>

          <section id="over" className="sectie container-site over-blok">
            <div className="beeld over-foto" data-reveal="left">
              <Beeld naam="chris-duimen" maten={[540, 900]} breedte={1737} hoogte={3088} sizes="(min-width: 900px) 34vw, 80vw" alt={home.over.fotoAlt} />
            </div>
            <div className="over-tekst" data-reveal="right">
              <p className="nr">03</p>
              <h2>{home.over.kop}</h2>
              <p className="over-alinea">{home.over.tekst}</p>
              <a className="link" href="/about">{home.over.link}</a>
            </div>
          </section>

          <EigenProduct nummer="04" />
        </RevealOnScroll>
      </main>
      <Voet uitnodiging />
      <Dock />
    </>
  )
}
