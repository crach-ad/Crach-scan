'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

export default function NewClientPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createClient = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !email.trim()) {
      toast({
        title: "Error",
        description: "Name and email are required",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      const response = await fetch('/api/clients/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email }),
      });

      const data = await response.json();

      if (response.ok && data.client) {
        toast({
          title: "Success",
          description: "Client created successfully",
        });
        
        // Navigate to the new client's detail page
        router.push(`/admin/clients/${data.client.id}`);
      } else {
        throw new Error(data.error || 'Failed to create client');
      }
    } catch (error) {
      console.error('Error creating client:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create client",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Button variant="outline" onClick={() => router.push('/admin/clients')} className="mr-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Clients
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Add New Client</h1>
      </div>

      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Client Information</CardTitle>
          <CardDescription>
            Enter the details for the new client
          </CardDescription>
        </CardHeader>
        <form onSubmit={createClient}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter client name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter client email"
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button type="button" variant="outline" onClick={() => router.push('/admin/clients')}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...
                </>
              ) : (
                'Create Client'
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
