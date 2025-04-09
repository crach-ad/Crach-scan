"use client";

import React from 'react';
import QRCode from 'react-qr-code';
import { Card, CardContent } from '@/components/ui/card';

interface QRCodeDisplayProps {
  value: string;
  name?: string;
  email?: string;
  size?: number;
}

export function QRCodeDisplay({ value, name, email, size = 200 }: QRCodeDisplayProps) {
  if (!value) {
    return null;
  }

  return (
    <Card className="overflow-hidden">
      <CardContent className="flex flex-col items-center p-6 space-y-4">
        <div className="p-4 bg-white rounded-lg border">
          <QRCode 
            value={value}
            size={size}
            style={{ height: "auto", maxWidth: "100%", width: "100%" }}
            viewBox={`0 0 ${size} ${size}`}
          />
        </div>
        
        {(name || email) && (
          <div className="text-center">
            {name && <div className="font-medium text-lg">{name}</div>}
            {email && <div className="text-muted-foreground text-sm">{email}</div>}
          </div>
        )}
        
        <div className="text-xs text-muted-foreground">
          QR Code: {value}
        </div>
      </CardContent>
    </Card>
  );
}
