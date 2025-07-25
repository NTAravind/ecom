import { BrandForm } from "../create-brands-form"
export default function CreateBrand(){
    return(
        <>
            <div className="container mx-auto py-8">
              <div className="max-w-2xl mx-auto">
                <h1 className="text-3xl font-bold mb-8">Create  Brand</h1>
                <BrandForm />
              </div>
            </div>
        </>
    )
}