"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { useActionState, useState, useRef, useEffect } from "react"
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
  
  // Image upload states
  const [imageUrl1, setImageUrl1] = useState(product?.irul || "")
  const [imageUrl2, setImageUrl2] = useState(product?.iurl1 || "")
  const [uploading1, setUploading1] = useState(false)
  const [uploading2, setUploading2] = useState(false)

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
  const uploadToGitHub = async (file: File, imageNumber: 1 | 2) => {
    const setUploading = imageNumber === 1 ? setUploading1 : setUploading2
    const setImageUrl = imageNumber === 1 ? setImageUrl1 : setImageUrl2
    
    setUploading(true)
    
    try {
      // Generate filename with timestamp
      const extension = file.name.split('.').pop()
      const filename = `${Date.now()}-yarn-${imageNumber}.${extension}`.toLowerCase()
      
      // Convert file to base64
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onload = () => {
          const result = reader.result as string
          resolve(result.split(',')[1]) // Remove data:image/... prefix
        }
        reader.readAsDataURL(file)
      })

      // Upload to GitHub
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
      setImageUrl(cdnUrl)
      
    } catch (error) {
      console.error('Upload failed:', error)
      alert(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setUploading(false)
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, imageNumber: 1 | 2) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }
    
    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('Image must be smaller than 2MB')
      return
    }
    
    uploadToGitHub(file, imageNumber)
  }

  // Filter active brands
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
              <Label htmlFor="gweight">Weight (grams)</Label>
              <Input 
                type="number" 
                id="gweight" 
                name="gweight" 
                required 
                min="25"
                step="25"
                defaultValue={product?.weight_g || ""}
                placeholder="e.g., 100, 250, 500"
              />
              <div className="text-sm text-muted-foreground">Weight of yarn ball/skein in grams</div>
            </div>
          </div>

          {/* Yarn Details */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="category">Fiber Content</Label>
              <Select name="category" required defaultValue={product?.category || ""}>
                <SelectTrigger>
                  <SelectValue placeholder="Select fiber type" />
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
              <Label htmlFor="weight">Yarn Weight</Label>
              <Select name="weight" required defaultValue={product?.y_weight || ""}>
                <SelectTrigger>
                  <SelectValue placeholder="Select yarn weight" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="super-fine">Weight 1 – Super Fine (Lace, Fingering)</SelectItem>
                  <SelectItem value="fine">Weight 2 – Fine (Sport)</SelectItem>
                  <SelectItem value="light-dk">Weight 3 – Light / DK</SelectItem>
                  <SelectItem value="medium">Weight 4 – Medium (Worsted)</SelectItem>
                  <SelectItem value="bulky">Weight 5 – Bulky</SelectItem>
                  <SelectItem value="super-bulky">Weight 6 – Super Bulky</SelectItem>
                  <SelectItem value="jumbo">Weight 7 – Jumbo</SelectItem>
                </SelectContent>
              </Select>
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
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="desc">Description</Label>
          <textarea 
            name="desc" 
            id="desc" 
            required 
            defaultValue={product?.desc || ""} 
            className="w-full min-h-[100px] p-3 border rounded-md resize-y focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Describe the yarn's texture, best uses, care instructions..."
          />
        </div>

        {/* Image Upload Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Product Images</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Image 1 */}
            <div className="space-y-4 p-4 border rounded-lg">
              <Label>Primary Image *</Label>
              
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                {imageUrl1 ? (
                  <div className="space-y-3">
                    <Image 
                      src={imageUrl1} 
                      alt="Primary yarn image" 
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
                          onChange={(e) => handleImageUpload(e, 1)}
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
                          Click to upload primary image
                        </span>
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={(e) => handleImageUpload(e, 1)}
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

            {/* Image 2 */}
            <div className="space-y-4 p-4 border rounded-lg">
              <Label>Secondary Image *</Label>
              
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                {imageUrl2 ? (
                  <div className="space-y-3">
                    <Image 
                      src={imageUrl2} 
                      alt="Secondary yarn image" 
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
                        onClick={() => setImageUrl2("")}
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
                          onChange={(e) => handleImageUpload(e, 2)}
                          disabled={uploading2}
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
                          Click to upload secondary image
                        </span>
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={(e) => handleImageUpload(e, 2)}
                          disabled={uploading2}
                        />
                      </label>
                    </div>
                    <p className="text-sm text-gray-500">PNG, JPG up to 2MB</p>
                  </div>
                )}
                
                {uploading2 && (
                  <div className="flex items-center justify-center space-x-2 mt-4">
                    <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                    <span className="text-blue-600">Uploading to GitHub...</span>
                  </div>
                )}
              </div>
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

          {/* Pricing Info */}
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

        {/* Hidden inputs for image URLs */}
        <input type="hidden" name="url" value={imageUrl1} />
        <input type="hidden" name="url2" value={imageUrl2} />

        {/* Submit Section */}
        <div className="border-t pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <Button 
              type="submit" 
              disabled={isPending || uploading1 || uploading2 || !imageUrl1 || !imageUrl2}
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

          {/* Upload Requirements */}
          {(!imageUrl1 || !imageUrl2) && (
            <p className="text-sm text-amber-600 mt-2 flex items-center">
              <Upload className="w-4 h-4 mr-1" />
              Both images are required before saving
            </p>
          )}

          {/* Status Messages */}
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