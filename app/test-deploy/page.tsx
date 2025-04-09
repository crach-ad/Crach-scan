'use client';

import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Link from 'next/link';

export default function TestDeployPage() {
  return (
    <div className="container mx-auto py-10">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-center">Deployment Test Page</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center mb-4">
            If you can see this page, your Vercel deployment is working correctly!
          </p>
          <p className="text-sm text-muted-foreground">
            Current time: {new Date().toLocaleString()}
          </p>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button asChild>
            <Link href="/">Back to Home</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
