import Header from "@/app/components/Header";
import { OrdersDataTable } from "./Datatable";
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
      <OrdersDataTable columns={columns} data={orders} />
      
    </div>
  )
}