"use client"

import { useEffect, useRef, useState } from "react"
import { BrowserMultiFormatReader, BarcodeFormat } from "@zxing/library"

export default function TestScannerPage() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [log, setLog] = useState<string[]>([])

  const addLog = (message: string) => {
    setLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`])
  }

  const startScanner = async () => {
    if (!videoRef.current) {
      addLog("Video element not found")
      return
    }

    try {
      addLog("Starting scanner...")
      setIsScanning(true)
      
      // Configure reader to only look for QR codes for better performance
      const hints = new Map()
      hints.set(BarcodeFormat.QR_CODE, true)
      
      const reader = new BrowserMultiFormatReader(hints)
      
      addLog("Initializing camera...")
      
      // Use simpler constraints focused just on getting the camera working
      await reader.decodeFromConstraints(
        {
          video: { facingMode: "environment" }
        },
        videoRef.current,
        (result, error) => {
          if (result) {
            const text = result.getText()
            addLog(`SUCCESS! Scanned QR code: ${text}`)
            setResult(text)
            // Don't stop scanning automatically
          }
          
          if (error) {
            // Don't log most errors as they happen constantly during scanning
            // Only log unexpected errors
            if (error.name !== "NotFoundException") {
              addLog(`Scanning error: ${error.message}`)
              setError(error.message)
            }
          }
        }
      )
      
      addLog("Scanner started successfully!")
    } catch (err) {
      addLog(`Failed to start scanner: ${err.message}`)
      setError(`Failed to start scanner: ${err.message}`)
      setIsScanning(false)
    }
  }

  const stopScanner = () => {
    setIsScanning(false)
    addLog("Scanner stopped")
    // Force page reload to ensure clean camera state
    window.location.reload()
  }

  return (
    <div className="max-w-md mx-auto p-4">
      <h1 className="text-xl font-bold mb-4">QR Scanner Test Page</h1>
      <p className="mb-4 text-sm">This is a minimal test page to verify basic QR code scanning functionality.</p>
      
      <div className="mb-4 border border-gray-300 rounded overflow-hidden relative">
        <video 
          ref={videoRef}
          className="w-full h-64 bg-black"
          style={{ display: isScanning ? 'block' : 'none' }}
        />
        
        {!isScanning && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <span className="text-gray-500">Camera inactive</span>
          </div>
        )}
        
        {result && (
          <div className="absolute top-2 right-2 bg-green-500 text-white px-3 py-1 rounded-full text-sm">
            Scanned!
          </div>
        )}
      </div>
      
      <div className="flex mb-4 gap-2">
        {!isScanning ? (
          <button 
            onClick={startScanner} 
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex-1"
          >
            Start Scanner
          </button>
        ) : (
          <button 
            onClick={stopScanner} 
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 flex-1"
          >
            Stop Scanner
          </button>
        )}
      </div>
      
      {result && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded">
          <div className="font-medium">Scanned QR Code:</div>
          <div className="text-sm break-all">{result}</div>
        </div>
      )}
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
          <div className="font-medium">Error:</div>
          <div className="text-sm">{error}</div>
        </div>
      )}
      
      <div className="border border-gray-200 rounded p-2">
        <div className="font-medium mb-1">Log:</div>
        <div className="text-xs h-32 overflow-y-auto bg-gray-50 p-2">
          {log.map((entry, i) => (
            <div key={i} className="mb-1">{entry}</div>
          ))}
          {log.length === 0 && <div className="text-gray-400">No logs yet</div>}
        </div>
      </div>
    </div>
  )
}
