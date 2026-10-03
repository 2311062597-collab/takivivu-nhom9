import { FileText, LockKeyhole, ShieldCheck, UserRound, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

type LegalType = 'terms' | 'privacy'
type LegalSection = {
  title: string
  text: string
  bullets?: string[]
  accent?: 'green' | 'red'
}

const terms: LegalSection[] = [
  {
    title: 'Quy định chung',
    text: 'Điều khoản sử dụng này áp dụng cho tất cả người đăng ký truy cập và sử dụng nền tảng TAKIVIVU. Khi đăng ký tài khoản hoặc tiếp tục sử dụng dịch vụ, bạn xác nhận đã đọc, hiểu và đồng ý bị ràng buộc bởi các điều khoản này.',
  },
  {
    title: 'Tài khoản người dùng',
    text: 'Bạn phải cung cấp thông tin chính xác, đầy đủ và cập nhật khi đăng ký tài khoản. Bạn chịu trách nhiệm bảo mật thông tin tài khoản và mọi hoạt động phát sinh từ tài khoản của mình.',
    bullets: [
      'Không chia sẻ mật khẩu hoặc thông tin đăng nhập cho người khác.',
      'Thông báo cho TAKIVIVU khi phát hiện truy cập hoặc hoạt động bất thường.',
    ],
  },
  {
    title: 'Sử dụng dịch vụ',
    text: 'Bạn đồng ý sử dụng các dịch vụ cho mục đích hợp pháp và tuân thủ mọi quy định hiện hành. Thông tin về giá, tình trạng chỗ, lịch trình và điều kiện dịch vụ có thể thay đổi theo từng nhà cung cấp.',
    bullets: [
      'Không sử dụng dịch vụ để thực hiện hành vi gian lận, vi phạm pháp luật hoặc gây ảnh hưởng đến hệ thống.',
      'TAKIVIVU có quyền từ chối hoặc tạm ngưng cung cấp dịch vụ khi phát hiện hành vi vi phạm điều khoản.',
    ],
  },
  {
    title: 'Quyền và nghĩa vụ',
    text: 'Người dùng có quyền được cung cấp thông tin rõ ràng, được hỗ trợ trong phạm vi dịch vụ và được bảo vệ dữ liệu theo chính sách của TAKIVIVU. Đồng thời, người dùng có nghĩa vụ cung cấp thông tin trung thực và tuân thủ quy trình đặt dịch vụ.',
  },
  {
    title: 'Thanh toán và hoàn tiền',
    text: 'Thanh toán, hoàn tiền và các khoản phí liên quan được thực hiện theo điều kiện của từng dịch vụ, phương thức thanh toán và chính sách của nhà cung cấp tại thời điểm giao dịch.',
  },
  {
    title: 'Hủy dịch vụ',
    text: 'Điều kiện hủy hoặc thay đổi phụ thuộc vào loại dịch vụ và nhà cung cấp. Một số giao dịch có thể phát sinh phí hủy hoặc không đủ điều kiện hoàn tiền.',
  },
  {
    title: 'Miễn trừ trách nhiệm',
    text: 'TAKIVIVU không chịu trách nhiệm đối với gián đoạn do sự kiện bất khả kháng, thay đổi từ nhà cung cấp hoặc lỗi của bên thứ ba nằm ngoài khả năng kiểm soát hợp lý.',
  },
  {
    title: 'Thay đổi điều khoản',
    text: 'TAKIVIVU có thể cập nhật điều khoản để phù hợp với hoạt động thực tế, tính năng mới hoặc quy định pháp luật. Phiên bản mới có hiệu lực kể từ thời điểm được công bố trên hệ thống.',
  },
  {
    title: 'Luật áp dụng',
    text: 'Các điều khoản này được giải thích và áp dụng theo pháp luật Việt Nam. Tranh chấp phát sinh được ưu tiên giải quyết thông qua thương lượng trước khi áp dụng các biện pháp pháp lý khác.',
  },
  {
    title: 'Liên hệ',
    text: 'Nếu có câu hỏi về điều khoản sử dụng, vui lòng liên hệ bộ phận hỗ trợ TAKIVIVU qua các kênh hỗ trợ được công bố trên hệ thống.',
  },
]

const privacy: LegalSection[] = [
  {
    title: 'Thông tin chúng tôi thu thập',
    text: 'Chúng tôi có thể thu thập các thông tin cần thiết để tạo tài khoản, xác nhận danh tính và cung cấp dịch vụ.',
    bullets: [
      'Thông tin cá nhân: họ tên, email, số điện thoại, địa chỉ, thông tin ngày sinh khi cần thiết.',
      'Thông tin giao dịch: lịch sử đặt dịch vụ, thanh toán, phản hồi và đánh giá.',
      'Thông tin thiết bị: địa chỉ IP, loại trình duyệt, hệ điều hành và dữ liệu kỹ thuật phục vụ an toàn hệ thống.',
      'Thông tin từ cookie và công nghệ tương tự khi bạn sử dụng dịch vụ.',
    ],
  },
  {
    title: 'Mục đích sử dụng thông tin',
    text: 'Chúng tôi sử dụng thông tin của bạn để vận hành tài khoản, cung cấp dịch vụ, xác nhận đặt chỗ và hỗ trợ trong suốt quá trình sử dụng.',
    bullets: [
      'Cung cấp, duy trì và cải thiện dịch vụ.',
      'Xử lý giao dịch, xác nhận đặt dịch vụ và thanh toán.',
      'Gửi thông báo, cập nhật phù hợp với nhu cầu của bạn.',
      'Đảm bảo an toàn, bảo mật và ngăn chặn gian lận.',
    ],
  },
  {
    title: 'Chia sẻ thông tin',
    text: 'Chúng tôi không bán thông tin cá nhân của bạn. Dữ liệu chỉ được chia sẻ trong phạm vi cần thiết để cung cấp dịch vụ hoặc khi có yêu cầu hợp pháp.',
    bullets: [
      'Với nhà cung cấp dịch vụ như khách sạn, hãng vận chuyển hoặc điểm tham quan để thực hiện đặt chỗ.',
      'Với đối tác thanh toán để xử lý giao dịch an toàn.',
      'Với cơ quan có thẩm quyền khi pháp luật yêu cầu.',
      'Trong trường hợp cần bảo vệ quyền, tài sản và sự an toàn của TAKIVIVU hoặc người dùng khác.',
    ],
  },
  {
    title: 'Lưu trữ và bảo mật',
    text: 'Chúng tôi áp dụng các biện pháp kỹ thuật và tổ chức phù hợp để bảo vệ dữ liệu cá nhân khỏi truy cập trái phép, mất mát hoặc lạm dụng. Dữ liệu được lưu trữ trong thời gian cần thiết cho mục đích cung cấp dịch vụ và nghĩa vụ pháp lý.',
  },
  {
    title: 'Quyền của bạn',
    text: 'Bạn có thể yêu cầu xem, cập nhật hoặc chỉnh sửa thông tin cá nhân trong phạm vi pháp luật cho phép. Một số dữ liệu có thể cần được giữ lại để đáp ứng nghĩa vụ giao dịch, kế toán hoặc pháp lý.',
  },
  {
    title: 'Cookie và công nghệ tương tự',
    text: 'TAKIVIVU có thể sử dụng cookie, bộ nhớ trình duyệt và công nghệ tương tự để duy trì phiên đăng nhập, ghi nhớ tùy chọn, đo lường hiệu năng và cải thiện trải nghiệm.',
  },
  {
    title: 'Thay đổi chính sách',
    text: 'Chính sách bảo mật có thể được điều chỉnh khi tính năng, quy trình hoặc quy định pháp luật thay đổi. Nội dung cập nhật sẽ được công bố trên hệ thống trước hoặc tại thời điểm có hiệu lực.',
  },
  {
    title: 'Liên hệ',
    text: 'Nếu bạn có câu hỏi liên quan đến quyền riêng tư hoặc xử lý dữ liệu cá nhân, vui lòng liên hệ bộ phận hỗ trợ TAKIVIVU qua các kênh được công bố trên hệ thống.',
  },
]

export default function LegalModal({ type, onClose }: { type: LegalType; onClose: () => void }) {
  const isTerms = type === 'terms'
  const sections = isTerms ? terms : privacy
  const [active, setActive] = useState(0)
  const contentRef = useRef<HTMLElement>(null)

  useEffect(() => {
    setActive(0)
  }, [type])

  useEffect(() => {
    const closeOnEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', closeOnEsc)
    const oldOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', closeOnEsc)
      document.body.style.overflow = oldOverflow
    }
  }, [onClose])

  const jumpTo = (index: number) => {
    setActive(index)
    const el = contentRef.current?.querySelector<HTMLElement>(`[data-legal-section="${index}"]`)
    if (el && contentRef.current) {
      contentRef.current.scrollTo({ top: el.offsetTop - 26, behavior: 'smooth' })
    }
  }

  const handleScroll = () => {
    const root = contentRef.current
    if (!root) return
    const rootTop = root.getBoundingClientRect().top
    let nearest = 0
    let distance = Number.POSITIVE_INFINITY
    root.querySelectorAll<HTMLElement>('[data-legal-section]').forEach((el, index) => {
      const d = Math.abs(el.getBoundingClientRect().top - rootTop - 28)
      if (d < distance) { distance = d; nearest = index }
    })
    setActive(nearest)
  }

  return (
    <div className="legal-backdrop reference-legal-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="legal-modal reference-legal-modal" role="dialog" aria-modal="true" aria-labelledby="legal-title" onMouseDown={e => e.stopPropagation()}>
        <header className="legal-head reference-legal-head">
          <div className="legal-brand">
            <span className="legal-mark">➤</span>
            <strong>TAKIVIVU</strong>
          </div>
          <button type="button" className="legal-close" onClick={onClose}>Đóng <X /></button>
        </header>

        <div className="legal-body reference-legal-body">
          <aside className="legal-nav reference-legal-nav">
            <nav>
              {sections.map((section, index) => (
                <button key={section.title} type="button" className={active === index ? 'active' : ''} onClick={() => jumpTo(index)}>
                  <span>{index + 1}.</span>{section.title}
                </button>
              ))}
            </nav>
            <div className={`legal-art ${isTerms ? 'terms-art' : 'privacy-art'}`} aria-hidden="true">
              <span className="legal-art-back" />
              {isTerms ? <FileText /> : <ShieldCheck />}
              {!isTerms && <UserRound className="legal-art-user" />}
            </div>
          </aside>

          <article className="legal-content reference-legal-content" ref={contentRef} onScroll={handleScroll}>
            <h2 id="legal-title">{isTerms ? 'Điều khoản sử dụng' : 'Chính sách bảo mật'}</h2>
            <small>Cập nhật lần cuối: 20/05/2024</small>
            <p className="legal-intro">{isTerms
              ? 'Vui lòng đọc kỹ các điều khoản này trước khi sử dụng các dịch vụ của TAKIVIVU. Khi truy cập hoặc sử dụng dịch vụ, bạn đồng ý bị ràng buộc bởi các điều khoản này.'
              : 'TAKIVIVU cam kết bảo vệ quyền riêng tư và thông tin cá nhân của bạn. Chính sách này mô tả cách chúng tôi thu thập, sử dụng, lưu trữ và bảo vệ thông tin của bạn.'}</p>

            {sections.map((section, index) => (
              <section key={section.title} data-legal-section={index} className="legal-section reference-legal-section">
                <h3><span>{index + 1}</span>{section.title}</h3>
                <p>{section.text}</p>
                {section.bullets && <ul>{section.bullets.map(item => <li key={item}>{item}</li>)}</ul>}

                {isTerms && index === 3 && <div className="legal-rights-grid">
                  <div className="rights"><strong>Quyền của bạn</strong><ul><li>Được sử dụng các dịch vụ theo đúng chính sách và tiện ích mà TAKIVIVU cung cấp.</li><li>Được hỗ trợ, giải đáp và xử lý khiếu nại theo chính sách chăm sóc khách hàng.</li></ul></div>
                  <div className="duties"><strong>Nghĩa vụ của bạn</strong><ul><li>Cung cấp thông tin trung thực và chính xác.</li><li>Tuân thủ các quy định của pháp luật và điều khoản của TAKIVIVU.</li></ul></div>
                </div>}
              </section>
            ))}
          </article>
        </div>
      </section>
    </div>
  )
}
