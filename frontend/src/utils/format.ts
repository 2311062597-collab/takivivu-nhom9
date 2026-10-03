export const money = (value?: number | null) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(Number(value ?? 0))
export const dateTime = (value?: string | null) => value ? new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value)) : '—'
export const dateOnly = (value?: string | null) => value ? new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short' }).format(new Date(value)) : '—'
export const apiError = (error: unknown) => {
  if (typeof error === 'object' && error && 'response' in error) {
    const e = error as { response?: { data?: unknown; status?: number } }
    const data = e.response?.data
    if (typeof data === 'string') return data
    if (data && typeof data === 'object') {
      const obj = data as Record<string, unknown>
      if (obj.loi && typeof obj.loi === 'object') {
        const fieldErrors = Object.values(obj.loi as Record<string, unknown>).filter(v => typeof v === 'string') as string[]
        if (fieldErrors.length) return fieldErrors.join(' • ')
      }
      for (const key of ['message', 'thongBao', 'error']) if (typeof obj[key] === 'string') return obj[key] as string
      const first = Object.values(obj).find(v => typeof v === 'string')
      if (typeof first === 'string') return first
    }
    if (e.response?.status) return `Yêu cầu thất bại (${e.response.status}).`
  }
  return error instanceof Error ? error.message : 'Đã có lỗi xảy ra.'
}
