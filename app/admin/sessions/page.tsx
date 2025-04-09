"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Session } from "@/lib/google-sheets/service"
import { Plus, Trash2, RefreshCw, Loader2, Calendar } from "lucide-react"
import { toast } from "sonner"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // New session form state
  const [newSessionTitle, setNewSessionTitle] = useState("")
  const [newSessionDate, setNewSessionDate] = useState("")
  const [newSessionTime, setNewSessionTime] = useState("")
  const [isRecurring, setIsRecurring] = useState(false)
  const [recurringWeeks, setRecurringWeeks] = useState("4")
  const [recurringInterval, setRecurringInterval] = useState("7")
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Delete session state
  const [sessionToDelete, setSessionToDelete] = useState<Session | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  
  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false)

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
        // Sort sessions by date, newest first
        const sortedSessions = [...data.sessions].sort((a, b) => {
          return new Date(b.date).getTime() - new Date(a.date).getTime()
        })
        
        setSessions(sortedSessions)
      } else {
        setSessions([])
      }
    } catch (err) {
      console.error('Error fetching sessions:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
      toast.error('Failed to load sessions')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchSessions()
  }, [])
  
  // Format date for display
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
  
  // Handle creating a new session
  const handleCreateSession = async () => {
    // Validate form
    if (!newSessionTitle.trim()) {
      toast.error('Please enter a session title')
      return
    }
    
    if (!newSessionDate) {
      toast.error('Please select a session date')
      return
    }
    
    if (!newSessionTime) {
      toast.error('Please enter a session time')
      return
    }
    
    // Validate recurring options if applicable
    if (isRecurring) {
      const weeks = parseInt(recurringWeeks, 10)
      if (isNaN(weeks) || weeks <= 0) {
        toast.error('Number of recurring weeks must be a positive number')
        return
      }
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sessions</h1>
          <p className="text-muted-foreground">Manage and create attendance sessions</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchSessions} variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            New Session
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sessions Management</CardTitle>
          <CardDescription>View, create, and manage attendance sessions</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="bg-red-50 text-red-700 p-4 rounded-md mb-4">
              {error}
            </div>
          )}
          
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      <div className="flex justify-center items-center">
                        <Loader2 className="h-6 w-6 animate-spin mr-2" />
                        <span>Loading sessions...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : sessions.length > 0 ? (
                  sessions.map((session) => (
                    <TableRow key={session.id}>
                      <TableCell className="font-medium">{session.title}</TableCell>
                      <TableCell>{formatDate(session.date)}</TableCell>
                      <TableCell>{session.time}</TableCell>
                      <TableCell>
                        {session.isRecurring ? (
                          <span className="flex items-center gap-1 text-blue-700">
                            <RefreshCw className="h-3 w-3" />
                            Recurring
                          </span>
                        ) : session.parentSessionId ? (
                          <span className="flex items-center gap-1 text-purple-700">
                            <Calendar className="h-3 w-3" />
                            Instance
                          </span>
                        ) : (
                          <span>Single</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
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
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      No sessions found. Click "New Session" to create one.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* New Session Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New Session</DialogTitle>
            <DialogDescription>
              Create a new session for tracking attendance. Fill in the details below.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">
                Title
              </Label>
              <Input
                id="title"
                className="col-span-3"
                placeholder="Session title"
                value={newSessionTitle}
                onChange={(e) => setNewSessionTitle(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="date" className="text-right">
                Date
              </Label>
              <Input
                id="date"
                className="col-span-3"
                type="date"
                value={newSessionDate}
                onChange={(e) => setNewSessionDate(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="time" className="text-right">
                Time
              </Label>
              <Input
                id="time"
                className="col-span-3"
                placeholder="e.g., 2:00 PM"
                value={newSessionTime}
                onChange={(e) => setNewSessionTime(e.target.value)}
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <div></div>
              <div className="col-span-3 flex items-center space-x-2">
                <Checkbox 
                  id="recurring" 
                  checked={isRecurring}
                  onCheckedChange={() => setIsRecurring(!isRecurring)}
                />
                <label
                  htmlFor="recurring"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  This is a recurring session
                </label>
              </div>
            </div>
            
            {isRecurring && (
              <>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="recurringWeeks" className="text-right">
                    Weeks
                  </Label>
                  <Input
                    id="recurringWeeks"
                    className="col-span-3"
                    type="number"
                    min="1"
                    placeholder="Number of weeks"
                    value={recurringWeeks}
                    onChange={(e) => setRecurringWeeks(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="recurringInterval" className="text-right">
                    Interval
                  </Label>
                  <Input
                    id="recurringInterval"
                    className="col-span-3"
                    type="number"
                    min="1"
                    placeholder="Days between sessions (default: 7)"
                    value={recurringInterval}
                    onChange={(e) => setRecurringInterval(e.target.value)}
                  />
                </div>
                <div className="col-span-4 text-xs text-muted-foreground">
                  This will create {recurringWeeks} total sessions, including the initial one, 
                  each {recurringInterval} days apart.
                </div>
              </>
            )}
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
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the session 
              "{sessionToDelete?.title}" on {sessionToDelete ? formatDate(sessionToDelete.date) : ''}.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleDeleteSession()
              }}
              className="bg-red-500 hover:bg-red-600"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
