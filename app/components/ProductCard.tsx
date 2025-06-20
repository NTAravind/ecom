
import Link from "next/link";
import { Product } from "../generated/prisma";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { fcurrency } from "@/utils/utils";
import { Ghost, ShoppingBagIcon } from "lucide-react";

export function ProductCard({ product }: { product: Product }) {
return (
  <>
  <div className="border-solid border-2 p-4 rounded-sm  w-50">
    <Image src={product.irul} height={150} width={150} className=" scale-110 mb-4"  alt={product.pname} unoptimized/>
   <Link href={`/products/${product.id}`} > <h1 className="mb-2">{`${product.pname} , ${product.category} ${product.y_weight}`} </h1>
   <div className="flex justify-between">
    <h2 className="text-yellow-600">{fcurrency(product.price)}</h2>
    <Button variant="ghost" className="border-2 border-sm border-black rounded-full"><ShoppingBagIcon></ShoppingBagIcon></Button>
   </div>
</Link>
  </div>
  </>
);

}
