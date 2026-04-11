import Header from "@/app/components/Header";
import { Button } from "@/components/ui/button";
import { Table, TableCaption, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { DataTable } from "../components/DataTable";
import { columns } from "../components/column";
import { ProductsTable } from "../_actions/products";



type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>

export default async function AdminProducts(props: { searchParams: SearchParams }) {
  const searchParams = await props.searchParams
  const data = await ProductsTable(searchParams)
  
  const brands = await prisma.brand.findMany({ select: { id: true, name: true } })
  const categories = (await prisma.product.findMany({
    select: { category: true },
    distinct: ['category'],
  })).map(p => p.category).filter(Boolean)
  const colors = (await prisma.product.findMany({
    select: { color: true },
    distinct: ['color'],
  })).map(p => p.color).filter(Boolean)

  return (
    <>
      <div className="mx-5 lg:mx-5 my-3 ">
        <div className="flex justify-between gap-4 items-center">
          <Header>Products</Header>
          <Button asChild>
            <Link href="/admin/products/new">Add</Link>
          </Button>
        </div><div className="lg:my-5  my-4 min-w-full">
          <DataTable 
            columns={columns} 
            data={data} 
            brands={brands}
            categories={categories}
            colors={colors}
          />
        </div>
      </div>
    </>
  )
}


