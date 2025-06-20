import Header from "@/app/components/Header";
import { DataTable } from "../components/DataTable";
import {columns } from "./column"
import prisma from "@/lib/prisma";
export default  async function Order(){
 const orders = await prisma.order.findMany({
    include: { user: true },
    orderBy: { createdAt: "desc" },
  });

  return (

    <div className="p-4">

      <h1 className="text-2xl font-bold mb-4">Orders</h1>
      <DataTable columns={columns} data={orders} />
      {JSON.stringify(orders)}
    </div>
  )
}