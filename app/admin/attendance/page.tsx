"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download, Loader2, Search } from "lucide-react"
import { AttendanceRecord, Session } from "@/lib/google-sheets/service"
import { toast } from "sonner"

interface EnhancedAttendanceRecord extends AttendanceRecord {
  sessionTitle?: string;
}

export default function AttendancePage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [sessionFilter, setSessionFilter] = useState("all")
  const [isLoading, setIsLoading] = useState(true)
  const [attendanceRecords, setAttendanceRecords] = useState<EnhancedAttendanceRecord[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [error, setError] = useState<string | null>(null)

  // Fetch attendance records and sessions from the API
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      setError(null)
      
      try {
        // Fetch attendance records
        const attendanceResponse = await fetch('/api/attendance');
        
        if (!attendanceResponse.ok) {
          throw new Error(`Failed to fetch attendance: ${attendanceResponse.status}`);
        }
        
        const attendanceData = await attendanceResponse.json();
        
        // Fetch sessions to get titles
        const sessionsResponse = await fetch('/api/sessions');
        
        if (!sessionsResponse.ok) {
          throw new Error(`Failed to fetch sessions: ${sessionsResponse.status}`);
        }
        
        const sessionsData = await sessionsResponse.json();
        
        // Prepare data
        if (sessionsData.sessions && attendanceData.records) {
          // Create a map of session IDs to titles for quick lookup
          const sessionMap = new Map();
          sessionsData.sessions.forEach((session: Session) => {
            sessionMap.set(session.id, session);
          });
          
          // Enhance attendance records with session titles
          const enhancedRecords = attendanceData.records.map((record: AttendanceRecord) => {
            const session = sessionMap.get(record.sessionId);
            return {
              ...record,
              sessionTitle: session ? session.title : 'Unknown Session'
            };
          });
          
          setAttendanceRecords(enhancedRecords);
          setSessions(sessionsData.sessions);
        } else {
          setAttendanceRecords([]);
          setSessions([]);
        }
      } catch (err) {
        console.error('Error fetching attendance data:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        toast.error('Failed to load attendance records');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Get unique session titles for filter
  const sessionTitles = [...new Set(attendanceRecords.map((record) => record.sessionTitle))]

  // Filter records based on search query and session filter
  const filteredRecords = attendanceRecords.filter((record) => {
    const matchesSearch =
      record.attendeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.attendeeId.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesSession = sessionFilter === "all" || record.sessionTitle === sessionFilter

    return matchesSearch && matchesSession
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Attendance Records</h1>
        <p className="text-muted-foreground">View and manage attendance for all sessions.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Attendance Log</CardTitle>
          <CardDescription>Complete attendance history for all sessions</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="bg-red-50 text-red-700 p-4 rounded-md mb-4">
              {error}
            </div>
          )}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={sessionFilter} onValueChange={setSessionFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Filter by session" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sessions</SelectItem>
                {sessionTitles.map((sessionTitle) => (
                  <SelectItem key={sessionTitle} value={sessionTitle}>
                    {sessionTitle}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button 
              variant="outline" 
              className="flex items-center gap-2"
              onClick={() => {
                // Create CSV content
                const headers = ['Attendee Name', 'Attendee ID', 'Session', 'Date & Time', 'Method'];
                const csvContent = [
                  headers.join(','),
                  ...filteredRecords.map(record => [
                    `"${record.attendeeName}"`,
                    record.attendeeId,
                    `"${record.sessionTitle}"`,
                    new Date(record.timestamp).toLocaleString(),
                    record.method
                  ].join(','))
                ].join('\n');
                
                // Create and download the file
                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.setAttribute('href', url);
                link.setAttribute('download', `attendance-log-${new Date().toISOString().split('T')[0]}.csv`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                toast.success('CSV file downloaded');
              }}
            >
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>ID</TableHead>
                  <TableHead>Session</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Method</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      <div className="flex justify-center items-center">
                        <Loader2 className="h-6 w-6 animate-spin mr-2" />
                        <span>Loading attendance records...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredRecords.length > 0 ? (
                  filteredRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">{record.attendeeName}</TableCell>
                      <TableCell>{record.attendeeId}</TableCell>
                      <TableCell>{record.sessionTitle}</TableCell>
                      <TableCell>{new Date(record.timestamp).toLocaleString()}</TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            record.method === "QR_SCAN" ? "bg-blue-100 text-blue-800" : "bg-purple-100 text-purple-800"
                          }`}
                        >
                          {record.method === "QR_SCAN" ? "QR Code" : "Manual"}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      No results found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
