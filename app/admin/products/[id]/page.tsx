import Header from "@/app/components/Header";
import { ProductForm } from "../_components/ProductForm";
import prisma from "@/lib/prisma";

export default async function NewProductPage({ params}: { params: Promise<{id:string}>}) {
 const {id} = await params
  const product = await prisma.product.findUnique({ where: { id }, })


  return (<><div className="mx-10">
    <Header>Edit {product?.pname} </Header>
    <ProductForm product={product} /></div>
  </>)
}
