"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { QRScanner } from "@/components/qr-scanner/qr-scanner"
import { CheckCircle, QrCode, Search, UserPlus, AlertCircle } from "lucide-react"
import { Session, Attendee } from "@/lib/google-sheets/service"
import { toast } from "sonner"

export default function ScanPage() {
  const [isScanning, setIsScanning] = useState(false)
  const [scanResult, setScanResult] = useState<null | Attendee>(null)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [showErrorDialog, setShowErrorDialog] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [sessions, setSessions] = useState<Session[]>([])
  const [selectedSession, setSelectedSession] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Attendee[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [scanSuccess, setScanSuccess] = useState(false)
  const [isProcessingScan, setIsProcessingScan] = useState(false)
  const [recentScans, setRecentScans] = useState<{[key: string]: number}>({})
  
  // Configuration for scan throttling
  const SCAN_COOLDOWN_MS = 5000 // 5 seconds cooldown between duplicate scans

  // Fetch sessions and attendees from the API
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch sessions
        const sessionsResponse = await fetch('/api/sessions');
        const sessionsData = await sessionsResponse.json();
        
        if (sessionsData.sessions) {
          setSessions(sessionsData.sessions);
        }
        
        // Fetch all attendees for dropdown
        const attendeesResponse = await fetch('/api/attendees');
        const attendeesData = await attendeesResponse.json();
        
        if (attendeesData.attendees) {
          // Sort attendees alphabetically by name
          const sortedAttendees = [...attendeesData.attendees].sort((a, b) => 
            a.name.localeCompare(b.name)
          );
          setSearchResults(sortedAttendees);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handle successful QR code scan
  const handleScanSuccess = async (result: string) => {
    // Prevent processing if a scan is already in progress
    if (isProcessingScan) {
      console.log('⏳ Scan already in progress, ignoring new scan');
      return;
    }
    
    // Check if we've recently scanned this QR code
    const now = Date.now();
    const lastScanTime = recentScans[result] || 0;
    const timeSinceLastScan = now - lastScanTime;
    
    if (lastScanTime > 0 && timeSinceLastScan < SCAN_COOLDOWN_MS) {
      console.log(`🔄 Duplicate scan detected! Last scanned ${timeSinceLastScan}ms ago. Ignoring.`);
      // Show a brief "duplicate scan" indicator
      toast.info(`Already scanned (${Math.round(timeSinceLastScan / 1000)}s ago)`);
      return;
    }
    
    if (!selectedSession) {
      setErrorMessage('Please select a session before scanning');
      setShowErrorDialog(true);
      return;
    }

    try {
      // Mark that we're processing a scan to prevent multiple concurrent scans
      setIsProcessingScan(true);
      
      // Record this scan in our recent scans tracking
      setRecentScans(prev => ({
        ...prev,
        [result]: now
      }));
      
      // Show success indicator immediately for better UX
      setScanSuccess(true);
      
      console.log('✅ QR CODE SCANNED! Processing:', result);
      
      // Lookup attendee by QR code
      console.log('Looking up attendee by QR code...');
      const attendeeResponse = await fetch(`/api/attendees/qrcode/${encodeURIComponent(result)}`);
      
      if (!attendeeResponse.ok) {
        console.error('API response error:', await attendeeResponse.text());
        throw new Error('Attendee not found for this QR code');
      }
      
      const attendeeData = await attendeeResponse.json();
      
      if (!attendeeData.attendee) {
        console.error('No attendee found in response data');
        throw new Error('Invalid QR code');
      }
      
      const attendee = attendeeData.attendee;
      console.log('Found attendee:', attendee.name);
      setScanResult(attendee);
      
      // Log attendance
      console.log('Logging attendance for:', attendee.name);
      const success = await logAttendance(selectedSession, attendee.id, 'QR_SCAN', attendee.name);
      
      if (success) {
        console.log('✅ SUCCESS: Attendance logged to spreadsheet');
        setShowSuccessDialog(true);
        
        // Keep success indicator visible for a few seconds
        setTimeout(() => {
          setScanSuccess(false);
        }, 3000);
      } else {
        console.error('❌ FAILED to log attendance');
        setScanSuccess(false);
        throw new Error('Failed to log attendance');
      }
    } catch (error) {
      console.error('Error processing QR code:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to process QR code');
      setShowErrorDialog(true);
      setScanSuccess(false);
    } finally {
      // Reset processing state after a short delay to prevent rapid re-scanning
      setTimeout(() => {
        setIsProcessingScan(false);
      }, 1000);
    }
  };

  // Log attendance to the API
  const logAttendance = async (sessionId: string, attendeeId: string, method: 'QR_SCAN' | 'MANUAL', attendeeName?: string) => {
    try {
      console.log('LOGGING ATTENDANCE...', { sessionId, attendeeId, method, attendeeName });
      
      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          attendeeId,
          method,
          attendeeName
        }),
      });

      // Parse the response
      let responseData;
      try {
        responseData = await response.json();
        console.log('Attendance API response:', response.status, responseData);
      } catch (e) {
        const text = await response.text();
        console.log('Attendance API response text:', response.status, text);
        throw new Error(`Failed to parse response: ${text}`);
      }
      
      // Check if attendance was already recorded
      if (responseData.alreadyLogged) {
        console.log('⚠️ Attendance was already logged for this session today');
        toast.info(`${attendeeName || 'Attendee'} already checked in for this session`);
        
        // Still show success dialog with the attendee info
        if (method === 'QR_SCAN') {
          // For QR scans, we need to find the attendee by ID to display their info
          try {
            if (!attendeeName) {
              const attendeeResponse = await fetch(`/api/attendees/id/${attendeeId}`);
              if (attendeeResponse.ok) {
                const data = await attendeeResponse.json();
                if (data.attendee) {
                  setScanResult(data.attendee);
                }
              }
            }
          } catch (e) {
            console.error('Error fetching attendee for already logged entry:', e);
          }
        }
        
        return true; // Still return true since this isn't an error
      }
      
      if (!response.ok) {
        throw new Error(`Failed to log attendance: ${response.status}`);
      }

      toast.success('Attendance recorded successfully');
      return true;
    } catch (error) {
      console.error('Error logging attendance:', error);
      toast.error('Failed to log attendance');
      return false;
    }
  };

  // We no longer need to search for attendees as we're using a dropdown
  // All attendees are loaded on page load and sorted alphabetically

  // State for selected attendee in dropdown
  const [selectedAttendee, setSelectedAttendee] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Mark attendee as present manually
  const markAttendeePresent = async () => {
    if (!selectedSession) {
      toast.error('Please select a session first');
      return;
    }
    
    if (!selectedAttendee) {
      toast.error('Please select an attendee');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const success = await logAttendance(selectedSession, selectedAttendee, 'MANUAL');
      
      if (success) {
        toast.success('Attendance recorded successfully');
        // Keep the session selected but reset the attendee selection
        setSelectedAttendee('');
      }
    } catch (error) {
      console.error('Error recording attendance:', error);
      toast.error('Failed to record attendance');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Manual QR input section has been removed
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Attendance Scanner</h1>
        <p className="text-muted-foreground">Scan QR codes or manually log attendance.</p>
      </div>

      <Tabs defaultValue="scan">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="scan" className="flex items-center gap-2">
            <QrCode className="h-4 w-4" />
            Scan QR Code
          </TabsTrigger>
          <TabsTrigger value="manual" className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Manual Search
          </TabsTrigger>
        </TabsList>

        <TabsContent value="scan" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Scan Attendance QR Code</CardTitle>
              <CardDescription>Select a session and scan attendee QR codes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="session">Select Session</Label>
                <Select
                  value={selectedSession}
                  onValueChange={setSelectedSession}
                  disabled={isLoading}
                >
                  <SelectTrigger id="session">
                    <SelectValue placeholder="Select a session" />
                  </SelectTrigger>
                  <SelectContent>
                    {sessions.map((session) => (
                      <SelectItem key={session.id} value={session.id}>
                        {session.title} - {session.date}, {session.time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col items-center justify-center border rounded-lg p-6 min-h-[300px]">
                {isLoading ? (
                  <div className="text-center space-y-4">
                    <p className="text-muted-foreground">Loading sessions...</p>
                  </div>
                ) : (
                  <div className="w-full">
                    <QRScanner
                      isScanning={isScanning}
                      onToggleScanning={setIsScanning}
                      onScanSuccess={handleScanSuccess}
                      onScanError={(error) => {
                        console.error('Scan error:', error);
                        setErrorMessage('Error accessing camera: ' + error.message);
                        setShowErrorDialog(true);
                      }}
                      scanSuccess={scanSuccess}
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Manual QR Input section has been removed */}

        <TabsContent value="manual" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Manual Search</CardTitle>
              <CardDescription>Select an attendee from the dropdown list</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="manual-session">Select Session</Label>
                <Select
                  value={selectedSession}
                  onValueChange={setSelectedSession}
                  disabled={isLoading}
                >
                  <SelectTrigger id="manual-session">
                    <SelectValue placeholder="Select a session" />
                  </SelectTrigger>
                  <SelectContent>
                    {sessions.map((session) => (
                      <SelectItem key={session.id} value={session.id}>
                        {session.title} - {session.date}, {session.time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="attendee-dropdown">Select Attendee</Label>
                <Select
                  disabled={isLoading || !selectedSession}
                  value={selectedAttendee}
                  onValueChange={setSelectedAttendee}
                >
                  <SelectTrigger id="attendee-dropdown">
                    <SelectValue placeholder="Choose an attendee" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {searchResults.map((attendee) => (
                      <SelectItem key={attendee.id} value={attendee.id}>
                        {attendee.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!selectedSession && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Please select a session first
                  </p>
                )}
              </div>
              
              <Button 
                onClick={markAttendeePresent} 
                disabled={isLoading || !selectedSession || !selectedAttendee || isSubmitting}
                className="w-full mt-4"
              >
                {isSubmitting ? 'Recording Attendance...' : 'Submit Attendance'}
              </Button>

              <div className="border rounded-lg p-4 space-y-2">
                <h3 className="font-medium">Instructions</h3>
                <ol className="list-decimal ml-5 text-sm text-muted-foreground space-y-1">
                  <li>Select a session from the dropdown</li>
                  <li>Select an attendee from the alphabetical list</li>
                  <li>Click the Submit button to record attendance</li>
                </ol>
              </div>
              
              {searchResults.length === 0 && !isLoading && (
                <div className="text-amber-600 text-sm">
                  No attendees found. Please make sure attendees are added to the system.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center justify-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span>Attendance Recorded</span>
            </DialogTitle>
            <DialogDescription className="text-center">The attendee has been successfully checked in.</DialogDescription>
          </DialogHeader>

          {scanResult && (
            <div className="flex items-center gap-4 p-4 border rounded-lg bg-green-50">
              <div className="bg-green-100 p-2 rounded-full">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <div className="font-medium">{scanResult.name}</div>
                <div className="text-sm text-muted-foreground">{scanResult.email}</div>
                <div className="text-xs text-green-600 mt-1">Recorded at {new Date().toLocaleTimeString()}</div>
                <div className="text-xs text-gray-500 mt-1">Scanner ready for next attendee</div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              onClick={() => {
                setShowSuccessDialog(false);
                setScanResult(null);
              }}
            >
              Continue Scanning
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Error Dialog */}
      <Dialog open={showErrorDialog} onOpenChange={setShowErrorDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Error</DialogTitle>
            <DialogDescription>There was an issue processing the QR code.</DialogDescription>
          </DialogHeader>

          <div className="flex items-center gap-4 p-4 border rounded-lg bg-red-50">
            <div className="bg-red-100 p-2 rounded-full">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <div className="font-medium">Error</div>
              <div className="text-sm text-muted-foreground">{errorMessage}</div>
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={() => {
                setShowErrorDialog(false);
                setErrorMessage('');
              }}
            >
              Try Again
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
