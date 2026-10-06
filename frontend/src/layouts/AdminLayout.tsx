import { BarChart3, Bell, ChevronDown, LogOut, Menu, Search, Settings, Users } from 'lucide-react'
import { FormEvent, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import Logo from '../components/Logo'
import { useAuth } from '../contexts/AuthContext'
import '../styles/admin.css'

export default function AdminLayout() {
  const { session, logout } = useAuth()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')

  const signOut = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  const searchUsers = (event: FormEvent) => {
    event.preventDefault()
    const value = query.trim()
    navigate(value ? `/admin/users?q=${encodeURIComponent(value)}` : '/admin/users')
  }

  return (
    <div className="admin2-shell">
      <aside className="admin2-sidebar">
        <div className="admin2-brand"><Logo /></div>
        <nav className="admin2-nav">
          <NavLink to="/admin/dashboard"><BarChart3 /><span>Tổng quan</span></NavLink>
          <NavLink to="/admin/users"><Users /><span>Quản lý người dùng</span></NavLink>
          <NavLink to="/admin/settings"><Settings /><span>Cài đặt hệ thống</span></NavLink>
        </nav>
        <div className="admin2-sidebar-art"><b>Travel</b><span>More</span><b>Live Better</b></div>
        <div className="admin2-account">
          <div className="admin2-account-row">
            <span className="admin2-avatar">{(session?.hoTen || 'A').trim().charAt(0).toUpperCase()}</span>
            <span><b>{session?.hoTen || 'Admin'}</b><small>Quản trị hệ thống</small></span>
          </div>
          <button onClick={() => void signOut()}><LogOut />Đăng xuất</button>
        </div>
      </aside>

      <section className="admin2-main">
        <header className="admin2-header">
          <button className="admin2-menu" aria-label="Menu"><Menu /></button>
          <form className="admin2-search" onSubmit={searchUsers}>
            <Search /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Tìm kiếm người dùng theo tên, email, số điện thoại..." />
          </form>
          <div className="admin2-header-actions">
            <button className="admin2-bell" aria-label="Thông báo"><Bell /><i>0</i></button>
            <div className="admin2-header-user">
              <span className="admin2-avatar">{(session?.hoTen || 'A').trim().charAt(0).toUpperCase()}</span>
              <span><b>{session?.hoTen || 'Admin'}</b><small>Quản trị hệ thống</small></span>
              <ChevronDown />
            </div>
          </div>
        </header>
        <main className="admin2-content"><Outlet /></main>
      </section>
    </div>
  )
}
