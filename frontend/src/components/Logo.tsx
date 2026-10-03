import { Send } from 'lucide-react'
export default function Logo({ compact = false }: { compact?: boolean }) {
  return <div className="brand"><span className="brand-icon"><Send size={20} /></span><div><strong>TAKIVIVU</strong>{!compact && <small>Niềm vui trên mỗi hành trình</small>}</div></div>
}
