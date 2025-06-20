import { NextResponse } from 'next/server'
import { saveOtp } from '../../../lib/otpstore'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { phone } = body

    if (!phone) {
      return NextResponse.json(
        { success: false, error: 'Phone number is required' },
        { status: 400 }
      )
    }

    const phoneRegex = /^[6-9]\d{9}$/
    if (!phoneRegex.test(phone)) {
      return NextResponse.json(
        { success: false, error: 'Invalid phone number format' },
        { status: 400 }
      )
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString()

    saveOtp(phone, code) // <-- use shared memory store

    const whatsappResponse = await fetch(
      `https://graph.facebook.com/v22.0/725053144013610/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: 'Bearer EAAOZCHki4cpcBOxfWEI7SyUl638RR2g7GSmNJUivaZAiEUSBZBKFUUfh6HFEPqj4W0X5pSWzhS3lISm6Uhx6NZBla9ybsgNRMwc37mZBcKQ2kgX84ocZC6oL6kzELczwoUNOxSZCI8c90BlVsgN6dCNZA2Q3KNaubZAsNYHedFDLYEoNLii4bUWBLtcybVmXeZAQqs4iSiRQxWr0ZBSBFqHBsYXgRwbuFr7L3jnfZB0ZD',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: `91${phone}`,
          type: 'template',
          template: {
            name: 'auth_custom',
            language: { code: 'en' },
            components: [
              {
                type: 'body',
                parameters: [{ type: 'text', text: code }],
              },
              {
                type: 'button',
                sub_type: 'copy_code',
                index: 0,
                parameters: [{ type: 'coupon_code', coupon_code: code }],
              },
            ],
          },
        }),
      }
    )

    if (!whatsappResponse.ok) {
      const errorData = await whatsappResponse.text()
      console.error('WhatsApp API error:', errorData)
      return NextResponse.json(
        { success: false, error: 'Failed to send OTP' },
        { status: 500 }
      )
    }

    const whatsappData = await whatsappResponse.json()
    console.log('OTP sent successfully:', whatsappData,code)

    return NextResponse.json({
      success: true,
      message: 'OTP sent successfully',
    })
  } catch (error) {
    console.error('Error in OTP API:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
