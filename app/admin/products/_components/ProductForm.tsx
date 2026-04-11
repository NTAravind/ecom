"use client"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { useActionState, useState, useEffect } from "react"
import { addProduct, updateproduct } from "../../_actions/products"
import { Product, Brand } from "@/app/generated/prisma"
import Image from "next/image"
import { Upload, X, Loader2, Info } from "lucide-react"

export function ProductForm({ 
  product, 
  brands 
}: { 
  product?: Product | null
  brands: Brand[]
}) {
  const [originalPrice, setOriginalPrice] = useState<number | undefined>(product?.originalPrice)
  const [selectedBrandId, setSelectedBrandId] = useState<string>(product?.brandId || "")
  const [discountedPrice, setDiscountedPrice] = useState<number | undefined>(product?.discountedPrice)
  const [state, action, isPending] = useActionState(
    product == null ? addProduct : updateproduct.bind(null, product.id), 
    { message: " " }
  )

  // Image upload state - only primary image now
  const [imageUrl1, setImageUrl1] = useState(product?.irul || "")
  const [uploading1, setUploading1] = useState(false)

  // Get selected brand details
  const selectedBrand = brands.find(brand => brand.id === selectedBrandId)
  const discountRate = selectedBrand?.discountRate || 0

  // Calculate discounted price when original price or brand changes
  useEffect(() => {
    if (originalPrice && selectedBrand) {
      const discount = (originalPrice * discountRate) / 100
      const calculated = originalPrice - discount
      setDiscountedPrice(Math.round(calculated))
    }
  }, [originalPrice, discountRate, selectedBrand])

  const fcurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount)
  }

  // Upload image to GitHub via API
  const uploadToGitHub = async (file: File) => {
    setUploading1(true)
    try {
      const extension = file.name.split('.').pop()
      const filename = `${Date.now()}-yarn-product.${extension}`.toLowerCase()

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
          message: `Add yarn product image: ${filename}`
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Upload failed')
      }

      const { cdnUrl } = await response.json()
      setImageUrl1(cdnUrl)
    } catch (error) {
      console.error('Upload failed:', error)
      alert(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setUploading1(false)
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

  const activeBrands = brands.filter(brand => brand.isActive)

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">
        {product ? 'Edit Yarn Product' : 'Add New Yarn Product'}
      </h1>

      <form action={action} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Yarn Name</Label>
              <Input 
                type="text" 
                id="name" 
                name="name" 
                required 
                defaultValue={product?.pname || ""} 
                placeholder="e.g., Chunky Merino Wool"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="brandId">Brand</Label>
              <Select 
                name="brandId" 
                required 
                value={selectedBrandId}
                onValueChange={setSelectedBrandId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Brand" />
                </SelectTrigger>
                <SelectContent>
                  {activeBrands.map((brand) => (
                    <SelectItem key={brand.id} value={brand.id}>
                      {brand.name}
                      {brand.discountRate > 0 && (
                        <span className="ml-2 text-green-600 text-sm">
                          ({brand.discountRate}% off)
                        </span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedBrand && selectedBrand.discountRate > 0 && (
                <div className="text-sm text-green-600 flex items-center">
                  <Info className="w-4 h-4 mr-1" />
                  {selectedBrand.discountRate}% brand discount will be applied
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="color">Color</Label>
              <Input 
                type="color" 
                id="color" 
                name="color" 
                required 
                defaultValue={product?.color || "#ffffff"}
                className="w-full h-12"
              />
            </div>
          </div>

          {/* Brand Inherited Info Display */}
          <div className="space-y-4">
            {selectedBrand ? (
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="font-semibold text-blue-900 mb-3 flex items-center">
                  <Info className="w-4 h-4 mr-2" />
                  Brand Details (Inherited)
                </h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium text-blue-800">Category:</span>
                    <span className="ml-2 text-blue-700">{selectedBrand.category || 'Not set'}</span>
                  </div>
                  <div>
                    <span className="font-medium text-blue-800">Yarn Weight:</span>
                    <span className="ml-2 text-blue-700">{selectedBrand.y_weight || 'Not set'}</span>
                  </div>
                  <div>
                    <span className="font-medium text-blue-800">Weight (grams):</span>
                    <span className="ml-2 text-blue-700">{selectedBrand.weight_g}g</span>
                  </div>
                  <div>
                    <span className="font-medium text-blue-800">Description:</span>
                    <p className="mt-1 text-blue-700">{selectedBrand.desc || 'No description'}</p>
                  </div>
                  {selectedBrand.defaultImageUrl && (
                    <div>
                      <span className="font-medium text-blue-800">Brand Image:</span>
                      <Image 
                        src={selectedBrand.defaultImageUrl} 
                        alt="Brand image" 
                        width={100} 
                        height={100} 
                        className="mt-2 rounded border"
                        unoptimized 
                      />
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-600">
                  Select a brand to see inherited properties
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Image Upload Section - Only Primary Image */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Product Image</h3>
          <div className="max-w-md">
            <Label>Primary Product Image *</Label>
            <div className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
              {imageUrl1 ? (
                <div className="space-y-3">
                  <Image 
                    src={imageUrl1} 
                    alt="Product image" 
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
                      onClick={() => setImageUrl1("")}
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
                        disabled={uploading1}
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
                        Click to upload product image
                      </span>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={uploading1}
                      />
                    </label>
                  </div>
                  <p className="text-sm text-gray-500">PNG, JPG up to 2MB</p>
                </div>
              )}
              {uploading1 && (
                <div className="flex items-center justify-center space-x-2 mt-4">
                  <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                  <span className="text-blue-600">Uploading to GitHub...</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Pricing Section */}
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
              <Label htmlFor="discountedPrice">Final Price (₹)</Label>
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
                {originalPrice && discountedPrice && originalPrice > discountedPrice && (
                  <span className="text-green-600 ml-2">
                    (Save {fcurrency(originalPrice - discountedPrice)})
                  </span>
                )}
              </div>
            </div>
          </div>

          {selectedBrand && discountRate > 0 && originalPrice && (
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-sm text-blue-800">
                <strong>Pricing Breakdown:</strong>
                <div className="mt-2 space-y-1">
                  <div>Original Price: {fcurrency(originalPrice)}</div>
                  <div>Brand Discount ({discountRate}%): -{fcurrency((originalPrice * discountRate) / 100)}</div>
                  <div className="border-t pt-1 font-medium">
                    Suggested Final Price: {fcurrency(originalPrice - (originalPrice * discountRate) / 100)}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Stock and Visibility */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="stock">Stock Quantity</Label>
            <Input 
              type="number" 
              id="stock" 
              name="stock" 
              min="0" 
              required 
              defaultValue={product?.stock?.toString() || ""} 
              placeholder="e.g., 50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="shown">Product Visibility</Label>
            <Select name="shown" required defaultValue={product?.Shown?.toString() || "true"}>
              <SelectTrigger>
                <SelectValue placeholder="Select visibility" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Show on website</SelectItem>
                <SelectItem value="false">Hide from website</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Hidden input for image URL */}
        <input type="hidden" name="url" value={imageUrl1} />

        {/* Submit Section */}
        <div className="border-t pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <Button 
              type="submit" 
              disabled={isPending || uploading1 || !imageUrl1 || !selectedBrandId}
              className="flex-1 sm:flex-none sm:min-w-[140px]"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                product ? 'Update Product' : 'Add Product'
              )}
            </Button>
            <Button type="button" variant="outline" className="flex-1 sm:flex-none">
              Cancel
            </Button>
          </div>

          {!imageUrl1 && (
            <p className="text-sm text-amber-600 mt-2 flex items-center">
              <Upload className="w-4 h-4 mr-1" />
              Product image is required before saving
            </p>
          )}

          {!selectedBrandId && (
            <p className="text-sm text-amber-600 mt-2 flex items-center">
              <Info className="w-4 h-4 mr-1" />
              Please select a brand
            </p>
          )}

          {state.message && state.message !== " " && (
            <div className={`mt-4 p-3 rounded-md ${
              state.message === "" ? "bg-green-50 text-green-800 border border-green-200" : "bg-red-50 text-red-800 border border-red-200"
            }`}>
              {state.message === "" ? "✅ Product saved successfully!" : `❌ ${state.message}`}
            </div>
          )}
        </div>
      </form>
    </div>
  )
}