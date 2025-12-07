// The issue: When editing, brand?.defaultImageUrl might be the default value
// but we're checking if it equals the default string

'use client'
import { useState, useActionState, useEffect } from 'react'
import { useFormStatus } from 'react-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Info, CheckCircle, Upload, X } from 'lucide-react'
import { createBrand, updateBrand } from '../_actions/brands'
import Image from 'next/image'

interface Brand {
  id: string
  name: string
  discountRate: number
  isActive: boolean
  defaultImageUrl?: string
  desc?: string
  y_weight?: string
  weight_g?: number
  category?: string
}

interface BrandFormProps {
  brand?: Brand | null
}

type ActionState = {
  success?: boolean
  error?: string | null
  fieldErrors?: {
    name?: string[]
    discountRate?: string[]
    isActive?: string[]
    category?: string[]
    weight?: string[]
    gweight?: string[]
    desc?: string[]
    iurl1?: string[]
  }
  message: string
}

function SubmitButton({ isEdit, disabled }: { isEdit: boolean, disabled: boolean }) {
  const { pending } = useFormStatus()

  return (
    <Button 
      type="submit" 
      disabled={pending || disabled} 
      className="flex-1 sm:flex-none sm:min-w-[140px]"
    >
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {isEdit ? 'Updating...' : 'Creating...'}
        </>
      ) : (
        isEdit ? 'Update Brand' : 'Create Brand'
      )}
    </Button>
  )
}

