import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import prisma from "@/lib/prisma"
import { fcurrency, fnumber } from "@/utils/utils"
async function getSalesData() {
  const data = await prisma.order.aggregate({
    _sum: { pricepaid: true },
    _count: true
  })

  return {
    amount: (data._sum.pricepaid || 0) / 100,
    numberofSales: data._count
  }
}

async function getUserData() {
  const [userData, priceavg] = await Promise.all([
    prisma.user.count(),
    prisma.order.aggregate(
      { _sum: { pricepaid: true } }),
  ])

  return {
    userData,
    avgValuePerUser: userData === 0 ? 0 : (priceavg._sum.pricepaid || 0) / userData
  }
}

async function GetProductsData() {
  const [activeps, inactiveps] = await Promise.all([
    prisma.product.count({ where: { Shown: true } }),
    prisma.product.count({ where: { Shown: false } }),
  ])

  return {
    activeps, inactiveps
  }
}
export default async function admin() {
  const [saledata, userdata, producdata] = await Promise.all([
    getSalesData(),
    getUserData(),
    GetProductsData(),
  ])
  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mx-4 my-4">
        <DashCard
          title="Sales"
          info={`${fnumber(saledata.numberofSales)} Orders`}
          body={fcurrency(saledata.amount)} />


        <DashCard
          title="Customers"
          info={`${fcurrency(userdata.avgValuePerUser)} Average Value`}
          body={fnumber(userdata.userData)} />

        <DashCard
          title="Products"
          info={fnumber(producdata.inactiveps)}
          body={fnumber(producdata.activeps)} />


      </div>
    </>
  )
}



type dashboardcard = {
  title: string
  info: string
  body: string
}
function DashCard({ title, info, body }: dashboardcard) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{info}</CardDescription>
      </CardHeader>
      <CardContent>
        <p>{body}</p>
      </CardContent>
    </Card>
  )
}
