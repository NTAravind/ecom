"use client"

import { ChangeEvent, useState } from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Database, Download, CheckCircle2, AlertCircle, FileUp, Loader2 } from "lucide-react"

export function BackupPanel() {
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState<"idle" | "running" | "success" | "error">("idle")
  const [lastBackup, setLastBackup] = useState<string | null>(null)
  const [restoreFile, setRestoreFile] = useState<File | null>(null)
  const [restoreStatus, setRestoreStatus] = useState<"idle" | "running" | "success" | "error">("idle")
  const [restoreMessage, setRestoreMessage] = useState<string | null>(null)
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false)

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

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null
    setRestoreFile(file)
    setRestoreStatus("idle")
    setRestoreMessage(null)
  }

  const handleRestore = async () => {
    if (!restoreFile) return

    setShowRestoreConfirm(false)
    setRestoreStatus("running")
    setRestoreMessage(null)

    try {
      const fileContents = await restoreFile.text()
      const backup = JSON.parse(fileContents)
      const response = await fetch("/api/admin/backup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(backup),
      })
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to restore backup")
      }

      const total = Object.values(result.restored as Record<string, number>).reduce<number>(
        (sum, count) => sum + count,
        0
      )
      setRestoreStatus("success")
      setRestoreMessage(`Restored ${total} records from ${restoreFile.name}.`)
    } catch (error) {
      setRestoreStatus("error")
      setRestoreMessage(error instanceof Error ? error.message : "Failed to read or restore the backup file.")
    }
  }

  return (
    <div className="w-full max-w-2xl mt-6 space-y-6">
    <Card className="border-purple-100 shadow-md">
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

    <Card className="border-amber-100 shadow-md">
      <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100 rounded-t-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-white rounded-lg shadow-sm">
            <FileUp className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <CardTitle className="text-xl text-gray-800">Restore Database</CardTitle>
            <CardDescription className="text-gray-600 mt-1">
              Choose a JSON file created by the backup tool to seed its records into the database.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-6 space-y-4">
        <label className="block">
          <span className="sr-only">Choose a database backup JSON file</span>
          <input
            type="file"
            accept="application/json,.json"
            onChange={handleFileChange}
            disabled={restoreStatus === "running"}
            className="block w-full text-sm text-gray-600 file:mr-4 file:rounded-md file:border-0 file:bg-amber-100 file:px-4 file:py-2 file:text-sm file:font-medium file:text-amber-800 hover:file:bg-amber-200 disabled:opacity-60"
          />
        </label>
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Restore adds or updates matching backup records in dependency order. It does not delete records that are not in the selected backup.
        </div>
        {restoreMessage && (
          <div className={`flex items-start gap-2 rounded-lg border p-3 text-sm ${restoreStatus === "error" ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>
            {restoreStatus === "error" ? <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> : <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />}
            <span>{restoreMessage}</span>
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-2 pb-6 justify-end">
        <Button
          onClick={() => setShowRestoreConfirm(true)}
          disabled={!restoreFile || restoreStatus === "running"}
          className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700 text-white"
        >
          {restoreStatus === "running" ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Restoring...</> : <><FileUp className="mr-2 h-4 w-4" /> Restore JSON Backup</>}
        </Button>
      </CardFooter>
    </Card>

    <AlertDialog open={showRestoreConfirm} onOpenChange={setShowRestoreConfirm}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Restore this backup?</AlertDialogTitle>
          <AlertDialogDescription>
            {restoreFile ? `This will add or update data from ${restoreFile.name}.` : "This will add or update data from the selected backup."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={restoreStatus === "running"}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleRestore} className="bg-amber-600 hover:bg-amber-700">Restore data</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </div>
  )
}
