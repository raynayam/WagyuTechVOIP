import type React from "react"
import { Inter } from "next/font/google"
import "./globals.css"
import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"

const inter = Inter({ subsets: ["latin"] })

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()

  // If not logged in and not on login or register page, redirect to login
  const isAuthPage =
    typeof window !== "undefined" && (window.location.pathname === "/login" || window.location.pathname === "/register")

  if (!user && !isAuthPage) {
    redirect("/login")
  }

  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}


import './globals.css'

export const metadata = {
      generator: 'v0.dev'
    };
