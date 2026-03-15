"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Database, Download, CheckCircle2, AlertCircle } from "lucide-react"

export function BackupPanel() {
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState<"idle" | "running" | "success" | "error">("idle")
  const [lastBackup, setLastBackup] = useState<string | null>(null)

  const handleBackup = async () => {
    setStatus("running")
    setProgress(0)
    
    // Simulate initial loading feedback
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval)
          return 90
        }
        return prev + 10
      })
    }, 300)

    try {
      const response = await fetch('/api/admin/backup')
      
      if (!response.ok) {
        throw new Error('Failed to generate backup')
      }

      // Finish progress simulation
      clearInterval(interval)
      setProgress(100)
      setStatus("success")
      setLastBackup(new Date().toLocaleString())

      // Trigger file download
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const contentDisposition = response.headers.get('Content-Disposition')
      
      let filename = `database-backup-${new Date().toISOString().slice(0, 10)}.json`
      if (contentDisposition) {
        const matches = /filename="([^"]+)"/.exec(contentDisposition)
        if (matches != null && matches[1]) filename = matches[1]
      }

      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
    } catch (error) {
      clearInterval(interval)
      setStatus("error")
      console.error(error)
    }
  }

  return (
    <Card className="w-full max-w-2xl mt-6 border-purple-100 shadow-md">
      <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50 border-b border-purple-100 pb-6 rounded-t-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-white rounded-lg shadow-sm">
            <Database className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <CardTitle className="text-xl text-gray-800">Database Export & Seed</CardTitle>
            <CardDescription className="text-gray-600 mt-1">
              Download a complete JSON snapshot of all records for data seeding.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-6 pb-2 space-y-6">
        {status === "idle" && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex items-start gap-3">
             <AlertCircle className="w-5 h-5 text-gray-500 mt-0.5" />
             <div className="text-sm text-gray-600 leading-relaxed">
               Clicking the button below will immediately package your Products, Yarn Accessories, Brands, Users, and Order tables into a downloadable `.json` structure matching your Prisma schema snapshot requirements.
             </div>
          </div>
        )}

        {(status === "running" || status === "success" || status === "error") && (
          <div className="space-y-3">
            <div className="flex justify-between text-sm font-medium mb-1">
              <span className={status === "error" ? "text-red-600" : "text-purple-600"}>
                {status === "running" ? "Aggregating database clusters..." : 
                 status === "success" ? "Backup completed successfully!" : 
                 "Error generating backup file."}
              </span>
              <span className={status === "error" ? "text-red-600" : "text-purple-600"}>
                {progress}%
              </span>
            </div>
            <Progress 
              value={progress} 
              className={`h-2 ${status === "error" ? "bg-red-100 [&>div]:bg-red-600" : "[&>div]:bg-purple-600"}`} 
            />
          </div>
        )}
      </CardContent>
      
      <CardFooter className="pt-2 pb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-sm text-gray-500 w-full sm:w-auto">
          {lastBackup ? (
            <span className="flex items-center gap-1.5 font-medium text-emerald-600">
              <CheckCircle2 className="w-4 h-4" /> Last run: {lastBackup}
            </span>
          ) : (
            <span>No localized backup performed this session.</span>
          )}
        </div>
        
        <Button 
          onClick={handleBackup} 
          disabled={status === "running"}
          className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white font-medium"
        >
          {status === "running" ? (
            <>
              <Database className="w-4 h-4 mr-2 animate-pulse" />
              Processing...
            </>
          ) : status === "success" ? (
            <>
              <Download className="w-4 h-4 mr-2" />
              Download Again
            </>
          ) : (
            <>
              <Download className="w-4 h-4 mr-2" />
              Generate JSON Backup
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
