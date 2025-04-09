"use client";

import { useEffect, useState } from 'react';
import { QRCodeDisplay } from '@/components/qr-generator/qr-code-display';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Attendee } from '@/lib/google-sheets/service';

export default function QRCodesPage() {
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filteredAttendees, setFilteredAttendees] = useState<Attendee[]>([]);

  // Fetch attendees on page load
  useEffect(() => {
    const fetchAttendees = async () => {
      try {
        const response = await fetch('/api/attendees');
        const data = await response.json();
        
        if (data.attendees) {
          setAttendees(data.attendees);
          setFilteredAttendees(data.attendees);
        }
      } catch (error) {
        console.error('Error fetching attendees:', error);
        toast.error('Failed to load attendees');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAttendees();
  }, []);

  // Filter attendees based on search term
  useEffect(() => {
    if (!search.trim()) {
      setFilteredAttendees(attendees);
      return;
    }

    const searchTerm = search.toLowerCase();
    const filtered = attendees.filter(
      attendee => 
        attendee.name.toLowerCase().includes(searchTerm) || 
        attendee.email.toLowerCase().includes(searchTerm)
    );
    
    setFilteredAttendees(filtered);
  }, [search, attendees]);

  return (
    <div className="container mx-auto py-10 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">QR Codes</h1>
        <p className="text-muted-foreground">View and download QR codes for attendees</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Search Attendees</CardTitle>
          <CardDescription>Find an attendee to view their QR code</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="search">Search by name or email</Label>
              <Input
                id="search"
                placeholder="Type to search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <div className="col-span-full text-center py-8">Loading attendees...</div>
        ) : filteredAttendees.length === 0 ? (
          <div className="col-span-full text-center py-8">
            {search.trim() ? 'No attendees found matching your search.' : 'No attendees available.'}
          </div>
        ) : (
          filteredAttendees.map((attendee) => (
            <div key={attendee.id} className="flex flex-col space-y-3">
              <QRCodeDisplay
                value={attendee.qrCode}
                name={attendee.name}
                email={attendee.email}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
