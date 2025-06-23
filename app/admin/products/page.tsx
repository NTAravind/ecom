import Header from "@/app/components/Header";
import { Button } from "@/components/ui/button";
import { Table, TableCaption, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { DataTable } from "../components/DataTable";
import { columns, products } from "../components/column";
import { ProductsTable } from "../_actions/products";



export default async function AdminProducts() {
  const data = await ProductsTable()
  return (
    <>
      <div className="mx-5 lg:mx-5 my-3 ">
        <div className="flex justify-between gap-4 items-center">
          <Header>Products</Header>
          <Button asChild>
            <Link href="/admin/products/new">Add</Link>
          </Button>
        </div><div className="lg:my-5  my-4 min-w-full">
          <DataTable columns={columns} data={data} />
        </div>
      </div>
    </>
  )
}


