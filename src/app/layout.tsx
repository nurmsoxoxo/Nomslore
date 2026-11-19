import './globals.css'
import Shell from '@/components/Shell'
export const metadata = { title: 'NOMSLORE — Discover. Read. Rate. Review.', description: 'Discover remarkable books, explore new authors, and share your thoughts with a community of readers.' }
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (<html lang="en" data-theme="light"><body><Shell>{children}</Shell></body></html>)
}
