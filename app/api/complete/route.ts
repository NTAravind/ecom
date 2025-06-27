// app/api/orders/complete/route.ts
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { id ,phone } = await request.json()
    
    if (!id) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      )
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { complete: true }
    })
    SendWhatsappmsg(updatedOrder.userId,updatedOrder.id)
    return NextResponse.json(updatedOrder)
  } catch (error) {
    console.error('Error updating order:', error)
    return NextResponse.json(
      { error: 'Failed to update order' },
      { status: 500 }
    )
  }
}

async function SendWhatsappmsg(phone:string,orderid:string){
 const whatsappResponse = await fetch(
      `https://graph.facebook.com/v22.0/${process.env.WHATSAPPPHONE}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPPENV}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: `91${phone}`,
          type: 'template',
          template: {
            name: 'tracking',
            language: { code: 'en' },
            components: [
              {
                type: 'body',
                parameters: [{ type: 'text', text: orderid }],
              },
       ],
          },
        }),
      }
    )

}
