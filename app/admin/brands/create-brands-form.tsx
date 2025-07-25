'use client'

import { useState, useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Info, CheckCircle } from 'lucide-react'
import { createBrand, updateBrand } from '../_actions/brands'

interface Brand {
  id: string
  name: string
  discountRate: number
  isActive: boolean
}

interface BrandFormProps {
  brand?: Brand | null
}

// Define the action state type
type ActionState = {
  success?: boolean
  error?: string | null
  fieldErrors?: {
    name?: string
    discountRate?: string
    isActive?: string
  }
  message: string
}

function SubmitButton({ isEdit }: { isEdit: boolean }) {
  const { pending } = useFormStatus()
  
  return (
    <Button 
      type="submit" 
      disabled={pending} 
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
  
  // Initialize with proper state structure
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

  // Format currency for display
  const fcurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount)
  }

  // Calculate example savings
  const examplePrice = 1000
  const exampleSavings = (examplePrice * discountRate) / 100
  const exampleFinalPrice = examplePrice - exampleSavings

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
                <p className="text-sm text-red-600">{state.fieldErrors.name}</p>
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
                  name="isActive"
                  checked={isActive}
                  onCheckedChange={setIsActive}
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
            </div>
          </div>

          {/* Discount Configuration */}
          <div className="space-y-4">
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
                <p className="text-sm text-red-600">{state.fieldErrors.discountRate}</p>
              )}
              <div className="text-sm text-muted-foreground">
                Default discount applied to all products under this brand
              </div>
            </div>

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

            {discountRate === 0 && (
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="text-sm text-gray-600">
                  <div className="flex items-center">
                    <Info className="w-4 h-4 mr-1" />
                    <span>No brand discount applied</span>
                  </div>
                  <div className="mt-1">
                    Products under this brand will use their individual pricing
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Additional Info Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Brand Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 border rounded-lg space-y-2">
              <h4 className="font-medium text-sm text-gray-700">Status Summary</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Availability:</span>
                  <span className={isActive ? 'text-green-600' : 'text-gray-500'}>
                    {isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Discount Rate:</span>
                  <span className={discountRate > 0 ? 'text-blue-600' : 'text-gray-500'}>
                    {discountRate}%
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 border rounded-lg space-y-2">
              <h4 className="font-medium text-sm text-gray-700">Impact</h4>
              <div className="text-sm text-muted-foreground space-y-1">
                <div>• Products will inherit this discount rate</div>
                <div>• Inactive brands won&apos;t appear in product forms</div>
                <div>• Changes affect all future products</div>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Section */}
        <div className="border-t pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <SubmitButton isEdit={isEdit} />
            
            <Button 
              type="button" 
              variant="outline" 
              className="flex-1 sm:flex-none"
              onClick={() => window.history.back()}
            >
              Cancel
            </Button>
          </div>

          {/* Status Messages */}
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