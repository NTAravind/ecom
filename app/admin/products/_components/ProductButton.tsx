import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { useTransition } from "react";
import { deleteproduct, ToggleAvailability } from "../../_actions/products";

export function Available({ id, isavail }: { id: string, isavail: boolean }) {
  const [ispending, startTransition] = useTransition();
  return (
    <DropdownMenuItem onClick={() => {
      startTransition(async () => await ToggleAvailability(id, isavail))

    }} disabled={ispending}>

      {isavail ?
        "UnAvailable" : "Available"} </DropdownMenuItem>
  )
}

export function DelButton({ id }: { id: string }) {
  const [ispending, startTransition] = useTransition();

  return (
    <DropdownMenuItem onClick={() => {
      startTransition(async () => await deleteproduct(id))
    }} disabled={ispending} >Delete</DropdownMenuItem>
  )
}
