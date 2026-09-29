import { ImageResponse } from 'next/og'
import { site } from '@/content/site'

/**
 * App-iconen voor het manifest: de eerste letter van de naam op de accentkleur, met genoeg rand
 * voor `maskable` (Android snijdt tot 20% weg). Een klant met een eigen logo vervangt dit door
 * PNG's in `public/` en past `manifest.ts` aan.
 */
export const dynamic = 'force-static'
export function generateStaticParams() {
  return [{ maat: '192' }, { maat: '512' }]
}

export async function GET(_: Request, { params }: { params: Promise<{ maat: string }> }) {
  const maat = (await params).maat === '192' ? 192 : 512
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: '#101010', color: '#ffffff', fontSize: maat * 0.45, fontWeight: 700,
        }}
      >
        {site.naam.charAt(0).toUpperCase()}
      </div>
    ),
    { width: maat, height: maat },
  )
}
