import BootstrapClient from '@/components/bootstrap_client'
import '@/styles/globals.css'
import 'bootstrap/dist/css/bootstrap.min.css'
import type { AppProps } from 'next/app'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <BootstrapClient />
      <Component {...pageProps} />
    </>
  )
}
