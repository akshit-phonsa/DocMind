import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import AuthLayout, { Field, btnCls } from '../components/AuthLayout.jsx'
import { useAuthStore } from '../store/authStore.js'

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validate(f) {
  return {
    username: f.username.trim() ? '' : 'Choose a username.',
    email: !f.email.trim() ? 'Enter your email.' : EMAIL.test(f.email.trim()) ? '' : 'Enter a valid email address.',
    password: !f.password ? 'Choose a password.' : f.password.length < 8 ? 'Use at least 8 characters.' : '',
    confirm: !f.confirm ? 'Re-enter your password.' : f.confirm !== f.password ? 'Passwords do not match.' : '',
  }
}

export default function Register() {
  const register = useAuthStore((s) => s.register)
  const isLoading = useAuthStore((s) => s.isLoading)
  const navigate = useNavigate()
  const [f, setF] = useState({ username: '', email: '', password: '', confirm: '' })
  const [touched, setTouched] = useState({})
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }))
  const touch = (k) => () => setTouched((t) => ({ ...t, [k]: true }))
  const errors = validate(f)
  const show = (k) => (touched[k] ? errors[k] : '')

  const submit = async (e) => {
    e.preventDefault()
    if (Object.values(errors).some(Boolean)) { setTouched({ username: true, email: true, password: true, confirm: true }); return }
    try {
      await register(f.username.trim(), f.email.trim(), f.password)
      toast.success('Account created. Sign in to continue.')
      navigate('/login', { replace: true })
    } catch (err) {
      toast.error(err.message || 'Could not create your account. Please try again.')
    }
  }

  const field = (k, label, extra = {}) => (
    <Field id={`reg-${k}`} label={label} value={f[k]} onChange={set(k)} onBlur={touch(k)} error={show(k)} {...extra} />
  )

  return (
    <AuthLayout
      title="Create account"
      subtitle="Chat with your documents"
      footer={<>Already registered? <Link to="/login" className="font-semibold text-blue-500 hover:underline">Sign in</Link></>}
    >
      <form onSubmit={submit} noValidate className="space-y-4">
        {field('username', 'Username', { autoComplete: 'username', autoFocus: true })}
        {field('email', 'Email', { type: 'email', autoComplete: 'email' })}
        {field('password', 'Password', { type: 'password', autoComplete: 'new-password' })}
        {field('confirm', 'Confirm password', { type: 'password', autoComplete: 'new-password' })}
        <button disabled={isLoading} className={btnCls}>
          {isLoading && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}{isLoading ? 'Creating account…' : 'Create account'}
        </button>
      </form>
    </AuthLayout>
  )
}
