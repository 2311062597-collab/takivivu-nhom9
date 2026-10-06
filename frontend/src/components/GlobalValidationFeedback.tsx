import { useEffect } from 'react'

type Field = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement

const errorClass = 'field-validation-error'

function messageFor(field: Field) {
  const v = field.validity
  const label = field.getAttribute('data-field-label') || field.getAttribute('aria-label') || field.name || 'Trường này'
  if (v.valueMissing) return `${label} không được để trống.`
  if (v.typeMismatch) return field.type === 'email' ? 'Email không đúng định dạng.' : `${label} không đúng định dạng.`
  if (v.patternMismatch) return field.getAttribute('data-pattern-message') || `${label} không đúng định dạng yêu cầu.`
  if (v.rangeUnderflow) return `${label} phải lớn hơn hoặc bằng ${field.getAttribute('min')}.`
  if (v.rangeOverflow) return `${label} phải nhỏ hơn hoặc bằng ${field.getAttribute('max')}.`
  if (v.stepMismatch) return `${label} có giá trị không hợp lệ.`
  if (v.tooShort) return `${label} phải có ít nhất ${field.getAttribute('minlength')} ký tự.`
  if (v.tooLong) return `${label} không được vượt quá ${field.getAttribute('maxlength')} ký tự.`
  return field.validationMessage || `${label} không hợp lệ.`
}

function errorHost(field: Field) {
  const explicitHost = field.closest('.validation-field')
  if (explicitHost) return explicitHost

  // Composite controls (input + suffix/prefix) must keep their validation
  // message outside the horizontal control row, otherwise the error text
  // becomes another flex item and pushes/shrinks the input.
  const composite = field.closest('.promotion-input-suffix')
  if (composite) return composite.parentElement

  return field.parentElement
}

function insertErrorNode(field: Field, host: Element, node: HTMLElement) {
  // If the field lives inside a composite control, append the message to the
  // field host (normally its label) so it renders on the next line.
  if (host !== field.parentElement) host.appendChild(node)
  else field.insertAdjacentElement('afterend', node)
}

function clear(field: Field) {
  field.classList.remove('field-invalid')
  field.removeAttribute('aria-invalid')
  const host = errorHost(field)
  host?.querySelector(`:scope > .${errorClass}[data-for="${CSS.escape(field.id || field.name || 'field')}"]`)?.remove()
}

function show(field: Field) {
  if (field.disabled || ('readOnly' in field && field.readOnly) || field.type === 'hidden') return
  if (field.validity.valid) { clear(field); return }
  field.classList.add('field-invalid')
  field.setAttribute('aria-invalid', 'true')
  const host = errorHost(field)
  if (!host) return
  const key = field.id || field.name || 'field'
  let node = host.querySelector(`:scope > .${errorClass}[data-for="${CSS.escape(key)}"]`) as HTMLElement | null
  if (!node) {
    node = document.createElement('div')
    node.className = errorClass
    node.dataset.for = key
    insertErrorNode(field, host, node)
  }
  node.textContent = messageFor(field)
}

export default function GlobalValidationFeedback() {
  useEffect(() => {
    const invalid = (event: Event) => {
      const field = event.target as Field
      if (field?.matches?.('input,select,textarea')) { event.preventDefault(); show(field) }
    }
    const input = (event: Event) => {
      const field = event.target as Field
      if (!field?.matches?.('input,select,textarea')) return
      if (field.validity.valid) clear(field)
      else if (field.classList.contains('field-invalid')) show(field)
    }
    const submit = (event: Event) => {
      const form = event.target as HTMLFormElement
      if (!(form instanceof HTMLFormElement)) return
      const fields = Array.from(form.elements).filter((el): el is Field => el instanceof HTMLInputElement || el instanceof HTMLSelectElement || el instanceof HTMLTextAreaElement)
      const invalidFields = fields.filter(field => !field.disabled && !field.validity.valid)
      if (!invalidFields.length) return
      event.preventDefault(); event.stopPropagation()
      invalidFields.forEach(show)
      invalidFields[0].focus({ preventScroll: true })
      invalidFields[0].scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
    document.addEventListener('invalid', invalid, true)
    document.addEventListener('input', input, true)
    document.addEventListener('change', input, true)
    document.addEventListener('submit', submit, true)
    return () => {
      document.removeEventListener('invalid', invalid, true)
      document.removeEventListener('input', input, true)
      document.removeEventListener('change', input, true)
      document.removeEventListener('submit', submit, true)
    }
  }, [])
  return null
}
