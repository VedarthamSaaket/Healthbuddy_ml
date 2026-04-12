'use client'
// src/app/auth/signup/page.tsx
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { authAPI } from '@/lib/api'
import toast from 'react-hot-toast'

interface FormData {
  email: string
  password: string
  confirmPassword: string
  full_name: string
  role: 'user' | 'doctor'
  age_confirmed: boolean
}

export default function SignUpPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    defaultValues: { role: 'user' },
  })
  const selectedRole = watch('role')

  const onSubmit = async (data: FormData) => {
    if (data.password !== data.confirmPassword) { toast.error('Passwords do not match'); return }
    setLoading(true)
    try {
      await authAPI.signup(data.email, data.password, data.full_name, data.role, data.age_confirmed)
      toast.success('Account created! Welcome to Health Buddy.')
      router.push('/dashboard')
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || 'Registration failed.')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = (hasError?: boolean): React.CSSProperties => ({
    width: '100%',
    padding: '13px 16px',
    borderRadius: '4px',
    border: hasError ? '1px solid rgba(192,57,43,0.6)' : '1px solid rgba(90,127,196,0.22)',
    background: 'rgba(255,255,255,0.03)',
    fontFamily: "'Crimson Pro', serif",
    fontSize: '1.05rem',
    color: 'rgba(255,255,255,0.8)',
    outline: 'none',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box',
  })

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#0d1829',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '80px 24px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        background: `
          radial-gradient(ellipse 65% 40% at 60% 20%, rgba(30,58,138,0.18) 0%, transparent 60%),
          radial-gradient(ellipse 45% 60% at 20% 80%, rgba(90,127,196,0.10) 0%, transparent 60%)
        `,
      }} />

      {/* Logo top-left */}
      <div style={{ position: 'fixed', top: '24px', left: '32px', zIndex: 50 }}>
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '26px', height: '26px', borderRadius: '50%',
            background: 'rgba(30,58,138,0.5)', border: '1px solid rgba(168,192,232,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', color: '#a8c0e8',
          }}>✦</div>
          <span style={{ fontFamily: "'IM Fell English', serif", fontSize: '0.95rem', color: 'rgba(255,255,255,0.6)' }}>
            Health <em style={{ fontStyle: 'italic', color: '#a8c0e8' }}>Buddy</em>
          </span>
        </Link>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(90,127,196,0.22)',
          borderRadius: '4px',
          padding: '48px 44px',
          width: '100%',
          maxWidth: '500px',
          position: 'relative',
          zIndex: 10,
          backdropFilter: 'blur(20px)',
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px', marginBottom: '20px' }}>
            <div style={{ width: '32px', height: '1px', background: 'rgba(168,192,232,0.3)' }} />
            <span style={{ color: '#c9a96e', fontSize: '0.8rem' }}>✦</span>
            <div style={{ width: '32px', height: '1px', background: 'rgba(168,192,232,0.3)' }} />
          </div>
          <h1 style={{
            fontFamily: "'IM Fell English', serif",
            fontSize: 'clamp(2rem, 5vw, 2.8rem)',
            fontWeight: 400, color: '#fff', marginBottom: '8px', lineHeight: 1.05,
          }}>
            Begin Here
          </h1>
          <p style={{
            fontFamily: "'Crimson Pro', serif", fontStyle: 'italic',
            fontSize: '1rem', color: 'rgba(255,255,255,0.35)',
          }}>
            Every journey starts with a single step inward
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Role selector */}
          <div>
            <label style={{ display: 'block', fontFamily: "'DM Sans', sans-serif", fontSize: '0.58rem', letterSpacing: '2.5px', textTransform: 'uppercase', color: 'rgba(168,192,232,0.4)', marginBottom: '8px' }}>
              I am a
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {(['user', 'doctor'] as const).map(r => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setValue('role', r)}
                  style={{
                    padding: '11px',
                    borderRadius: '4px',
                    border: selectedRole === r ? '1px solid rgba(168,192,232,0.3)' : '1px solid rgba(90,127,196,0.15)',
                    background: selectedRole === r ? 'rgba(30,58,138,0.35)' : 'rgba(255,255,255,0.02)',
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: '0.65rem',
                    letterSpacing: '1.5px',
                    textTransform: 'uppercase',
                    color: selectedRole === r ? 'rgba(168,192,232,0.9)' : 'rgba(168,192,232,0.3)',
                    cursor: 'pointer',
                    fontWeight: selectedRole === r ? 500 : 400,
                    transition: 'all 0.2s',
                  }}
                >
                  {r === 'user' ? 'Patient' : 'Doctor'}
                </button>
              ))}
            </div>
            <input type="hidden" {...register('role')} />
          </div>

          {/* Full Name */}
          <div>
            <label style={{ display: 'block', fontFamily: "'DM Sans', sans-serif", fontSize: '0.58rem', letterSpacing: '2.5px', textTransform: 'uppercase', color: 'rgba(168,192,232,0.4)', marginBottom: '7px' }}>Full Name</label>
            <input {...register('full_name', { required: true })} type="text" placeholder="Jane Smith" style={inputStyle(!!(errors as any).full_name)} />
          </div>

          {/* Email */}
          <div>
            <label style={{ display: 'block', fontFamily: "'DM Sans', sans-serif", fontSize: '0.58rem', letterSpacing: '2.5px', textTransform: 'uppercase', color: 'rgba(168,192,232,0.4)', marginBottom: '7px' }}>Email</label>
            <input {...register('email', { required: true })} type="email" placeholder="you@example.com" style={inputStyle(!!errors.email)} />
          </div>

          {/* Password */}
          <div>
            <label style={{ display: 'block', fontFamily: "'DM Sans', sans-serif", fontSize: '0.58rem', letterSpacing: '2.5px', textTransform: 'uppercase', color: 'rgba(168,192,232,0.4)', marginBottom: '7px' }}>Password</label>
            <div style={{ position: 'relative' }}>
              <input
                {...register('password', { required: true })}
                type={showPass ? 'text' : 'password'}
                placeholder="Min. 8 characters"
                style={{ ...inputStyle(!!errors.password), paddingRight: '64px' }}
              />
              <button type="button" onClick={() => setShowPass(p => !p)} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontSize: '0.56rem', letterSpacing: '1.5px', textTransform: 'uppercase', color: 'rgba(168,192,232,0.3)' }}>
                {showPass ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label style={{ display: 'block', fontFamily: "'DM Sans', sans-serif", fontSize: '0.58rem', letterSpacing: '2.5px', textTransform: 'uppercase', color: 'rgba(168,192,232,0.4)', marginBottom: '7px' }}>Confirm Password</label>
            <div style={{ position: 'relative' }}>
              <input
                {...register('confirmPassword', { required: true })}
                type={showConfirm ? 'text' : 'password'}
                placeholder="••••••••"
                style={{ ...inputStyle(!!errors.confirmPassword), paddingRight: '64px' }}
              />
              <button type="button" onClick={() => setShowConfirm(p => !p)} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontSize: '0.56rem', letterSpacing: '1.5px', textTransform: 'uppercase', color: 'rgba(168,192,232,0.3)' }}>
                {showConfirm ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          {/* Age confirmation */}
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' }}>
            <input
              {...register('age_confirmed', { required: true })}
              type="checkbox"
              style={{ marginTop: '3px', width: '15px', height: '15px', flexShrink: 0, accentColor: '#a8c0e8', cursor: 'pointer' }}
            />
            <span style={{ fontFamily: "'Crimson Pro', serif", fontSize: '0.92rem', color: 'rgba(255,255,255,0.35)', lineHeight: 1.55 }}>
              I confirm I am <strong style={{ color: 'rgba(255,255,255,0.65)' }}>18 years or older</strong> and understand Health Buddy is not a replacement for professional therapy.
            </span>
          </label>
          {errors.age_confirmed && (
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.68rem', color: 'rgba(192,57,43,0.8)' }}>Age confirmation required.</p>
          )}

          {/* Submit */}
          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: 1.01, background: 'rgba(30,58,138,0.45)' }}
            whileTap={{ scale: 0.99 }}
            style={{
              width: '100%', padding: '13px',
              borderRadius: '4px', border: '1px solid rgba(168,192,232,0.25)',
              background: 'rgba(30,58,138,0.3)',
              fontFamily: "'DM Sans', sans-serif", fontSize: '0.65rem',
              letterSpacing: '2.5px', textTransform: 'uppercase',
              color: loading ? 'rgba(168,192,232,0.4)' : 'rgba(168,192,232,0.9)',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              marginTop: '6px',
              transition: 'all 0.2s',
            }}
          >
            {loading ? 'Creating Account…' : 'Create Account'}
          </motion.button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '22px', fontFamily: "'Crimson Pro', serif", fontSize: '0.95rem', color: 'rgba(255,255,255,0.3)' }}>
          Already have an account?{' '}
          <Link href="/auth/signin" style={{ color: '#a8c0e8', textDecoration: 'none' }}>Sign in</Link>
        </p>
      </motion.div>
    </main>
  )
}