import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CalendarDays, CheckCircle, Clock, Users } from "lucide-react"
import Link from "next/link"
import { getDashboardData } from "./dashboard/actions"

export default async function AdminDashboardPage() {
  // Fetch real data from Google Sheets
  const dashboardData = await getDashboardData();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">Manage schedules and track attendance.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Attendees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.totalAttendees}</div>
            <p className="text-xs text-muted-foreground">{dashboardData.totalAttendees > 0 ? `${dashboardData.totalAttendees} registered attendees` : 'No attendees yet'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.totalSessions}</div>
            <p className="text-xs text-muted-foreground">{dashboardData.totalSessions > 0 ? `${dashboardData.totalSessions} total sessions` : 'No sessions yet'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Attendance</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.averageAttendanceRate}%</div>
            <p className="text-xs text-muted-foreground">{dashboardData.averageAttendanceRate > 0 ? `Average attendance rate` : 'No attendance data yet'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Sessions</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.upcomingSessions}</div>
            <p className="text-xs text-muted-foreground">
              {dashboardData.nextSessionDate ? `Next session on ${dashboardData.nextSessionDate}` : 'No upcoming sessions'}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="upcoming">
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming Sessions</TabsTrigger>
          <TabsTrigger value="recent">Recent Attendance</TabsTrigger>
        </TabsList>
        <TabsContent value="upcoming" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Sessions</CardTitle>
              <CardDescription>Sessions scheduled for the next 7 days</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboardData.upcomingSessionsList.length > 0 ? (
                  dashboardData.upcomingSessionsList.map((session) => (
                    <div
                      key={session.id}
                      className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                    >
                      <div>
                        <h4 className="font-medium">{session.title}</h4>
                        <div className="text-sm text-muted-foreground">
                          {session.date} • {session.time}
                        </div>
                        {/* No location data in our model */}
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {session.attendeeCount}/{session.capacity}
                        </div>
                        <div className="text-xs text-muted-foreground">Attendees</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-4 text-center text-muted-foreground">
                    No upcoming sessions scheduled
                  </div>
                )}
              </div>
              <div className="mt-4">
                <Link href="/admin/schedule" className="text-sm text-primary hover:underline">
                  Manage all sessions →
                </Link>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="recent" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Attendance</CardTitle>
              <CardDescription>Attendance records from the past 7 days</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboardData.recentSessions.length > 0 ? (
                  dashboardData.recentSessions.map((session) => (
                    <div
                      key={session.id}
                      className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                    >
                      <div>
                        <h4 className="font-medium">{session.title}</h4>
                        <div className="text-sm text-muted-foreground">
                          {session.date} • {session.time}
                        </div>
                        {/* No location data in our model */}
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {session.attendeeCount}/{session.capacity}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Attendance Rate: {Math.round((session.attendeeCount / session.capacity) * 100)}%
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-4 text-center text-muted-foreground">
                    No recent sessions to display
                  </div>
                )}
              </div>
              <div className="mt-4">
                <Link href="/admin/attendance" className="text-sm text-primary hover:underline">
                  View all attendance records →
                </Link>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
