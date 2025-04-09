"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Download, Share2 } from "lucide-react"
import Image from "next/image"

export default function QRCodePage() {
  const [showToast, setShowToast] = useState(false)

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "My Attendance QR Code",
          text: "Scan this QR code to mark my attendance",
          // In a real app, this would be a URL to the actual QR code
          url: window.location.href,
        })
      } catch (error) {
        console.error("Error sharing:", error)
      }
    } else {
      // Fallback for browsers that don't support the Web Share API
      setShowToast(true)
      setTimeout(() => setShowToast(false), 3000)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My QR Code</h1>
        <p className="text-muted-foreground">Use this QR code to mark your attendance at events.</p>
      </div>

      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Personal Attendance QR Code</CardTitle>
            <CardDescription>Present this QR code to the event organizer to mark your attendance</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <div className="border p-4 rounded-lg bg-white">
              <Image
                src="/placeholder.svg?height=250&width=250"
                alt="QR Code"
                width={250}
                height={250}
                className="mx-auto"
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Download
            </Button>
            <Button onClick={handleShare} className="flex items-center gap-2">
              <Share2 className="h-4 w-4" />
              Share
            </Button>
          </CardFooter>
        </Card>

        <div className="mt-6 space-y-4">
          <h3 className="text-lg font-medium">Instructions</h3>
          <ul className="space-y-2 list-disc pl-5">
            <li>Keep your QR code accessible on your phone</li>
            <li>Present it to the event organizer when requested</li>
            <li>Ensure your screen brightness is high enough for scanning</li>
            <li>Do not share your QR code with others</li>
          </ul>
        </div>
      </div>

      {showToast && (
        <div className="fixed bottom-4 right-4 bg-primary text-primary-foreground p-4 rounded-md shadow-lg animate-in fade-in slide-in-from-bottom-5">
          QR code link copied to clipboard!
        </div>
      )}
    </div>
  )
}
