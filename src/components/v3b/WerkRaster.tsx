import { RasterIntro } from '@/features/raster-intro/RasterIntro'
import { kop, werk } from '@/content/teksten'

/**
 * Opening van /work (raster-intro): een bouwtekening tekent zich, het × van het merk verschijnt en de
 * kop schuift woord voor woord in. Eén keer per sessie; klik of toets slaat over; zonder JS of bij
 * minder beweging staat het eindbeeld er meteen. De woorden komen uit `werk.kopRaster`, samen precies
 * de eerste zin van de oude kop; de tweede zin staat eronder.
 */
export function WerkRaster() {
  const [elk, merk, midden, verhaal] = werk.kopRaster
  return (
    <RasterIntro className="werk-raster" aria-labelledby="werk-kop" perSessie>
      <div className="ri__raster" aria-hidden="true">
        <svg viewBox="0 0 1440 720" preserveAspectRatio="xMidYMin slice" focusable="false">
          <line data-ri-lijn="h" x1="0" y1="120" x2="1440" y2="120" />
          <line data-ri-lijn="h" x1="0" y1="240" x2="1440" y2="240" />
          <line data-ri-lijn="h" x1="480" y1="180" x2="960" y2="180" />
          <line data-ri-lijn="h" x1="0" y1="360" x2="1440" y2="360" />
          <line data-ri-lijn="h" x1="0" y1="480" x2="1440" y2="480" />
          <line data-ri-lijn="h" x1="1080" y1="540" x2="1440" y2="540" />
          <line data-ri-lijn="v" x1="120" y1="0" x2="120" y2="600" />
          <line data-ri-lijn="v" x1="360" y1="0" x2="360" y2="720" />
          <line data-ri-lijn="v" x1="600" y1="0" x2="600" y2="480" />
          <line data-ri-lijn="v" x1="840" y1="0" x2="840" y2="600" />
          <line data-ri-lijn="v" x1="1080" y1="0" x2="1080" y2="720" />
          <line data-ri-lijn="v" x1="1320" y1="0" x2="1320" y2="540" />
          {/* een browservenster in schets: kader, adresbalk, drie stippen en een tekstblok */}
          <path data-ri-vorm="" pathLength="1" d="M960 150H1290V390H960Z" />
          <path data-ri-vorm="" pathLength="1" d="M960 186H1290" />
          <circle data-ri-vorm="" pathLength="1" cx="980" cy="168" r="6" />
          <circle data-ri-vorm="" pathLength="1" cx="1000" cy="168" r="6" />
          <circle data-ri-vorm="" pathLength="1" cx="1020" cy="168" r="6" />
          <path data-ri-vorm="" pathLength="1" d="M990 230H1180M990 262H1240M990 294H1120" />
          <path data-ri-vorm="" pathLength="1" d="M990 330H1090V366H990Z" />
          {/* passer en hoeken: het tekenwerk */}
          <circle data-ri-vorm="" pathLength="1" cx="240" cy="120" r="120" />
          <circle data-ri-vorm="" pathLength="1" cx="240" cy="120" r="40" />
          <path data-ri-vorm="" pathLength="1" d="M360 0L480 120M480 0L360 120" />
          <circle data-ri-vorm="" pathLength="1" cx="180" cy="420" r="60" />
          <path data-ri-vorm="" pathLength="1" d="M0 360A120 120 0 0 0 120 240" />
          <circle data-ri-vorm="" pathLength="1" cx="720" cy="120" r="58" />
          <path data-ri-vorm="" pathLength="1" d="M840 600A120 120 0 0 1 1080 600" />
          <circle data-ri-vorm="" pathLength="1" cx="1380" cy="480" r="60" />
        </svg>
      </div>

      <div className="ri__teken">
        <svg viewBox="0 0 120 120" aria-hidden="true" focusable="false">
          <path data-ri-streep="" pathLength="1" d="M34 34L86 86" />
          <path data-ri-streep="" pathLength="1" d="M86 34L34 86" />
          <circle data-ri-streep="" pathLength="1" cx="60" cy="60" r="54" />
        </svg>
        <p className="ri__merk" data-ri-merk="">{kop.merk}</p>
      </div>

      <div className="werk-raster-tekst container-site">
        <h1 className="ri__kop" id="werk-kop">
          <span className="ri__woord ri__woord--klein" data-ri-rij="1">{elk}</span>{' '}
          <span className="ri__woord ri__woord--groot" data-ri-rij="2">{merk}</span>{' '}
          <span className="ri__woord ri__woord--klein" data-ri-rij="2" data-ri-naast="">{midden}</span>{' '}
          <span className="ri__woord ri__woord--groot" data-ri-rij="3" data-ri-rechts="">{verhaal}</span>
        </h1>
        <p className="werk-raster-sub">{werk.kopRasterSub}</p>
      </div>
    </RasterIntro>
  )
}
