
import { CartItem } from "@/app/store/store";
import { error } from "console";
import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";

const razorpay = new Razorpay({
key_id : process.env.RAZORPAY_KEY_ID ,
key_secret: process.env.RAZORPAY_KEY_SECRET ,
})
export async function POST(req:NextRequest){
    const body = await req.json();
    const {phoneno,cartitems,pincode} = body

   const amount =  cartitems.reduce((total : number, cartItem : CartItem) => {
          return total + (cartItem.item.price * cartItem.qty);
        }, 0);
    const cha = await fetch(`${process.env.NEXT_PUBLIC_BASEURL}/api/price`,{method:"POST",body:JSON.stringify({pincode:pincode}), headers: {
    "Content-Type": "application/json"
},})

const { charge } = await cha.json();
try{
    const order = await razorpay.orders.create({
        amount : (amount + charge) * 100,
        currency: "INR",
        receipt: "reciept_For" + phoneno + Math.random().toString(),
});
return NextResponse.json({orderId:order.id , amount:amount},{status:200})
}catch(err){console.log(err); return NextResponse.json({error:"error in payment"},{status:500})}
}


