import { YarnAccessoryForm } from "../_components/YarnAccessoryForm"
import { getYarnAccessoryById } from "../../_actions/yarn-accessories"
import { notFound } from "next/navigation"

export default async function EditYarnAccessoryPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params
  const accessory = await getYarnAccessoryById(id)

  if (!accessory) {
    notFound()
  }

  return <YarnAccessoryForm accessory={accessory} />
}
