'use client'
import { useState } from 'react'
import { Button } from "@/components/ui/button"

export default function OTPButton({ phone }: { phone: string }) {
      const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const sendOTP = async () => {
    setLoading(true)
    setSuccess(false)
    setError('')

    const response = await fetch('/api/send-otp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ phone }),
    })

    const data = await response.json()

    if (response.ok) {
      setSuccess(true)
    } else {
      setError(data.error || 'Failed to send OTP')
    }

    setLoading(false)
  }
return(
    <>
    <Button onClick={sendOTP} disabled={loading || success} className="w-full">
      {loading ? 'Sending...' : success ? 'OTP Sent' : 'Send OTP'}
    </Button>
    {error && <p className="text-red-500 mt-2">{error}</p>}
    {success && <p className="text-green-500 mt-2">OTP sent successfully!</p>}
    {loading && <p className="text-blue-500 mt-2">Sending OTP...</p>}
    </>
)
}