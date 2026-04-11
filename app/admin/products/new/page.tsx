import Header from "@/app/components/Header";
import { ProductForm } from "../_components/ProductForm";
import prisma from "@/lib/prisma";

export default  async function NewProductPage() {
  const Brands = await prisma.brand.findMany({})
  return (<><div className="mx-10">
    <Header>Add New Product</Header>
    <ProductForm product={null} brands={Brands} /></div>
  </>)
}
