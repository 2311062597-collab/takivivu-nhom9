import { useEffect, useState } from 'react'
import { googleMapEmbed, mapLinksFromEmbed } from '../utils/googleMaps'

export function GoogleMapFrame({ src, title, loading = 'lazy' }: { src: string; title: string; loading?: 'lazy' | 'eager' }) {
  const [failed, setFailed] = useState(false)
  useEffect(() => setFailed(false), [src])
  const links = mapLinksFromEmbed(src)
  if (!links) return <div role="status" style={{ padding: 20, color: '#666' }}>Nhập địa chỉ để xem vị trí trên bản đồ.</div>
  return <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: 200 }}>
    {failed ? <div role="status" style={{ padding: '56px 20px 20px' }}>Bản đồ chưa tải được. Bạn có thể mở Google Maps bằng nút phía trên.</div>
      : <iframe key={src} title={title} src={src} loading={loading} referrerPolicy="strict-origin-when-cross-origin" allowFullScreen onError={() => setFailed(true)} style={{ display: 'block', width: '100%', height: '100%', minHeight: 200, border: 0 }} />}
    <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <a href={links.view} target="_blank" rel="noopener noreferrer" style={linkStyle}>Mở Google Maps</a>
      <a href={links.directions} target="_blank" rel="noopener noreferrer" style={linkStyle}>Chỉ đường</a>
    </div>
  </div>
}
const linkStyle = { background: '#fff', color: '#1261a0', padding: '7px 10px', border: '1px solid #d5dce5', borderRadius: 5, fontSize: 12, fontWeight: 600, textDecoration: 'none', boxShadow: '0 1px 4px #0002' } as const

/** Editing the form updates only a public map preview; it never writes coordinates into the form. */
export function GoogleMapAddressPreview({ latitude, longitude, address, title = 'Vị trí trên Google Maps' }: {
  latitude?: number; longitude?: number; address: string; title?: string
}) {
  const nextUrl = googleMapEmbed(latitude, longitude, address)
  const [previewUrl, setPreviewUrl] = useState(nextUrl)
  useEffect(() => {
    const timer = window.setTimeout(() => setPreviewUrl(nextUrl), 650)
    return () => window.clearTimeout(timer)
  }, [nextUrl])
  return <GoogleMapFrame title={title} src={previewUrl} />
}
