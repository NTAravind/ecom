'use client'
import { useState } from 'react'
import { Button } from "@/components/ui/button"

interface MarkToCompleteProps {
  prop: {
    id: string
  }
}

export default function MarkToComplete({ prop }: MarkToCompleteProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)
  const [hasFailed, setHasFailed] = useState(false)

  const handleMarkComplete = async () => {
    setIsLoading(true)
    setHasFailed(false)
    try {
      await markAsComplete(prop.id)
      setIsCompleted(true)
    } catch (error) {
      console.error('Failed to mark as complete:', error)
      setHasFailed(true)
      // Reset failed state after 3 seconds to allow retry
      setTimeout(() => setHasFailed(false), 3000)
    } finally {
      setIsLoading(false)
    }
  }

  const getButtonVariant = () => {
    if (isCompleted) return "secondary"
    if (hasFailed) return "destructive"
    return "default"
  }

  const getButtonText = () => {
    if (isLoading) return "Marking..."
    if (isCompleted) return "✓ Completed"
    if (hasFailed) return "✗ Failed - Retry"
    return "Mark To Complete"
  }

  return (
    <>
      <Button 
        onClick={handleMarkComplete}
        disabled={isLoading || isCompleted}
        variant={getButtonVariant()}
      >
        {getButtonText()}
      </Button>
    </>
  )
}

async function markAsComplete(id: string) {
  try {
    const response = await fetch('/api/complete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id }),
    })
    
    if (!response.ok) {
      throw new Error('Failed to mark order as complete')
    }
    
    // Optionally handle success (e.g., show toast, refresh data)
    console.log('Order marked as complete')
  } catch (error) {
    console.error('Error marking order as complete:', error)
  }
}