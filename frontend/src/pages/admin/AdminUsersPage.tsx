import {
  Ban,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileImage,
  Filter,
  LockKeyhole,
  MoreVertical,
  Search,
  ShieldCheck,
  UnlockKeyhole,
  UserRound,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { authApi } from '../../api/services'
import type { AdminUser, Role, UserStatus } from '../../types'
import { apiError } from '../../utils/format'

const roleText: Record<Role, string> = { CUSTOMER: 'CUSTOMER', PROVIDER: 'PROVIDER', ADMIN: 'ADMIN' }
const statusText: Record<UserStatus, string> = {
  ACTIVE: 'Hoạt động',
  INACTIVE: 'Ngừng hoạt động',
  LOCKED: 'Đã khóa',
  PENDING_APPROVAL: 'Chờ duyệt',
}
const providerTypeText = (value: AdminUser['loaiNhaCungCap']) => value === 'FLIGHT' ? 'Chuyến bay' : value === 'HOTEL' ? 'Khách sạn' : value === 'ATTRACTION' ? 'Điểm tham quan' : '—'
const fmtDate = (value?: string | null, withTime = false) => value ? new Intl.DateTimeFormat('vi-VN', withTime ? { dateStyle: 'short', timeStyle: 'short' } : { dateStyle: 'short' }).format(new Date(value)) : '—'

function statusClass(status: UserStatus) { return status.toLowerCase().replace('_approval', '') }
function licenseUrl(url?: string | null) { return url || '' }

export default function AdminUsersPage() {
  const [params, setParams] = useSearchParams()
  const initialQuery = params.get('q') || ''
  const initialRole = (params.get('role') || '') as '' | Role
  const initialStatus = (params.get('status') || '') as '' | UserStatus

  const [items, setItems] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState(initialQuery)
  const [role, setRole] = useState<'' | Role>(initialRole)
  const [status, setStatus] = useState<'' | UserStatus>(initialStatus)
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<AdminUser | null>(null)
  const [menuId, setMenuId] = useState<number | null>(null)
  const [rejectTarget, setRejectTarget] = useState<AdminUser | null>(null)
  const [approveTarget, setApproveTarget] = useState<AdminUser | null>(null)
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)

  const load = async () => {
    setLoading(true)
    setError('')
    try { setItems(await authApi.adminUsers()) }
    catch (err) { setError(apiError(err)) }
    finally { setLoading(false) }
  }

  useEffect(() => { void load() }, [])
  useEffect(() => { setQuery(params.get('q') || '') }, [params])
  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setMenuId(null)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  const counts = useMemo(() => ({
    all: items.length,
    CUSTOMER: items.filter(i => i.vaiTro === 'CUSTOMER').length,
    PROVIDER: items.filter(i => i.vaiTro === 'PROVIDER').length,
    ADMIN: items.filter(i => i.vaiTro === 'ADMIN').length,
  }), [items])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return items.filter(item => {
      if (role && item.vaiTro !== role) return false
      if (status && item.trangThai !== status) return false
      if (q && !`${item.hoTen} ${item.email} ${item.soDienThoai} ${item.tenDoanhNghiep || ''}`.toLowerCase().includes(q)) return false
      if (fromDate && item.ngayTao && new Date(item.ngayTao) < new Date(`${fromDate}T00:00:00`)) return false
      if (toDate && item.ngayTao && new Date(item.ngayTao) > new Date(`${toDate}T23:59:59`)) return false
      return true
    })
  }, [items, query, role, status, fromDate, toDate])

  const perPage = 8
  const pageCount = Math.max(1, Math.ceil(filtered.length / perPage))
  const shown = filtered.slice((page - 1) * perPage, page * perPage)
  useEffect(() => { setPage(1) }, [query, role, status, fromDate, toDate])
  useEffect(() => { if (page > pageCount) setPage(pageCount) }, [page, pageCount])

  const setRoleTab = (value: '' | Role) => {
    setRole(value)
    const next = new URLSearchParams(params)
    if (value) next.set('role', value); else next.delete('role')
    setParams(next, { replace: true })
  }

  const changeStatus = async (user: AdminUser, next: 'ACTIVE' | 'INACTIVE' | 'LOCKED') => {
    setBusy(true); setError(''); setMenuId(null)
    try {
      const updated = await authApi.updateUserStatus(user.id, next)
      setItems(current => current.map(item => item.id === user.id ? updated : item))
      setSelected(current => current?.id === user.id ? updated : current)
    } catch (err) { setError(apiError(err)) }
    finally { setBusy(false) }
  }

  const approve = async () => {
    if (!approveTarget?.providerProfileId) return
    setBusy(true); setError('')
    try { await authApi.approveProvider(approveTarget.providerProfileId); setApproveTarget(null); await load() }
    catch (err) { setError(apiError(err)) }
    finally { setBusy(false) }
  }

  const reject = async () => {
    if (!rejectTarget?.providerProfileId || !reason.trim()) return
    setBusy(true); setError('')
    try { await authApi.rejectProvider(rejectTarget.providerProfileId, reason.trim()); setRejectTarget(null); setReason(''); await load() }
    catch (err) { setError(apiError(err)) }
    finally { setBusy(false) }
  }

  return <div className="admin2-page">
    <div className="admin2-breadcrumb">Trang chủ <span>›</span> Quản lý người dùng</div>
    <div className="admin2-page-head"><div><h1>Quản lý người dùng</h1><p>Quản lý tài khoản người dùng trong hệ thống theo đúng phân quyền Auth Service.</p></div></div>

    <div className="admin2-tabs">
      <button className={!role ? 'active' : ''} onClick={() => setRoleTab('')}>Tất cả <b>({counts.all})</b></button>
      <button className={role === 'CUSTOMER' ? 'active' : ''} onClick={() => setRoleTab('CUSTOMER')}>Customer <b>({counts.CUSTOMER})</b></button>
      <button className={role === 'PROVIDER' ? 'active' : ''} onClick={() => setRoleTab('PROVIDER')}>Provider <b>({counts.PROVIDER})</b></button>
      <button className={role === 'ADMIN' ? 'active' : ''} onClick={() => setRoleTab('ADMIN')}>Admin <b>({counts.ADMIN})</b></button>
    </div>

    <section className="admin2-panel">
      <div className="admin2-filters">
        <label className="wide"><Search /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Tìm kiếm theo tên, email, số điện thoại..." /></label>
        <label><span>Vai trò</span><select value={role} onChange={e => setRoleTab(e.target.value as '' | Role)}><option value="">Tất cả</option><option value="CUSTOMER">Customer</option><option value="PROVIDER">Provider</option><option value="ADMIN">Admin</option></select></label>
        <label><span>Trạng thái</span><select value={status} onChange={e => setStatus(e.target.value as '' | UserStatus)}><option value="">Tất cả</option><option value="ACTIVE">Hoạt động</option><option value="PENDING_APPROVAL">Chờ duyệt</option><option value="LOCKED">Đã khóa</option><option value="INACTIVE">Ngừng hoạt động</option></select></label>
        <label className="date"><span>Ngày tạo từ</span><input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} /></label>
        <label className="date"><span>đến</span><input type="date" value={toDate} onChange={e => setToDate(e.target.value)} /></label>
        <button className="admin2-filter-button"><Filter />Lọc</button>
      </div>

      {error && <div className="admin2-error"><b>Không thể xử lý dữ liệu.</b><span>{error}</span><button onClick={() => void load()}>Thử lại</button></div>}

      <div className="admin2-table-wrap">
        <table className="admin2-table">
          <thead><tr><th>ID</th><th>Họ tên</th><th>Email</th><th>Số điện thoại</th><th>Vai trò</th><th>Trạng thái</th><th>Ngày tạo</th><th>Cập nhật gần nhất</th><th>Thao tác</th></tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={10} className="admin2-empty">Đang tải người dùng từ Auth Service...</td></tr> : shown.length === 0 ? <tr><td colSpan={10} className="admin2-empty">Không có người dùng phù hợp.</td></tr> : shown.map(user => <tr key={user.id} className={selected?.id === user.id ? 'selected' : ''}>
              <td className="admin2-id">USR{String(user.id).padStart(3, '0')}</td>
              <td><button className="admin2-user-cell" onClick={() => setSelected(user)}><span>{user.anhDaiDien ? <img src={user.anhDaiDien} alt="" /> : user.hoTen.charAt(0).toUpperCase()}</span><b>{user.hoTen}</b></button></td>
              <td>{user.email}</td><td>{user.soDienThoai}</td>
              <td><span className={`admin2-role ${user.vaiTro.toLowerCase()}`}>{roleText[user.vaiTro]}</span></td>
              <td><span className={`admin2-status ${statusClass(user.trangThai)}`}>{statusText[user.trangThai]}</span>{user.vaiTro === 'PROVIDER' && user.trangThaiDuyet ? <small className="admin2-provider-approval">{user.trangThaiDuyet === 'PENDING' ? 'Hồ sơ chờ duyệt' : user.trangThaiDuyet === 'APPROVED' ? 'Hồ sơ đã duyệt' : 'Hồ sơ bị từ chối'}</small> : null}</td>
              <td>{fmtDate(user.ngayTao)}</td><td>{fmtDate(user.ngayCapNhat, true)}</td>
              <td className="admin2-action-cell"><button className="admin2-more" onClick={() => setMenuId(menuId === user.id ? null : user.id)}><MoreVertical /></button>{menuId === user.id && <div ref={menuRef} className="admin2-action-menu">
                <button onClick={() => { setSelected(user); setMenuId(null) }}><Eye />Xem thông tin</button>
                {user.vaiTro === 'PROVIDER' && user.trangThaiDuyet === 'PENDING' && user.providerProfileId ? <><button className="approve" onClick={() => { setApproveTarget(user); setMenuId(null) }}><CheckCircle2 />Duyệt PROVIDER</button><button className="danger" onClick={() => { setRejectTarget(user); setMenuId(null) }}><X />Từ chối PROVIDER</button></> : null}
                {user.vaiTro !== 'ADMIN' && user.trangThai === 'ACTIVE' ? <><hr/><button className="danger" onClick={() => void changeStatus(user, 'LOCKED')} disabled={busy}><LockKeyhole />Khóa tài khoản</button><button onClick={() => void changeStatus(user, 'INACTIVE')} disabled={busy}><Ban />Ngừng hoạt động</button></> : null}
                {user.vaiTro !== 'ADMIN' && (user.trangThai === 'LOCKED' || user.trangThai === 'INACTIVE') ? <><hr/><button className="approve" onClick={() => void changeStatus(user, 'ACTIVE')} disabled={busy}><UnlockKeyhole />Kích hoạt tài khoản</button></> : null}
              </div>}</td>
            </tr>)}
          </tbody>
        </table>
      </div>

      <div className="admin2-pagination"><span>Hiển thị {filtered.length ? (page - 1) * perPage + 1 : 0} - {Math.min(page * perPage, filtered.length)} trong tổng số {filtered.length} người dùng</span><div><button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}><ChevronLeft /></button>{Array.from({ length: Math.min(pageCount, 5) }, (_, i) => i + 1).map(p => <button key={p} className={p === page ? 'active' : ''} onClick={() => setPage(p)}>{p}</button>)}{pageCount > 5 && <><span>…</span><button onClick={() => setPage(pageCount)}>{pageCount}</button></>}<button onClick={() => setPage(p => Math.min(pageCount, p + 1))} disabled={page === pageCount}><ChevronRight /></button></div></div>
    </section>

    {selected && <div className="admin2-drawer-backdrop" onMouseDown={() => setSelected(null)}><aside className="admin2-drawer" onMouseDown={e => e.stopPropagation()}>
      <header><h2>Chi tiết người dùng</h2><button onClick={() => setSelected(null)}><X /></button></header>
      <div className="admin2-detail-hero"><span>{selected.anhDaiDien ? <img src={selected.anhDaiDien} alt="" /> : selected.hoTen.charAt(0).toUpperCase()}</span><div><h3>{selected.hoTen}</h3><p><i className={`admin2-role ${selected.vaiTro.toLowerCase()}`}>{selected.vaiTro}</i><i className={`admin2-status ${statusClass(selected.trangThai)}`}>{statusText[selected.trangThai]}</i></p></div></div>
      <div className="admin2-detail-tabs"><button className="active">Thông tin chung</button>{selected.vaiTro === 'PROVIDER' && <button>Hồ sơ kinh doanh</button>}</div>
      <dl className="admin2-detail-list"><div><dt>ID người dùng</dt><dd>USR{String(selected.id).padStart(3, '0')}</dd></div><div><dt>Họ tên</dt><dd>{selected.hoTen}</dd></div><div><dt>Email</dt><dd>{selected.email}</dd></div><div><dt>Số điện thoại</dt><dd>{selected.soDienThoai}</dd></div><div><dt>Vai trò</dt><dd>{selected.vaiTro}</dd></div><div><dt>Trạng thái</dt><dd>{statusText[selected.trangThai]}</dd></div><div><dt>Ngày tạo</dt><dd>{fmtDate(selected.ngayTao, true)}</dd></div><div><dt>Cập nhật gần nhất</dt><dd>{fmtDate(selected.ngayCapNhat, true)}</dd></div><div><dt>Địa chỉ</dt><dd>{selected.diaChi || 'Chưa cập nhật'}</dd></div></dl>
      {selected.vaiTro === 'PROVIDER' && <section className="admin2-provider-detail"><h3>Hồ sơ kinh doanh</h3><dl><div><dt>Doanh nghiệp</dt><dd>{selected.tenDoanhNghiep || '—'}</dd></div><div><dt>Loại dịch vụ</dt><dd>{providerTypeText(selected.loaiNhaCungCap)}</dd></div><div><dt>Trạng thái duyệt</dt><dd>{selected.trangThaiDuyet || '—'}</dd></div></dl>{selected.anhGiayPhepKinhDoanh && <a href={licenseUrl(selected.anhGiayPhepKinhDoanh)} target="_blank" rel="noreferrer"><FileImage />Xem ảnh giấy phép kinh doanh</a>}{selected.lyDoTuChoi && <p className="admin2-reason">Lý do từ chối: {selected.lyDoTuChoi}</p>}</section>}
      <footer>{selected.vaiTro !== 'ADMIN' && selected.trangThai === 'ACTIVE' ? <button className="danger-outline" onClick={() => void changeStatus(selected, 'INACTIVE')}><Ban />Ngừng hoạt động</button> : selected.vaiTro !== 'ADMIN' && selected.trangThai !== 'PENDING_APPROVAL' ? <button onClick={() => void changeStatus(selected, 'ACTIVE')}><UnlockKeyhole />Kích hoạt</button> : <span/>}<button onClick={() => setSelected(null)}>Đóng</button></footer>
    </aside></div>}

    {approveTarget && <div className="admin2-modal-backdrop"><div className="admin2-modal"><button className="close" onClick={() => setApproveTarget(null)}><X /></button><span className="icon success"><Check /></span><h2>Duyệt PROVIDER</h2><p>Bạn có chắc chắn muốn duyệt tài khoản <b>{approveTarget.tenDoanhNghiep || approveTarget.hoTen}</b>?</p><div className="admin2-provider-summary"><span>ID người dùng <b>USR{String(approveTarget.id).padStart(3, '0')}</b></span><span>Họ tên <b>{approveTarget.hoTen}</b></span><span>Email <b>{approveTarget.email}</b></span><span>Số điện thoại <b>{approveTarget.soDienThoai}</b></span></div>{approveTarget.anhGiayPhepKinhDoanh && <a className="admin2-license-preview" href={licenseUrl(approveTarget.anhGiayPhepKinhDoanh)} target="_blank" rel="noreferrer"><FileImage />Xem giấy phép kinh doanh</a>}<div className="actions"><button onClick={() => setApproveTarget(null)}>Hủy</button><button className="primary" onClick={() => void approve()} disabled={busy}>Duyệt</button></div></div></div>}

    {rejectTarget && <div className="admin2-modal-backdrop"><div className="admin2-modal"><button className="close" onClick={() => setRejectTarget(null)}><X /></button><span className="icon danger"><Ban /></span><h2>Từ chối PROVIDER</h2><p>Bạn có chắc chắn muốn từ chối tài khoản <b>{rejectTarget.tenDoanhNghiep || rejectTarget.hoTen}</b>?</p><label className="admin2-reject-reason">Lý do từ chối *<textarea maxLength={255} rows={4} value={reason} onChange={e => setReason(e.target.value)} placeholder="Nhập lý do từ chối..."/><small>{reason.length}/255</small></label><div className="actions"><button onClick={() => { setRejectTarget(null); setReason('') }}>Hủy</button><button className="danger" onClick={() => void reject()} disabled={busy || !reason.trim()}>Từ chối</button></div></div></div>}
  </div>
}
