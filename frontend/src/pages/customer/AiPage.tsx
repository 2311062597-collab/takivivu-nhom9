import {
  Bot,
  CircleHelp,
  Clock3,
  CreditCard,
  Hotel,
  MapPin,
  MessageCircleQuestion,
  Plane,
  RotateCcw,
  Send,
  Sparkles,
  TicketCheck,
  UserRound,
} from 'lucide-react'
import { useMemo, useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { aiApi } from '../../api/services'
import { apiError } from '../../utils/format'
import { useAuth } from '../../contexts/AuthContext'

type Msg = { role: 'user' | 'bot'; text: string; intent?: string; navigateTo?: string | null }

const suggestions = [
  'Tìm chuyến bay phù hợp cho chuyến đi Đà Nẵng',
  'Gợi ý khách sạn phù hợp cho kỳ nghỉ của tôi',
  'Địa điểm tham quan nổi bật nên đi ở Đà Nẵng?',
  'Hướng dẫn tôi kiểm tra một đơn đặt dịch vụ',
]

function bookingCodeFrom(text: string) {
  return text.toUpperCase().match(/\b(?:BKV|TKV)[A-Z0-9-]{5,}\b/)?.[0]
}

function safeNavigate(path?: string | null) {
  if (!path) return null
  const allowed = ['/flights','/hotels','/attractions','/bookings','/payments/new','/promotions']
  return allowed.some(prefix => path.startsWith(prefix)) ? path : null
}

export default function AiPage() {
  const { session } = useAuth()
  const [msgs, setMsgs] = useState<Msg[]>([{ role: 'bot', text: 'Xin chào! Tôi là TAKIVIVU AI. Tôi có thể tư vấn dựa trên dữ liệu chuyến bay, khách sạn và địa điểm hiện có trong hệ thống. Bạn đang muốn lên kế hoạch cho hành trình nào?' }])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [mode, setMode] = useState<'auto'|'recommend'|'booking'>('auto')
  const navigate = useNavigate()
  const bottomRef = useRef<HTMLDivElement | null>(null)

  const userName = useMemo(() => session?.hoTen || 'bạn', [session])

  const ask = async (raw: string) => {
    const text = raw.trim()
    if (!text || busy) return
    setInput('')
    setMsgs(x => [...x, { role: 'user', text }])
    setBusy(true)
    try {
      const code = bookingCodeFrom(text)
      const lower = text.toLowerCase()
      let response
      if (code && /hủy|huỷ|cancel/.test(lower)) response = await aiApi.cancelHelp(code)
      else if (code && /thanh toán|payment|đã trả|chuyển khoản/.test(lower)) response = await aiApi.paymentHelp(code)
      else if (code || mode === 'booking' || /đơn đặt|booking|đơn hàng/.test(lower)) response = await aiApi.bookingHelp(text, code)
      else if (mode === 'recommend' || /chuyến bay|khách sạn|tham quan|du lịch|đi đâu|gợi ý|vé/.test(lower)) response = await aiApi.recommend(text)
      else response = await aiApi.chat(text)
      setMsgs(x => [...x, { role: 'bot', text: response.answer, intent: response.intent, navigateTo: safeNavigate(response.navigateTo) }])
    } catch (e) {
      setMsgs(x => [...x, { role: 'bot', text: `Không thể lấy phản hồi từ AI Service: ${apiError(e)}` }])
    } finally {
      setBusy(false)
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
    }
  }

  const submit = async (e: FormEvent) => { e.preventDefault(); await ask(input) }
  const clear = () => setMsgs([{ role: 'bot', text: `Xin chào ${userName}! Cuộc trò chuyện mới đã bắt đầu. Bạn cần tôi hỗ trợ điều gì?` }])

  const quick = [
    { icon: Plane, label: 'Tìm chuyến bay', prompt: 'Gợi ý cho tôi chuyến bay phù hợp với nhu cầu hiện tại.', mode: 'recommend' as const },
    { icon: Hotel, label: 'Tìm khách sạn', prompt: 'Gợi ý khách sạn phù hợp từ dữ liệu hiện có.', mode: 'recommend' as const },
    { icon: MapPin, label: 'Tìm vé tham quan', prompt: 'Gợi ý địa điểm tham quan và vé phù hợp từ dữ liệu hiện có.', mode: 'recommend' as const },
    { icon: CreditCard, label: 'Hỗ trợ thanh toán', prompt: 'Hướng dẫn tôi kiểm tra trạng thái thanh toán. Tôi sẽ cung cấp mã Booking.', mode: 'booking' as const },
    { icon: TicketCheck, label: 'Kiểm tra đơn', prompt: 'Hướng dẫn tôi kiểm tra một đơn đặt dịch vụ bằng mã Booking.', mode: 'booking' as const },
  ]

  return <div className="customer-ai-shell-v5">
    <div className="container customer-ai-wrap-v5">
      <aside className="customer-ai-sidebar-v5">
        <div className="customer-ai-brand-v5"><span><Bot/></span><div><b>TAKIVIVU AI</b><small>Trợ lý du lịch thông minh</small></div></div>
        <p className="customer-ai-powered-v5"><Sparkles/> Phản hồi được xử lý qua AI Service của TAKIVIVU.</p>
        <h3>Tôi có thể giúp bạn</h3>
        <div className="customer-ai-quick-v5">{quick.map(({icon:Icon,label,prompt,mode:m}) => <button key={label} onClick={() => { setMode(m); setInput(prompt) }}><Icon/>{label}</button>)}</div>
        <h3>Gợi ý câu hỏi</h3>
        <div className="customer-ai-suggestions-v5">{suggestions.map(s => <button key={s} onClick={() => setInput(s)}>“{s}”</button>)}</div>
        <div className="customer-ai-warning-v5"><CircleHelp/><div><b>AI chỉ tư vấn và hỗ trợ</b><p>AI không tự đặt dịch vụ, thanh toán, hủy hoặc hoàn tiền thay bạn.</p></div></div>
      </aside>

      <section className="customer-ai-chat-v5">
        <header className="customer-ai-chat-head-v5">
          <div className="customer-ai-chat-title-v5"><span><Bot/></span><div><h1>AI hỗ trợ du lịch</h1><p><i/> Online · dùng dữ liệu dịch vụ hiện có</p></div></div>
          <button onClick={clear}><Clock3/>Cuộc trò chuyện mới</button>
        </header>

        <div className="customer-ai-messages-v5">
          {msgs.map((m, i) => <div key={i} className={`customer-ai-message-v5 ${m.role}`}>
            <div className="customer-ai-message-avatar-v5">{m.role === 'bot' ? <Bot/> : <UserRound/>}</div>
            <div className="customer-ai-bubble-v5">
              <p>{m.text}</p>
              {m.intent && <small>AI Service · {m.intent}</small>}
              {m.navigateTo && <button onClick={() => navigate(m.navigateTo!)}>Mở chức năng liên quan →</button>}
            </div>
          </div>)}
          {busy && <div className="customer-ai-message-v5 bot"><div className="customer-ai-message-avatar-v5"><Bot/></div><div className="customer-ai-bubble-v5 customer-ai-typing-v5"><span/><span/><span/> AI đang xử lý dữ liệu...</div></div>}
          <div ref={bottomRef}/>
        </div>

        <div className="customer-ai-mode-v5"><span>Chế độ:</span><button className={mode === 'auto' ? 'active' : ''} onClick={() => setMode('auto')}>Tự động</button><button className={mode === 'recommend' ? 'active' : ''} onClick={() => setMode('recommend')}>Gợi ý du lịch</button><button className={mode === 'booking' ? 'active' : ''} onClick={() => setMode('booking')}>Hỗ trợ Booking</button></div>
        <form className="customer-ai-input-v5" onSubmit={submit}><button type="button" className="customer-ai-reset-v5" onClick={clear} title="Cuộc trò chuyện mới"><RotateCcw/></button><input value={input} onChange={e => setInput(e.target.value)} placeholder="Nhập câu hỏi của bạn..."/><button disabled={busy || !input.trim()}><Send/></button></form>
        <div className="customer-ai-foot-v5"><MessageCircleQuestion/><span>Thông tin từ trợ lý AI có tính chất hỗ trợ. Giá, tình trạng còn chỗ, đơn đặt và thanh toán luôn được hệ thống xác nhận lại.</span><Link to="/bookings">Đơn của tôi</Link></div>
      </section>
    </div>
  </div>
}
