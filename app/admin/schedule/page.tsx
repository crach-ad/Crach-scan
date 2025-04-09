"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { CalendarDays, ListFilter, Plus, RefreshCw, Trash2, Loader2, Calendar as CalendarIcon } from "lucide-react"
import { toast } from "sonner"
import { Session } from "@/lib/google-sheets/service"

// Helper function to format date for display
const formatDate = (dateString: string) => {
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    })
  } catch (e) {
    return dateString
  }
}

export default function AdminSchedulePage() {
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [sessions, setSessions] = useState<Session[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // New session form state
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newSessionTitle, setNewSessionTitle] = useState("")
  const [newSessionDate, setNewSessionDate] = useState("")
  const [newSessionTime, setNewSessionTime] = useState("")
  const [newSessionLocation, setNewSessionLocation] = useState("")
  const [newSessionDescription, setNewSessionDescription] = useState("")
  const [isRecurring, setIsRecurring] = useState(false)
  const [recurringWeeks, setRecurringWeeks] = useState("4")
  const [recurringInterval, setRecurringInterval] = useState("7")
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Delete session state
  const [sessionToDelete, setSessionToDelete] = useState<Session | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  
  // Fetch sessions from the API
  const fetchSessions = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/sessions')
      
      if (!response.ok) {
        throw new Error(`Failed to fetch sessions: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (data.sessions) {
        // Sort sessions by date
        const sortedSessions = [...data.sessions].sort((a, b) => {
          return new Date(a.date).getTime() - new Date(b.date).getTime()
        })
        
        setSessions(sortedSessions)
      } else {
        setSessions([])
      }
    } catch (err) {
      console.error('Error fetching sessions:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch sessions')
    } finally {
      setIsLoading(false)
    }
  }
  
  // Load sessions on component mount
  useEffect(() => {
    fetchSessions()
  }, [])
  
  // Handle session creation
  const handleCreateSession = async () => {
    if (!newSessionTitle || !newSessionDate || !newSessionTime) {
      toast.error('Please fill in all required fields')
      return
    }
    
    setIsSubmitting(true)
    
    try {
      const response = await fetch('/api/sessions/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: newSessionTitle,
          date: newSessionDate,
          time: newSessionTime,
          location: newSessionLocation || undefined,
          description: newSessionDescription || undefined,
          isRecurring,
          recurringWeeks: isRecurring ? recurringWeeks : undefined,
          recurringInterval: isRecurring ? recurringInterval : undefined
        }),
      })
      
      const data = await response.json()
      
      if (response.ok) {
        toast.success(data.message || 'Session created successfully')
        
        // Reset form
        setNewSessionTitle('')
        setNewSessionDate('')
        setNewSessionTime('')
        setNewSessionLocation('')
        setNewSessionDescription('')
        setIsRecurring(false)
        setRecurringWeeks('4')
        setRecurringInterval('7')
        
        // Close dialog
        setIsDialogOpen(false)
        
        // Refresh sessions list
        fetchSessions()
      } else {
        throw new Error(data.error || 'Failed to create session')
      }
    } catch (err) {
      console.error('Error creating session:', err)
      toast.error(err instanceof Error ? err.message : 'Failed to create session')
    } finally {
      setIsSubmitting(false)
    }
  }
  
  // Handle session deletion
  const handleDeleteSession = async () => {
    if (!sessionToDelete) return
    
    setIsDeleting(true)
    
    try {
      const response = await fetch(`/api/sessions/delete?id=${sessionToDelete.id}`, {
        method: 'DELETE',
      })
      
      const data = await response.json()
      
      if (response.ok) {
        toast.success('Session deleted successfully')
        
        // Close dialog
        setIsDeleteDialogOpen(false)
        
        // Refresh sessions list
        fetchSessions()
      } else {
        throw new Error(data.error || 'Failed to delete session')
      }
    } catch (err) {
      console.error('Error deleting session:', err)
      toast.error(err instanceof Error ? err.message : 'Failed to delete session')
    } finally {
      setIsDeleting(false)
      setSessionToDelete(null)
    }
  }
  
  // Filter sessions for calendar view
  const getSessionsForDate = (selectedDate: Date) => {
    if (!sessions || sessions.length === 0) return []
    
    // We need to compare dates without time component
    const dateString = selectedDate.toISOString().split('T')[0]
    return sessions.filter(session => {
      // Make sure both dates are in the same format for comparison
      const sessionDateString = new Date(session.date).toISOString().split('T')[0]
      return sessionDateString === dateString
    })
  }

  return (
    <div className="space-y-6">
      {/* Delete Session Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        {sessionToDelete && (
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Session</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{sessionToDelete.title}" scheduled for {formatDate(sessionToDelete.date)}?
                {sessionToDelete.isRecurring && (
                  <div className="mt-2 p-2 bg-amber-50 text-amber-700 rounded-md">
                    <p className="font-semibold">Warning: This is a recurring session</p>
                    <p className="text-sm">Only this session will be deleted, not the entire series.</p>
                  </div>
                )}
                {sessionToDelete.parentSessionId && (
                  <div className="mt-2 p-2 bg-purple-50 text-purple-700 rounded-md">
                    <p className="font-semibold">Recurring Instance</p>
                    <p className="text-sm">This is part of a recurring series. Only this instance will be deleted.</p>
                  </div>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                disabled={isDeleting}
                onClick={(e) => {
                  e.preventDefault()
                  handleDeleteSession()
                }}
                className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete Session'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        )}
      </AlertDialog>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Schedule Management</h1>
          <p className="text-muted-foreground">Create and manage session schedules.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchSessions} variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Session
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px]">
              <DialogHeader>
                <DialogTitle>Add New Session</DialogTitle>
                <DialogDescription>
                  Create a new session. Fill in the details below.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Session Title <span className="text-red-500">*</span></Label>
                  <Input
                    id="title"
                    placeholder="Enter session title"
                    value={newSessionTitle}
                    onChange={(e) => setNewSessionTitle(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="date">Date <span className="text-red-500">*</span></Label>
                    <Input
                      id="date"
                      type="date"
                      value={newSessionDate}
                      onChange={(e) => setNewSessionDate(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="time">Time <span className="text-red-500">*</span></Label>
                    <Input
                      id="time"
                      placeholder="e.g., 10:00 AM - 12:00 PM"
                      value={newSessionTime}
                      onChange={(e) => setNewSessionTime(e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="location">Location (Optional)</Label>
                  <Input
                    id="location"
                    placeholder="Enter location"
                    value={newSessionLocation}
                    onChange={(e) => setNewSessionLocation(e.target.value)}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="recurring" 
                    checked={isRecurring}
                    onCheckedChange={(checked) => {
                      setIsRecurring(checked === true)
                    }}
                  />
                  <label htmlFor="recurring" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Make this a recurring session
                  </label>
                </div>
                
                {isRecurring && (
                  <div className="grid grid-cols-2 gap-4 bg-muted/50 p-3 rounded-md">
                    <div className="grid gap-2">
                      <Label htmlFor="recurringWeeks">Weeks</Label>
                      <Input
                        id="recurringWeeks"
                        type="number"
                        min="1"
                        placeholder="Number of weeks"
                        value={recurringWeeks}
                        onChange={(e) => setRecurringWeeks(e.target.value)}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="recurringInterval">Interval (days)</Label>
                      <Input
                        id="recurringInterval"
                        type="number"
                        min="1"
                        placeholder="Days between sessions"
                        value={recurringInterval}
                        onChange={(e) => setRecurringInterval(e.target.value)}
                      />
                    </div>
                    <div className="col-span-2 text-xs text-muted-foreground mt-1">
                      This will create {recurringWeeks} total sessions, including the initial one, 
                      each {recurringInterval} days apart.
                    </div>
                  </div>
                )}
                
                <div className="grid gap-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea 
                    id="description" 
                    placeholder="Enter session description" 
                    value={newSessionDescription}
                    onChange={(e) => setNewSessionDescription(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateSession} disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Session'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
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
          {isLoading ? (
            <Card>
              <CardContent className="p-6">
                <div className="flex justify-center items-center h-24">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  <span>Loading sessions...</span>
                </div>
              </CardContent>
            </Card>
          ) : error ? (
            <Card>
              <CardContent className="p-6">
                <div className="bg-red-50 text-red-700 p-4 rounded-md">
                  {error}
                </div>
              </CardContent>
            </Card>
          ) : sessions.length === 0 ? (
            <Card>
              <CardContent className="p-6">
                <div className="text-center py-6 text-muted-foreground">
                  <p>No sessions found. Click "Add Session" to create one.</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            sessions.map((session) => (
              <Card key={session.id}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {session.title}
                        {session.isRecurring && (
                          <span className="inline-flex items-center text-xs font-medium px-2 py-1 rounded-full bg-blue-50 text-blue-700">
                            <RefreshCw className="h-3 w-3 mr-1" />
                            Recurring
                          </span>
                        )}
                        {session.parentSessionId && (
                          <span className="inline-flex items-center text-xs font-medium px-2 py-1 rounded-full bg-purple-50 text-purple-700">
                            <CalendarIcon className="h-3 w-3 mr-1" />
                            Recurring Instance
                          </span>
                        )}
                      </CardTitle>
                      <CardDescription>
                        {formatDate(session.date)} • {session.time}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSessionToDelete(session)
                          setIsDeleteDialogOpen(true)
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-2">
                    {session.location && (
                      <p className="text-sm text-muted-foreground">
                        <strong>Location:</strong> {session.location}
                      </p>
                    )}
                    {session.description && (
                      <p className="text-sm">{session.description}</p>
                    )}
                    {session.isRecurring && (
                      <div className="text-xs text-blue-600 mt-2">
                        Repeats for {session.recurringWeeks} weeks, every {session.recurringInterval} days
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="calendar" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Calendar View</CardTitle>
              <CardDescription>Select a date to view or add scheduled sessions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-6">
                <Calendar 
                  mode="single" 
                  selected={date} 
                  onSelect={setDate} 
                  className="rounded-md border" 
                />

                <div className="flex-1">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium">
                      Sessions on{" "}
                      {date?.toLocaleDateString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </h3>

                    <Button 
                      size="sm" 
                      className="flex items-center gap-2"
                      onClick={() => {
                        // Pre-fill the date field with the selected date
                        if (date) {
                          const formattedDate = date.toISOString().split('T')[0]
                          setNewSessionDate(formattedDate)
                        }
                        setIsDialogOpen(true)
                      }}
                    >
                      <Plus className="h-3 w-3" />
                      Add for this date
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {isLoading ? (
                      <div className="flex items-center justify-center h-24 border rounded-lg p-4">
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        <p className="text-sm">Loading sessions...</p>
                      </div>
                    ) : error ? (
                      <div className="flex items-center justify-center h-24 border rounded-lg p-4 bg-red-50">
                        <p className="text-sm text-red-600">{error}</p>
                      </div>
                    ) : getSessionsForDate(date ?? new Date()).length === 0 ? (
                      <div className="flex items-center justify-center h-24 border rounded-lg">
                        <p className="text-sm text-muted-foreground">No sessions scheduled for this date.</p>
                      </div>
                    ) : (
                      getSessionsForDate(date ?? new Date()).map((session) => (
                        <div key={session.id} className="flex items-center gap-4 p-3 border rounded-lg">
                          <div className="flex-1">
                            <h4 className="font-medium flex items-center gap-1">
                              {session.title}
                              {session.isRecurring && (
                                <span title="Recurring session">
                                  <RefreshCw className="h-3 w-3 text-blue-500 ml-1" />
                                </span>
                              )}
                              {session.parentSessionId && (
                                <span title="Part of recurring series">
                                  <CalendarIcon className="h-3 w-3 text-purple-500 ml-1" />
                                </span>
                              )}
                            </h4>
                            <p className="text-sm text-muted-foreground">{session.time}</p>
                            {session.location && (
                              <p className="text-xs text-muted-foreground mt-1">Location: {session.location}</p>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSessionToDelete(session)
                              setIsDeleteDialogOpen(true)
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      ))
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
