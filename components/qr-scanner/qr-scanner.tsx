"use client";

import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader, BarcodeFormat, Exception, Result } from "@zxing/library";
import { Button } from "@/components/ui/button";
import { QrCode, Camera, CheckCircle } from "lucide-react";

interface QRScannerProps {
  onScanSuccess: (result: string) => void;
  onScanError?: (error: Error) => void;
  isScanning: boolean;
  onToggleScanning: (scanning: boolean) => void;
  scanSuccess?: boolean;
}

export function QRScanner({
  onScanSuccess,
  onScanError,
  isScanning,
  onToggleScanning,
  scanSuccess = false,
}: QRScannerProps) {
  // Add a ref to track if a scan is already being processed
  // This will prevent multiple scans within a very short timeframe
  const processingRef = useRef<boolean>(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [recentScan, setRecentScan] = useState<string | null>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);

  // Set up the QR code reader when component mounts
  useEffect(() => {
    // Configure reader to only look for QR codes for better performance
    const hints = new Map();
    hints.set(BarcodeFormat.QR_CODE, true);
    
    // Initialize with options for better QR code detection
    // The second parameter should be a number for delayBetweenScanAttempts
    const reader = new BrowserMultiFormatReader(hints, 100);
    
    readerRef.current = reader;
    
    // Clean up when the component unmounts
    return () => {
      if (readerRef.current) {
        readerRef.current.reset();
      }
    };
  }, []);

  // Start or stop the scanner based on isScanning state
  useEffect(() => {
    if (isScanning) {
      startScanner();
    } else if (readerRef.current) {
      readerRef.current.reset();
    }
    
    return () => {
      if (readerRef.current) {
        readerRef.current.reset();
      }
    };
  }, [isScanning]);
  
  // If we detect a scan, clear it after a few seconds (for UI feedback)
  useEffect(() => {
    if (recentScan) {
      const timer = setTimeout(() => {
        setRecentScan(null);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [recentScan]);

  // Start the scanner - simplified implementation
  const startScanner = async () => {
    if (!readerRef.current || !videoRef.current) return;
    
    try {
      console.log('Starting QR scanner...');
      setError(null);
      
      await readerRef.current.decodeFromConstraints(
        { 
          video: { 
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 }
          } 
        },
        videoRef.current,
        (result, error) => {
          if (result) {
            // CRITICAL: Prevent multiple callbacks for the same scan
            // This ensures each physical scan only triggers one callback
            if (processingRef.current) {
              console.log('Already processing a scan, ignoring this one');
              return;
            }
            
            // Set processing flag
            processingRef.current = true;
            
            const text = result.getText();
            console.log('✅ QR CODE SCANNED:', text);
            setRecentScan(text);
            
            // Process the scan
            onScanSuccess(text);
            
            // Short delay to prevent multiple rapid scans of the same code
            setTimeout(() => {
              processingRef.current = false;
              // Resume scanning if still active
              // In newer versions of @zxing/library, there's no need to manually restart scanning
              // The library will continue to scan as long as the decoder is active
              // and the video stream is running
            }, 1500);
          }
          
          if (error && !(error instanceof Exception)) {
            console.error('Scanning error:', error);
            // Safely access message property with type checking
            const errorMessage = error instanceof Error ? error.message : String(error);
            setError(errorMessage);
            if (onScanError && error instanceof Error) {
              onScanError(error);
            }
          }
        }
      );
    } catch (err) {
      console.error('Failed to start scanner:', err);
      // Safely access message property with type checking
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError('Camera access error: ' + errorMessage);
      onToggleScanning(false);
      if (onScanError && err instanceof Error) {
        onScanError(err);
      }
    }
  };



  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      {error && (
        <div className="text-red-500 bg-red-50 p-3 rounded-md mb-4 text-sm">
          {error}
        </div>
      )}

      <div className={`relative w-64 h-64 mx-auto rounded-lg overflow-hidden ${scanSuccess ? 'border-4 border-green-500' : 'border-4 border-primary'}`}>
        {isScanning && (
          <>
            <video
              ref={videoRef}
              className="absolute inset-0 w-full h-full object-cover"
              muted
              playsInline // Important for iOS
              autoPlay
            />
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-primary animate-pulse"></div>
          </>
        )}
        
        {!isScanning && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
            <QrCode className="h-32 w-32 text-primary/20" />
          </div>
        )}
        
        {/* Show recent scan indicator */}
        {recentScan && (
          <div className="absolute bottom-2 left-0 right-0 flex justify-center">
            <div className="bg-green-500 text-white px-3 py-1 rounded-full text-sm flex items-center gap-1 animate-pulse">
              <CheckCircle className="h-4 w-4" />
              <span>QR Code Scanned</span>
            </div>
          </div>
        )}
        
        {/* Green overlay when scanSuccess is true */}
        {scanSuccess && (
          <div className="absolute inset-0 bg-green-500 bg-opacity-20"></div>
        )}
      </div>

      <div className="flex flex-col gap-2 w-full max-w-xs">
        <Button
          onClick={() => onToggleScanning(!isScanning)}
          variant={isScanning ? "destructive" : "default"}
          className="w-full"
        >
          {isScanning ? "Stop Scanner" : "Start Scanner"}
        </Button>
      </div>
      
      <div className="text-xs text-muted-foreground text-center max-w-xs">
        Position the QR code within the scanner frame. Make sure the code is well-lit and clearly visible.
      </div>
    </div>
  );
}
