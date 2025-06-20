"use client"

import { signIn } from "next-auth/react"
import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import OTPButton from "./otpbutton"

export function  SignIn() {
  const [phone, setPhone] = useState("")

  const credentialsAction = async (formData: FormData) => {
    const phone = formData.get("phone") as string
    const otp = formData.get("otp") as string
    await signIn("credentials", {
      phone,
      otp,
      redirect: true,
      callbackUrl: "/checkout",
    })
  }

  return (
    <Card className="w-full max-w-md mx-auto mt-10 p-6">
      <CardContent>
        <form action={credentialsAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="credentials-phone">Phone Number</Label>
            <Input
              type="tel"
              id="credentials-phone"
              name="phone"
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Enter your phone number"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="credentials-otp">OTP</Label>
            <Input
              type="text"
              id="credentials-otp"
              name="otp"
              placeholder="Enter OTP"
              required
            />
          </div>

          <div className="flex items-center justify-between gap-2">
            <OTPButton phone={phone} />
            <Button type="submit">Sign In</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
