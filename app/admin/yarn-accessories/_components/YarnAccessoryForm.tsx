"use client"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useActionState, useState } from "react"
import { addYarnAccessory, updateYarnAccessory } from "../../_actions/yarn-accessories"
import { YarnAccessory } from "@/app/generated/prisma"
import Image from "next/image"
import { Upload, X, Loader2 } from "lucide-react"

const ACCESSORY_CATEGORIES = [
  "Tools",
  "Accessories",
  "Amigurumi",
]

export function YarnAccessoryForm({
  accessory
}: {
  accessory?: YarnAccessory | null
}) {
  const [originalPrice, setOriginalPrice] = useState<number | undefined>(accessory?.originalPrice)
  const [discountedPrice, setDiscountedPrice] = useState<number | undefined>(accessory?.discountedPrice)
  const [state, action, isPending] = useActionState(
    accessory == null ? addYarnAccessory : updateYarnAccessory.bind(null, accessory.id),
    { message: " " }
  )

  const [imageUrl, setImageUrl] = useState(accessory?.imageUrl || "")
  const [uploading, setUploading] = useState(false)

  const fcurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount)
  }

  const uploadToGitHub = async (file: File) => {
    setUploading(true)
    try {
      const extension = file.name.split('.').pop()
      const filename = `${Date.now()}-yarn-accessory.${extension}`.toLowerCase()

      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onload = () => {
          const result = reader.result as string
          resolve(result.split(',')[1])
        }
        reader.readAsDataURL(file)
      })

      const response = await fetch('/api/upload-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename,
          content: base64,
          message: `Add yarn accessory image: ${filename}`
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Upload failed')
      }

      const { cdnUrl } = await response.json()
      setImageUrl(cdnUrl)
    } catch (error) {
      console.error('Upload failed:', error)
      alert(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setUploading(false)
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      alert('Image must be smaller than 2MB')
      return
    }

    uploadToGitHub(file)
  }

  const calculateDiscount = () => {
    if (originalPrice && discountedPrice && originalPrice > 0) {
      const discount = ((originalPrice - discountedPrice) / originalPrice) * 100
      return Math.round(discount)
    }
    return 0
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">
        {accessory ? 'Edit Yarn Accessory' : 'Add New Yarn Accessory'}
      </h1>

      <form action={action} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Accessory Name</Label>
              <Input
                type="text"
                id="name"
                name="name"
                required
                defaultValue={accessory?.name || ""}
                placeholder="e.g., Bamboo Knitting Needles Set"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input
                type="text"
                id="category"
                name="category"
                required
                defaultValue={accessory?.category || ""}
                list="categories"
                placeholder="Select or type a category"
              />
              <datalist id="categories">
                {ACCESSORY_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat} />
                ))}
              </datalist>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                name="description"
                required
                defaultValue={accessory?.description || ""}
                placeholder="Describe the accessory..."
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                rows={3}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="stock">Stock Quantity</Label>
              <Input
                type="number"
                id="stock"
                name="stock"
                min="0"
                required
                defaultValue={accessory?.stock?.toString() || ""}
                placeholder="e.g., 50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="isActive">Visibility</Label>
              <select
                id="isActive"
                name="isActive"
                required
                defaultValue={accessory?.isActive?.toString() || "true"}
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="true">Show on website</option>
                <option value="false">Hide from website</option>
              </select>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Accessory Image</h3>
          <div className="max-w-md">
            <Label>Product Image *</Label>
            <div className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
              {imageUrl ? (
                <div className="space-y-3">
                  <Image
                    src={imageUrl}
                    alt="Accessory image"
                    width={200}
                    height={200}
                    className="mx-auto rounded-lg object-cover shadow-md"
                    unoptimized
                  />
                  <div className="flex gap-2 justify-center">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setImageUrl("")}
                    >
                      <X className="w-4 h-4 mr-1" />
                      Remove
                    </Button>
                    <label className="cursor-pointer">
                      <Button type="button" variant="outline" size="sm" asChild>
                        <span>
                          <Upload className="w-4 h-4 mr-1" />
                          Replace
                        </span>
                      </Button>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={uploading}
                      />
                    </label>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <Upload className="w-12 h-12 mx-auto text-gray-400" />
                  <div>
                    <label className="cursor-pointer">
                      <span className="text-blue-600 hover:text-blue-500 font-medium">
                        Click to upload accessory image
                      </span>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={uploading}
                      />
                    </label>
                  </div>
                  <p className="text-sm text-gray-500">PNG, JPG up to 2MB</p>
                </div>
              )}
              {uploading && (
                <div className="flex items-center justify-center space-x-2 mt-4">
                  <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                  <span className="text-blue-600">Uploading to GitHub...</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Pricing</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="originalPrice">Original Price (₹)</Label>
              <Input
                type="number"
                id="originalPrice"
                name="originalPrice"
                required
                min="1"
                value={originalPrice ?? ""}
                onChange={(e) => setOriginalPrice(Number(e.target.value) || 0)}
                placeholder="e.g., 299"
              />
              <div className="text-sm text-muted-foreground">
                {fcurrency(originalPrice || 0)}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="discountedPrice">Discounted Price (₹)</Label>
              <Input
                type="number"
                id="discountedPrice"
                name="discountedPrice"
                required
                min="1"
                value={discountedPrice ?? ""}
                onChange={(e) => setDiscountedPrice(Number(e.target.value) || 0)}
                placeholder="Final selling price"
              />
              <div className="text-sm text-muted-foreground">
                {fcurrency(discountedPrice || 0)}
                {calculateDiscount() > 0 && (
                  <span className="text-green-600 ml-2">
                    ({calculateDiscount()}% off)
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <input type="hidden" name="imageUrl" value={imageUrl} />

        <div className="border-t pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              type="submit"
              disabled={isPending || uploading || !imageUrl}
              className="flex-1 sm:flex-none sm:min-w-[140px]"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                accessory ? 'Update Accessory' : 'Add Accessory'
              )}
            </Button>
            <Button type="button" variant="outline" className="flex-1 sm:flex-none">
              Cancel
            </Button>
          </div>

          {!imageUrl && (
            <p className="text-sm text-amber-600 mt-2 flex items-center">
              <Upload className="w-4 h-4 mr-1" />
              Product image is required before saving
            </p>
          )}

          {state.message && state.message !== " " && (
            <div className={`mt-4 p-3 rounded-md ${state.message === "" ? "bg-green-50 text-green-800 border border-green-200" : "bg-red-50 text-red-800 border border-red-200"
              }`}>
              {state.message === "" ? "✅ Accessory saved successfully!" : `❌ ${state.message}`}
            </div>
          )}
        </div>
      </form>
    </div>
  )
}
