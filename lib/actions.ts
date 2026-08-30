import { boolean, includes } from "zod/v4";
import prisma from "./prisma";
import { cookies } from 'next/headers'
import { User } from "@/app/generated/prisma";
import { ca } from "zod/v4/locales";

export async function getproduct(id:string){
const data = await prisma.product.findUnique({
    where:{id},
    include:{brand:true}
})

return data ;
}


export async function checkStock(productId: string, qty: number): Promise<boolean> {
  const product = await prisma.product.findUnique({ where: { id: productId } })
  return !!product && qty <= product.stock
}

export async function GetProductPrice(cartItems: string[]) {
  const products = await prisma.product.findMany({
    where: {
      id: {
        in: cartItems  
      }
    },
    select: {
      id: true,
      pname: true,
      originalPrice: true,
      discountedPrice: true,
      brand: {
        select: {
          name: true,
          discountRate: true
        }
      }
    }
  });

  return products;
}