import { notFound } from 'next/navigation'
import { BrandForm } from '../create-brands-form'
import { getBrandById } from '../../_actions/brands'

interface EditBrandPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function EditBrandPage({ params }: EditBrandPageProps) {
  const { id } = await params
  const result = await getBrandById(id)

  // Extract the brand data from the server action response
  if (!result.success || !result.data) {
    notFound()
  }

  const brand = result.data

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Edit Brand</h1>
        <BrandForm brand={brand} />
      </div>
    </div>
  )
}