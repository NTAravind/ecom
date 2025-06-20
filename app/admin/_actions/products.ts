
"use server"

import prisma from "@/lib/prisma"
import { redirect } from "next/navigation"
import z from "zod/v4"
import { products } from "../components/column"
import { revalidatePath } from "next/cache"

const formdat = z.object({
  name: z.string().min(1),
  brand: z.string().min(1),
  url: z.string().min(1),
  price: z.coerce.number().int().min(1),
  category: z.string().min(1),
  stock: z.coerce.number().int().min(1),
  color: z.string().min(1),
  url2: z.string().min(1),
  weight:z.string().min(1),
  desc : z.string().min(1),
  gweight: z.coerce.number().int().min(100),
})

export async function addProduct(prevState: unknown, formdata: FormData) {
  const res = formdat.safeParse(Object.fromEntries(formdata.entries()))

  if (res.success === false) {
    return { message: res.error.message }
  }

  const data = res.data

  await prisma.product.create({
    data: {
      pname: data.name, 
      desc: data.desc,
      brand: data.brand,
      category: data.category,
      irul: data.url,
      price: data.price,
      stock: data.stock,
      color: data.color,
      iurl1: data.url2,
      y_weight:data.weight,
      weight_g:data.gweight,
    }
  })

  redirect("/admin/products")
}

export async function ProductsTable() {
  const products = await prisma.product.findMany()
  return products;
}

export async function deleteproduct(id: string) {
  await prisma.product.delete({
    where: { id: id }
  })
  revalidatePath('/admin/products')
}

export async function ToggleAvailability(id: string, isavail: boolean) {
  await prisma.product.update({
    where: { id: id },
    data: { Shown: !isavail },
  })
  revalidatePath('/admin/products')
}


export async function updateproduct(id: string, prevState: unknown, formdata: FormData) {
  const res = formdat.safeParse(Object.fromEntries(formdata.entries()))

  if (res.success === false) {
    return { message: res.error.message }
  }

  const data = res.data
  await prisma.product.update({
    where: { id },
    data: {
      pname: data.name, 
      desc: data.desc,
      brand: data.brand,
      category: data.category,
      irul: data.url,
      price: data.price,
      stock: data.stock,
      color: data.color,
      iurl1: data.url2,
      y_weight:data.weight,
      weight_g:data.gweight,
    }
  })

  redirect("/admin/products")
}


