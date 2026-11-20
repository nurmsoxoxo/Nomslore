import './globals.css'
import Shell from '@/components/Shell'
export const metadata = { title: 'NOMSLORE — Discover. Read. Rate. Review.', description: 'Discover remarkable books, explore new authors, and share your thoughts with a community of readers.' }
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="light">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500;1,600&family=Inter:wght@400;500;600&family=Lora:wght@400;500&display=swap" />
        <meta name="theme-color" content="#8b4a2b" />
      </head>
      <body><Shell>{children}</Shell></body>
    </html>
  )
}