export function BrandForm({ brand }: BrandFormProps) {
  const isEdit = brand != null

  const initialState: ActionState = {
    message: "",
    success: false,
    error: null,
    fieldErrors: {}
  }

  const [state, action, isPending] = useActionState(
    isEdit ? updateBrand.bind(null, brand.id) : createBrand, 
    initialState
  )

  const [isActive, setIsActive] = useState(brand?.isActive ?? true)
  const [discountRate, setDiscountRate] = useState<number>(brand?.discountRate ?? 0)
  
  // FIX: Initialize with actual brand image, even if it's the default URL
  // Don't filter out the default URL - show whatever is in the database
  const [imageUrl, setImageUrl] = useState(() => {
    const url = brand?.defaultImageUrl || ""
    console.log('Initial brand image URL:', url)
    return url
  })
  
  const [uploading, setUploading] = useState(false)

  // Log when brand prop changes
  useEffect(() => {
    console.log('Brand prop changed:', brand)
    if (brand?.defaultImageUrl) {
      console.log('Setting image URL from brand:', brand.defaultImageUrl)
      setImageUrl(brand.defaultImageUrl)
    }
  }, [brand])

  const fcurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount)
  }

  const examplePrice = 1000
  const exampleSavings = (examplePrice * discountRate) / 100
  const exampleFinalPrice = examplePrice - exampleSavings

  const uploadToGitHub = async (file: File) => {
    setUploading(true)
    console.log('Starting upload for file:', file.name)
    
    try {
      const extension = file.name.split('.').pop()
      const filename = `${Date.now()}-brand.${extension}`.toLowerCase()
      console.log('Generated filename:', filename)

      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => {
          const result = reader.result as string
          const base64Data = result.split(',')[1]
          console.log('File converted to base64, length:', base64Data.length)
          resolve(base64Data)
        }
        reader.onerror = (error) => {
          console.error('FileReader error:', error)
          reject(error)
        }
        reader.readAsDataURL(file)
      })

      console.log('Sending upload request to /api/upload-image')
      const response = await fetch('/api/upload-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename,
          content: base64,
          message: `Add brand image: ${filename}`
        })
      })

      console.log('Upload response status:', response.status)
      
      if (!response.ok) {
        const errorData = await response.json()
        console.error('Upload error response:', errorData)
        throw new Error(errorData.error || 'Upload failed')
      }

      const responseData = await response.json()
      console.log('Upload success, full response:', responseData)
      
      if (responseData.cdnUrl) {
        console.log('Setting image URL to:', responseData.cdnUrl)
        setImageUrl(responseData.cdnUrl)
        alert('Image uploaded successfully!')
      } else {
        console.error('No cdnUrl in response:', responseData)
        throw new Error('No CDN URL returned from upload')
      }
    } catch (error) {
      console.error('Upload failed with error:', error)
      alert(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setUploading(false)
      console.log('Upload process completed, current imageUrl:', imageUrl)
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    console.log('File selected:', file?.name)
    
    if (!file) {
      console.log('No file selected')
      return
    }

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      alert('Image must be smaller than 2MB')
      return
    }

    console.log('File validation passed, starting upload')
    uploadToGitHub(file)
  }

  // Check if the image URL is the default one
  const isDefaultImage = imageUrl === 'https://example.com/default-brand-img.jpg' || imageUrl === ''
  
  console.log('Render - imageUrl:', imageUrl, 'isDefaultImage:', isDefaultImage)

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">
        {isEdit ? 'Edit Brand' : 'Add New Brand'}
      </h1>

      <form action={action} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Brand Name</Label>
              <Input 
                type="text" 
                id="name" 
                name="name" 
                required 
                defaultValue={brand?.name || ""} 
                placeholder="e.g., Bernat, Lion Brand, Red Heart"
                className={state.fieldErrors?.name ? 'border-red-500' : ''}
              />
              {state.fieldErrors?.name && (
                <p className="text-sm text-red-600">{state.fieldErrors.name[0]}</p>
              )}
              <div className="text-sm text-muted-foreground">
                Choose a unique, recognizable brand name
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="isActive">Brand Status</Label>
              <div className="flex items-center space-x-3 p-3 border rounded-md">
                <Switch
                  id="isActive"
                  checked={isActive}
                  onCheckedChange={setIsActive}
                />
                <input 
                  type="hidden" 
                  name="isActive" 
                  value={isActive ? 'on' : 'off'} 
                />
                <Label htmlFor="isActive" className="flex-1 cursor-pointer">
                  <span className="font-medium">
                    {isActive ? 'Active Brand' : 'Inactive Brand'}
                  </span>
                  <div className="text-sm text-muted-foreground mt-1">
                    {isActive 
                      ? 'Brand is available for new products' 
                      : 'Brand is hidden and unavailable for new products'
                    }
                  </div>
                </Label>
              </div>
              {state.fieldErrors?.isActive && (
                <p className="text-sm text-red-600">{state.fieldErrors.isActive[0]}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="discountRate">Brand Discount Rate (%)</Label>
              <Input
                type="number"
                id="discountRate"
                name="discountRate"
                min="0"
                max="100"
                step="0.01"
                value={discountRate}
                onChange={(e) => setDiscountRate(Number(e.target.value) || 0)}
                placeholder="0.00"
                className={state.fieldErrors?.discountRate ? 'border-red-500' : ''}
              />
              {state.fieldErrors?.discountRate && (
                <p className="text-sm text-red-600">{state.fieldErrors.discountRate[0]}</p>
              )}
              <div className="text-sm text-muted-foreground">
                Default discount applied to all products under this brand
              </div>
            </div>
          </div>

          {/* Yarn Properties */}
          <div className="space-y-4">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center text-sm text-blue-800">
                <Info className="w-4 h-4 mr-2" />
                <span className="font-medium">These properties will be inherited by all products</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Fiber Content</Label>
              <Select name="category" required defaultValue={brand?.category || ""}>
                <SelectTrigger className={state.fieldErrors?.category ? 'border-red-500' : ''}>
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
              {state.fieldErrors?.category && (
                <p className="text-sm text-red-600">{state.fieldErrors.category[0]}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="weight">Yarn Weight</Label>
              <Select name="weight" required defaultValue={brand?.y_weight || ""}>
                <SelectTrigger className={state.fieldErrors?.weight ? 'border-red-500' : ''}>
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
              {state.fieldErrors?.weight && (
                <p className="text-sm text-red-600">{state.fieldErrors.weight[0]}</p>
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
                defaultValue={brand?.weight_g || 100}
                placeholder="e.g., 100, 250, 500"
                className={state.fieldErrors?.gweight ? 'border-red-500' : ''}
              />
              {state.fieldErrors?.gweight && (
                <p className="text-sm text-red-600">{state.fieldErrors.gweight[0]}</p>
              )}
              <div className="text-sm text-muted-foreground">Standard weight for products under this brand</div>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="desc">Brand Description</Label>
          <textarea 
            name="desc" 
            id="desc" 
            required 
            defaultValue={brand?.desc || ""} 
            className={`w-full min-h-[100px] p-3 border rounded-md resize-y focus:outline-none focus:ring-2 focus:ring-blue-500 ${state.fieldErrors?.desc ? 'border-red-500' : ''}`}
            placeholder="Describe the brand's yarn characteristics, quality, typical uses..."
          />
          {state.fieldErrors?.desc && (
            <p className="text-sm text-red-600">{state.fieldErrors.desc[0]}</p>
          )}
          <div className="text-sm text-muted-foreground">
            This description will be inherited by all products under this brand
          </div>
        </div>

        {/* Brand Image Upload */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Brand Image</h3>
          <div className="max-w-md">
            <Label>Brand Representative Image</Label>
            
            <div className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
              {imageUrl && !isDefaultImage ? (
                <div className="space-y-3">
                  <Image 
                    src={imageUrl} 
                    alt="Brand image" 
                    width={200} 
                    height={200} 
                    className="mx-auto rounded-lg object-cover shadow-md"
                    unoptimized 
                  />
                  <p className="text-xs text-gray-500 break-all max-w-md mx-auto">
                    {imageUrl}
                  </p>
                  <div className="flex gap-2 justify-center">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        console.log('Removing image')
                        setImageUrl("")
                      }}
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
                        Click to upload brand image
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
                  <p className="text-sm text-gray-500">PNG, JPG up to 2MB (Optional)</p>
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

        {/* Hidden input for image URL */}
        <input type="hidden" name="iurl1" value={imageUrl} />

        {/* Discount Preview */}
        {discountRate > 0 && (
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="text-sm text-blue-800">
              <div className="flex items-center mb-2">
                <Info className="w-4 h-4 mr-1" />
                <strong>Discount Preview</strong>
              </div>
              <div className="space-y-1">
                <div>Example: Product priced at {fcurrency(examplePrice)}</div>
                <div>Brand discount ({discountRate}%): -{fcurrency(exampleSavings)}</div>
                <div className="border-t pt-1 font-medium text-green-700">
                  Customer pays: {fcurrency(exampleFinalPrice)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Submit Section */}
        <div className="border-t pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <SubmitButton isEdit={isEdit} disabled={uploading} />
            <Button 
              type="button" 
              variant="outline" 
              className="flex-1 sm:flex-none"
              onClick={() => window.history.back()}
            >
              Cancel
            </Button>
          </div>

          {state.success && (
            <div className="mt-4 p-4 bg-green-50 text-green-800 border border-green-200 rounded-md">
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 mr-2" />
                <span>
                  Brand {isEdit ? 'updated' : 'created'} successfully!
                </span>
              </div>
            </div>
          )}

          {state.error && (
            <div className="mt-4 p-4 bg-red-50 text-red-800 border border-red-200 rounded-md">
              Error: {state.error}
            </div>
          )}
        </div>
      </form>
    </div>
  )
}