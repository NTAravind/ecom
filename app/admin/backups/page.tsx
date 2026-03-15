import { BackupPanel } from "./_components/backup-panel"

export default function BackupsPage() {
  return (
    <div className="flex-1 w-full p-4 lg:p-8 relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center py-6 border-b border-gray-100">
        <div>
          <h1 className="text-2xl font-bold flex items-center space-x-2">Database Backups</h1>
          <p className="mt-2 text-sm text-gray-500">
            Generate and download complete snapshots of your current e-commerce database.
          </p>
        </div>
      </div>

      <div className="pt-8">
        <BackupPanel />
      </div>
    </div>
  )
}
