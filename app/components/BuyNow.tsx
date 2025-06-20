import { Button } from "@/components/ui/button";
import { Product } from "../generated/prisma";

export default function BuyButton({props}:{props:{thing:Product,qty:number}}){
   
    return(
        <>
       <Button onClick={()=>{console.log(`product : ${props.thing.pname} quantity:${props.qty}`)}}>Buy Now</Button>
        </>
    )
}