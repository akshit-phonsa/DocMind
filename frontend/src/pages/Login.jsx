import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import AuthLayout, { Field, btnCls } from '../components/AuthLayout.jsx'
import { useAuthStore } from '../store/authStore.js'

export default function Login() {
  const login = useAuthStore((s) => s.login)
  const isLoading = useAuthStore((s) => s.isLoading)
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [touched, setTouched] = useState({})
  const touch = (k) => () => setTouched((t) => ({ ...t, [k]: true }))

  const errors = {
    username: username.trim() ? '' : 'Enter your username.',
    password: password ? '' : 'Enter your password.',
  }
  const show = (k) => (touched[k] ? errors[k] : '')

  // A 401 anywhere hard-navigates here; tell the user why, once.
  useEffect(() => {
    if (sessionStorage.getItem('docmind-session-expired')) {
      sessionStorage.removeItem('docmind-session-expired')
      toast.error('Your session expired. Please sign in again.', { id: 'expired' })
    }
  }, [])

  const submit = async (e) => {
    e.preventDefault()
    if (errors.username || errors.password) { setTouched({ username: true, password: true }); return }
    try {
      await login(username.trim(), password)
      navigate('/', { replace: true })
    } catch (err) {
      toast.error(err.message || 'Sign in failed. Please try again.')
    }
  }

  return (
    <AuthLayout
      title="Sign in"
      subtitle="Chat with your documents"
      footer={<>No account? <Link to="/register" className="font-semibold text-blue-500 hover:underline">Create one</Link></>}
    >
      <form onSubmit={submit} noValidate className="space-y-4">
        <Field id="login-username" label="Username" value={username} onChange={(e) => setUsername(e.target.value)} onBlur={touch('username')} error={show('username')} autoComplete="username" autoFocus />
        <Field id="login-password" label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} onBlur={touch('password')} error={show('password')} autoComplete="current-password" />
        <button disabled={isLoading} className={btnCls}>
          {isLoading && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}{isLoading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </AuthLayout>
  )
}
