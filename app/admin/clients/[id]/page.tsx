'use client';

import { useState, useEffect } from 'react';
import { use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, 
  Loader2, 
  Mail, 
  User, 
  Calendar, 
  ClipboardCopy
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { Attendee } from '@/lib/google-sheets/service';
import { QRCodeSVG } from 'qrcode.react';

interface ClientDetailPageProps {
  params: {
    id: string;
  };
}

export default function ClientDetailPage({ params }: ClientDetailPageProps) {
  // Next.js 15+ requires using React.use() to unwrap the params Promise
  // Explicitly type the unwrapped params to fix TypeScript errors
  const unwrappedParams = use(params as any) as { id: string };
  const clientId = unwrappedParams.id;
  
  const router = useRouter();
  const [client, setClient] = useState<Attendee | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchClient();
  }, [clientId]);

  const fetchClient = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/clients?id=${clientId}`);
      const data = await response.json();
      
      if (data.client) {
        setClient(data.client);
        setName(data.client.name);
        setEmail(data.client.email);
      } else {
        toast({
          title: "Error",
          description: "Client not found",
          variant: "destructive",
        });
        router.push('/admin/clients');
      }
    } catch (error) {
      console.error('Error fetching client details:', error);
      toast({
        title: "Error",
        description: "Failed to load client details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateClient = async () => {
    if (!name.trim() || !email.trim()) {
      toast({
        title: "Validation Error",
        description: "Name and email are required",
        variant: "destructive",
      });
      return;
    }

    try {
      setUpdating(true);
      const response = await fetch('/api/clients/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: clientId,
          name,
          email
        }),
      });

      const data = await response.json();

      if (data.success) {
        setClient(data.client);
        setIsEditing(false);
        toast({
          title: "Success",
          description: "Client information updated",
        });
      } else {
        throw new Error(data.error || 'Failed to update client');
      }
    } catch (error) {
      console.error('Error updating client:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update client",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const copyQrCode = () => {
    if (client) {
      navigator.clipboard.writeText(client.qrCode);
      toast({
        title: "Copied to clipboard",
        description: `QR Code: ${client.qrCode}`,
      });
    }
  };

  const downloadQrCode = () => {
    if (!client) return;
    
    const canvas = document.getElementById('client-qr-code') as HTMLCanvasElement;
    const dataUrl = canvas.toDataURL('image/png');
    
    const downloadLink = document.createElement('a');
    downloadLink.href = dataUrl;
    downloadLink.download = `qrcode-${client.name.replace(/\s+/g, '-').toLowerCase()}.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-2">Loading client details...</p>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <div className="flex flex-col items-center">
          <p className="text-xl mb-4">Client not found</p>
          <Button onClick={() => router.push('/admin/clients')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Clients
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Button variant="outline" onClick={() => router.push('/admin/clients')} className="mr-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Clients
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Client Details</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Client Information</CardTitle>
            <CardDescription>
              View and manage client details
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Client name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Client email"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center border-b pb-4">
                  <User className="mr-3 h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Name</p>
                    <p className="font-medium">{client.name}</p>
                  </div>
                </div>
                <div className="flex items-center border-b pb-4">
                  <Mail className="mr-3 h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{client.email}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <Calendar className="mr-3 h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Created</p>
                    <p className="font-medium">{new Date(client.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            {isEditing ? (
              <>
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
                <Button onClick={updateClient} disabled={updating}>
                  {updating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </>
            ) : (
              <Button onClick={() => setIsEditing(true)}>
                Edit Client
              </Button>
            )}
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>QR Code</CardTitle>
            <CardDescription>
              Client's unique QR code for attendance scanning
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <div className="flex flex-col items-center space-y-6">
              <div className="bg-white p-3 rounded-lg">
                <QRCodeSVG
                  id="client-qr-code"
                  value={client.qrCode}
                  size={200}
                  level="H"
                  includeMargin={true}
                />
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-1">QR Code ID</p>
                <div className="flex items-center justify-center">
                  <p className="text-lg font-mono font-medium">{client.qrCode}</p>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={copyQrCode}
                    className="ml-1"
                  >
                    <ClipboardCopy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="justify-center">
            <Button onClick={downloadQrCode} variant="outline">
              Download QR Code
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
