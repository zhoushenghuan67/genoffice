/**
 * The single branded tile every document/product surface shows.
 *
 * The reskin replaced the per-type Word/Excel/PowerPoint/Markdown/HTML/PDF
 * glyphs with the HuanOffice cat head (assets/huan-cat.svg), so the file
 * type is read from the name and the extension printed next to the tile.
 */
import catBadge from './assets/huan-cat.svg'

export function FileBadge({ size }: { size: number }) {
  return <img className="cat-badge" src={catBadge} width={size} height={size} alt="" aria-hidden="true" />
}
