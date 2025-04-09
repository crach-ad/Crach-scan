import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CalendarDays, CheckCircle, Clock } from "lucide-react"
import Link from "next/link"

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Here's an overview of your attendance.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sessions Attended</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground">+2 from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Sessions</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">Next session in 2 days</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">92%</div>
            <p className="text-xs text-muted-foreground">+5% from last month</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Upcoming Sessions</CardTitle>
            <CardDescription>Your next scheduled sessions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                {
                  id: 1,
                  title: "Web Development Workshop",
                  date: "Apr 10, 2025",
                  time: "10:00 AM - 12:00 PM",
                  location: "Room 101",
                  status: "Confirmed",
                },
                {
                  id: 2,
                  title: "UX Design Principles",
                  date: "Apr 12, 2025",
                  time: "2:00 PM - 4:00 PM",
                  location: "Room 203",
                  status: "RSVP Needed",
                },
                {
                  id: 3,
                  title: "JavaScript Fundamentals",
                  date: "Apr 15, 2025",
                  time: "1:00 PM - 3:00 PM",
                  location: "Room 105",
                  status: "Confirmed",
                },
              ].map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                >
                  <div>
                    <h4 className="font-medium">{session.title}</h4>
                    <div className="text-sm text-muted-foreground">
                      {session.date} • {session.time}
                    </div>
                    <div className="text-sm text-muted-foreground">{session.location}</div>
                  </div>
                  <div
                    className={`text-sm px-2 py-1 rounded-full ${
                      session.status === "Confirmed" ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {session.status}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <Link href="/dashboard/schedule" className="text-sm text-primary hover:underline">
                View all scheduled sessions →
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Recent Attendance</CardTitle>
            <CardDescription>Your recently attended sessions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                {
                  id: 1,
                  title: "React State Management",
                  date: "Apr 3, 2025",
                  time: "10:00 AM - 12:00 PM",
                  location: "Room 101",
                },
                {
                  id: 2,
                  title: "API Integration Workshop",
                  date: "Apr 1, 2025",
                  time: "2:00 PM - 4:00 PM",
                  location: "Room 203",
                },
                {
                  id: 3,
                  title: "CSS Grid Masterclass",
                  date: "Mar 28, 2025",
                  time: "1:00 PM - 3:00 PM",
                  location: "Room 105",
                },
              ].map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                >
                  <div>
                    <h4 className="font-medium">{session.title}</h4>
                    <div className="text-sm text-muted-foreground">
                      {session.date} • {session.time}
                    </div>
                    <div className="text-sm text-muted-foreground">{session.location}</div>
                  </div>
                  <div className="text-sm px-2 py-1 rounded-full bg-green-100 text-green-800">Attended</div>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <Link href="/dashboard/history" className="text-sm text-primary hover:underline">
                View full attendance history →
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
