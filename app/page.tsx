import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b">
        <div className="container mx-auto py-4 px-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Crach-Scan</h1>
          <div className="flex gap-4">
            <Button variant="outline" asChild>
              <Link href="/login">Login</Link>
            </Button>
            <Button asChild>
              <Link href="/register">Register</Link>
            </Button>
          </div>
        </div>
      </header>
      <main className="flex-1 container mx-auto py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">QR Code Based Attendance Tracking</h2>
            <p className="text-xl text-muted-foreground">
              Simplify attendance tracking for your events, classes, and meetings
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <Card>
              <CardHeader>
                <CardTitle>For Attendees</CardTitle>
                <CardDescription>Manage your attendance with ease</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <p>• View your upcoming schedule</p>
                <p>• RSVP for sessions</p>
                <p>• Track your attendance history</p>
                <p>• Access your personal QR code</p>
              </CardContent>
              <CardFooter>
                <Button className="w-full" asChild>
                  <Link href="/dashboard">Go to Client Dashboard</Link>
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>For Organizers</CardTitle>
                <CardDescription>Powerful tools for attendance management</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <p>• Create and manage schedules</p>
                <p>• View detailed attendance records</p>
                <p>• Scan QR codes to log attendance</p>
                <p>• Manually record attendance</p>
              </CardContent>
              <CardFooter>
                <Button className="w-full" asChild>
                  <Link href="/admin">Go to Admin Dashboard</Link>
                </Button>
              </CardFooter>
            </Card>
          </div>

          <div className="text-center">
            <Button size="lg" asChild>
              <Link href="/register">Get Started</Link>
            </Button>
          </div>
        </div>
      </main>
      <footer className="border-t py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} Crach-Scan. All rights reserved.
        </div>
      </footer>
    </div>
  )
}
