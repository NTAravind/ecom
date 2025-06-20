
"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { fcurrency } from "@/utils/utils"
import { useActionState, useState } from "react"
import { addProduct, updateproduct } from "../../_actions/products"
import { Button } from "@/components/ui/button"
import { Product } from "@/app/generated/prisma"
import Image from "next/image"

export function ProductForm({ product }: { product?: Product | null }) {
  const [price, setPrice] = useState<number | undefined>(product?.price)
  const [state, action, isPending] = useActionState(product == null ? addProduct : updateproduct.bind(null, product.id), { message: " " })

  return (
    <form action={action} className="space-y-8">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input type="text" id="name" name="name" required defaultValue={product?.pname || ""} />
      </div>
<div className="space-y-2">
  <Label htmlFor="weight">Weight</Label><Input type="number" id="gweight" name="gweight" required/>
        <div className="text-muted-foreground">in grams</div>
  </div>
      <div className="space-y-2">
        <Label htmlFor="url">Image URL</Label>
        <Input type="text" name="url" id="url" required defaultValue={product?.irul || ""} />
        {product?.irul && (
          <Image src={product.irul} alt="Product Image" height={300} width={300} unoptimized />
        )}
      </div>
<div className="space-y-2">
  <Label htmlFor="url2">Image url 2</Label>
    <Input type="text" name="url2" id="url2"  required defaultValue={product?.iurl1 || ""} />
        {product?.iurl1 && (
          <Image src={product.iurl1} alt="Product Image" height={300} width={300} unoptimized />
        )}
</div>
<div className="spacy-y-2">
  <Label htmlFor="desc">Description</Label>
  <Input type="text-area" name="desc" id="desc" required defaultValue={product?.desc || " "}/>
  
</div>
      <div className="flex gap-4">
        <div className="space-y-2">
          <Label htmlFor="brand">Brand</Label>
          <Input type="text" id="brand" name="brand" required defaultValue={product?.brand || ""} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Fiber Content</Label>
          <Select name="category" required defaultValue={product?.category || ""}>
            <SelectTrigger className="w-[300px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
            <SelectItem value="acrylic">Acrylic - 100%</SelectItem>
  <SelectItem value="acrylic-blend">Acrylic Blend</SelectItem>
  <SelectItem value="bamboo-blend">Bamboo Blend</SelectItem>
  <SelectItem value="cotton">Cotton - 100%</SelectItem>
  <SelectItem value="cotton-blend">Cotton Blend</SelectItem>
  <SelectItem value="mohair-wool-blend">Mohair Wool Blend</SelectItem>
  <SelectItem value="polyester">Polyester - 100%</SelectItem>
  <SelectItem value="wool">Wool - 100%</SelectItem>
  <SelectItem value="wool-blend">Wool Blend</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <label htmlFor="weight">Yarn Weight</label>
               <Select name="weight" required defaultValue={product?.y_weight || ""}>
            <SelectTrigger className="w-[300px]">
              <SelectValue placeholder="weight" />
            </SelectTrigger>
            <SelectContent>
             <SelectItem value="super-fine">Weight 1 – Super Fine </SelectItem>
  <SelectItem value="fine">Weight 2 – Fine </SelectItem>
  <SelectItem value="light-dk">Weight 3 – Light / DK</SelectItem>
  <SelectItem value="medium">Weight 4 – Medium </SelectItem>
  <SelectItem value="bulky">Weight 5 – Bulky </SelectItem>
  <SelectItem value="super-bulky">Weight 6 – Super Bulky</SelectItem>
  <SelectItem value="jumbo">Weight 7 – Jumbo</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="price">Price</Label>
          <Input
            type="number"
            id="price"
            name="price"
            required
            value={price ?? ""}
            onChange={(e) => setPrice(Number(e.target.value) || 0)}
          />
          <div className="text-muted-foreground">{fcurrency(price || 0)}</div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="stock">Stock</Label>
          <Input type="number" id="stock" name="stock" min="0" required defaultValue={product?.stock?.toString() || ""} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="color">Color Code</Label>
        <Input type="color" id="color" name="color" required defaultValue={product?.color || "#ffffff"} />
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending ? "Saving..." : "Save"}
      </Button>
          {(state.message =="") ? "succesfull" : `${state.message}`}
    </form>

  )
}
