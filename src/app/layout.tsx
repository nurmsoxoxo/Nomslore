import './globals.css'
import Shell from '@/components/Shell'
export const metadata = { title: 'Nomslore — Discover. Read. Rate. Review.', applicationName: 'Nomslore', appleWebApp: { title: 'Nomslore', capable: true }, description: 'Discover remarkable books, explore new authors, and share your thoughts with a community of readers.', manifest: '/manifest.webmanifest', icons: { icon: [{ url: '/favicon.png', sizes: '64x64' }, { url: '/icon-192.png', sizes: '192x192' }], apple: '/apple-touch-icon.png' } }
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="light">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,500..700;1,9..144,500..700&family=Figtree:wght@400..700&family=Literata:opsz,wght@7..72,400..600&display=swap" />
        <meta name="theme-color" content="#8f2f10" />
      </head>
      <body><Shell>{children}</Shell></body>
    </html>
  )
}
