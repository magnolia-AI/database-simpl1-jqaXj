"use client"
import { auth } from "@/lib/auth"
import { signOutAction } from "@/app/actions/auth"
import { Button } from "@/components/ui/button"
import { redirect } from "next/navigation"

export default async function Home() {
  const session = await auth()

  if (!session?.user) {
    redirect("/auth/login")
  }
  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <h1 className="text-4xl font-bold mb-4">Welcome, {session.user.name || session.user.email}!</h1>
      <form action={signOutAction}>
        <Button type="submit">Sign Out</Button>
      </form>
    </div>
  )
}



