"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CalendarDays, ListFilter } from "lucide-react"

export default function SchedulePage() {
  const [date, setDate] = useState<Date | undefined>(new Date())

  // Mock data for sessions
  const sessions = [
    {
      id: 1,
      title: "Web Development Workshop",
      date: "2025-04-10",
      time: "10:00 AM - 12:00 PM",
      location: "Room 101",
      description: "Learn the fundamentals of web development with HTML, CSS, and JavaScript.",
      status: "Confirmed",
    },
    {
      id: 2,
      title: "UX Design Principles",
      date: "2025-04-12",
      time: "2:00 PM - 4:00 PM",
      location: "Room 203",
      description: "Explore the principles of user experience design and how to create intuitive interfaces.",
      status: "RSVP Needed",
    },
    {
      id: 3,
      title: "JavaScript Fundamentals",
      date: "2025-04-15",
      time: "1:00 PM - 3:00 PM",
      location: "Room 105",
      description: "A deep dive into JavaScript fundamentals, including variables, functions, and objects.",
      status: "Confirmed",
    },
    {
      id: 4,
      title: "React State Management",
      date: "2025-04-17",
      time: "10:00 AM - 12:00 PM",
      location: "Room 101",
      description: "Learn different state management techniques in React applications.",
      status: "RSVP Needed",
    },
    {
      id: 5,
      title: "API Integration Workshop",
      date: "2025-04-20",
      time: "2:00 PM - 4:00 PM",
      location: "Room 203",
      description: "Hands-on workshop on integrating APIs into web applications.",
      status: "RSVP Needed",
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Schedule</h1>
        <p className="text-muted-foreground">View and RSVP for upcoming sessions.</p>
      </div>

      <Tabs defaultValue="list">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="list" className="flex items-center gap-2">
              <ListFilter className="h-4 w-4" />
              List View
            </TabsTrigger>
            <TabsTrigger value="calendar" className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              Calendar View
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="list" className="space-y-4 mt-6">
          {sessions.map((session) => (
            <Card key={session.id}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{session.title}</CardTitle>
                    <CardDescription>
                      {new Date(session.date).toLocaleDateString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}{" "}
                      • {session.time}
                    </CardDescription>
                  </div>
                  <div
                    className={`text-sm px-3 py-1 rounded-full ${
                      session.status === "Confirmed" ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {session.status}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    <strong>Location:</strong> {session.location}
                  </p>
                  <p className="text-sm">{session.description}</p>

                  {session.status === "RSVP Needed" && (
                    <div className="flex gap-2 mt-4">
                      <Button>RSVP Now</Button>
                      <Button variant="outline">Decline</Button>
                    </div>
                  )}

                  {session.status === "Confirmed" && (
                    <div className="mt-4">
                      <Button variant="outline">Cancel RSVP</Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="calendar" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Calendar View</CardTitle>
              <CardDescription>Select a date to view scheduled sessions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-6">
                <Calendar mode="single" selected={date} onSelect={setDate} className="rounded-md border" />

                <div className="flex-1">
                  <h3 className="font-medium mb-4">
                    Sessions on{" "}
                    {date?.toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </h3>

                  <div className="space-y-4">
                    {sessions
                      .filter((session) => new Date(session.date).toDateString() === date?.toDateString())
                      .map((session) => (
                        <div key={session.id} className="border rounded-md p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium">{session.title}</h4>
                              <p className="text-sm text-muted-foreground">
                                {session.time} • {session.location}
                              </p>
                            </div>
                            <div
                              className={`text-sm px-2 py-1 rounded-full ${
                                session.status === "Confirmed"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {session.status}
                            </div>
                          </div>

                          <p className="text-sm mt-2">{session.description}</p>

                          {session.status === "RSVP Needed" && (
                            <div className="flex gap-2 mt-4">
                              <Button size="sm">RSVP Now</Button>
                              <Button size="sm" variant="outline">
                                Decline
                              </Button>
                            </div>
                          )}

                          {session.status === "Confirmed" && (
                            <div className="mt-4">
                              <Button size="sm" variant="outline">
                                Cancel RSVP
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}

                    {sessions.filter((session) => new Date(session.date).toDateString() === date?.toDateString())
                      .length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">No sessions scheduled for this date</div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
