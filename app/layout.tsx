import './globals.css'
import type { ReactNode } from 'react'
import './globals.css'
import SiteHeader from '../components/SiteHeader'
import SiteFooter from '../components/SiteFooter'


export const metadata = {
title: 'Kitchen Scale',
description: 'Search, scale, and convert recipe ingredients in your kitchen.'
}


// export default function RootLayout({ children }: { children: ReactNode }) {
// return (
  
//   <html lang="en">
//     <body className="min-h-dvh antialiased">
//       <header className="sticky top-0 z-10 border-b bg-white/70 backdrop-blur dark:bg-neutral-950/70">
//         <div className="mx-auto max-w-3xl px-4 py-3 flex items-center justify-between">
//           <a href="/" className="font-semibold">Kitchen Scale</a>
//           <nav className="text-sm text-gray-500">MVP</nav>
//         </div>
//       </header>
//       <main className="mx-auto max-w-3xl px-4 py-6">{children}</main>
//     </body>
//   </html>
//   )
// }



export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <SiteHeader />
        <main className="flex-1 body-paper">
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  )
}
