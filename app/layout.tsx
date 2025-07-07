import './globals.css'
import { auth } from '@/lib/auth'
import SessionProvider from '@/components/session-provider'
import type { Metadata } from 'next'
import { Toaster } from "@/components/ui/toaster"
import { ThemeProvider } from '@/components/theme-provider'

export const metadata: Metadata = {
  title: 'Next.js Template',
  description: 'A customizable template built with Next.js and Tailwind CSS',
  icons: {
    icon: '/favicon.ico',
  },
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <body className="h-full flex flex-col antialiased">
        <SessionProvider session={session}>
          <ThemeProvider defaultTheme="light" attribute="class">
            <main className="flex-1">
              {children}
            </main>
            <Toaster />
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  )
}

