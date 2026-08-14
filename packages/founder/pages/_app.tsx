import type { AppProps } from 'next/app'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import FounderLayout from '../components/FounderLayout'
import '../styles/globals.css'

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter()
  const isLogin = router.pathname === '/login'
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (isLogin) { setReady(true); return }
    const urlParams = new URLSearchParams(window.location.search)
    const urlToken = urlParams.get('token')
    if (urlToken) {
      localStorage.setItem('founder_token', urlToken)
      window.history.replaceState({}, '', '/dashboard')
    }
    setReady(true)
  }, [isLogin])

  if (!ready) return null
  if (isLogin) {
    return <Component {...pageProps} />
  }

  const token = localStorage.getItem('founder_token')
  if (!token && !isLogin) {
    window.location.href = 'http://localhost:5173/'
    return null
  }

  return (
    <FounderLayout>
      <Component {...pageProps} />
    </FounderLayout>
  )
}
