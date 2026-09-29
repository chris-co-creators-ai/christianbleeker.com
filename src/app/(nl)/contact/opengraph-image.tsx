import { contact } from '@/content/teksten'
import { ogImage, OG_SIZE } from '@/lib/og'

export const alt = contact.titel
export const size = OG_SIZE
export const contentType = 'image/png'

export default function Image() {
  return ogImage(contact.kop, contact.beschrijving)
}
