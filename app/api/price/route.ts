import { NextRequest, NextResponse } from "next/server";

export async function POST(req:NextRequest){
    const data = await req.json()
    const {pincode} = data
    if(pincode < 560055){
        console.log(pincode)
        return NextResponse.json({charge:100},{status:200})
    }
        return NextResponse.json({charge:200},{status:200})
}

