'use client'

import React, { useState, useTransition } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { 
  Edit, 
  Package, 
  Percent, 
  Settings, 
  Check, 
  X,
  Loader2,
  Trash2 
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { updateBrandStatus, updateBrandDiscount, deleteBrand } from './../_actions/brands'
import { toast } from 'sonner'

type BrandWithCount = {
  id: string
  name: string
  discountRate: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  _count: {
    products: number
  }
}

interface BrandCardProps {
  brand: BrandWithCount
}

const BrandCard: React.FC<BrandCardProps> = ({ brand }) => {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [discountRate, setDiscountRate] = useState(brand.discountRate)
  const [isActive, setIsActive] = useState(brand.isActive)
  const [isPending, startTransition] = useTransition()
  const [isDeleting, setIsDeleting] = useState(false)

  const handleEdit = () => {
    router.push(`/admin/brands/${brand.id}`)
  }

  const handleStatusChange = (newStatus: boolean) => {
    startTransition(async () => {
      const result = await updateBrandStatus(brand.id, newStatus)
      if (result.success) {
        setIsActive(newStatus)
        toast.success(`Brand ${newStatus ? 'activated' : 'deactivated'} successfully`)
      } else {
        toast.error(result.error || 'Failed to update brand status')
        setIsActive(!newStatus) // Revert on error
      }
    })
  }

  const handleDiscountSave = () => {
    if (discountRate < 0 || discountRate > 100) {
      toast.error('Discount rate must be between 0 and 100')
      return
    }

    startTransition(async () => {
      const result = await updateBrandDiscount(brand.id, discountRate)
      if (result.success) {
        setIsEditing(false)
        toast.success('Discount updated successfully')
      } else {
        toast.error(result.error || 'Failed to update discount')
        setDiscountRate(brand.discountRate) // Revert on error
      }
    })
  }

  const handleDiscountCancel = () => {
    setDiscountRate(brand.discountRate)
    setIsEditing(false)
  }

  const handleDelete = () => {
    setIsDeleting(true)
    startTransition(async () => {
      try {
        const result = await deleteBrand(brand.id)
        if (result.success) {
          toast.success('Brand deleted successfully')
          // The component will be removed from the list due to revalidatePath in the action
        } else {
          toast.error(result.error || 'Failed to delete brand')
        }
      } catch (error) {
        toast.error('An unexpected error occurred while deleting the brand')
      } finally {
        setIsDeleting(false)
      }
    })
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(new Date(date))
  }

  return (
    <Card className="w-full hover:shadow-lg transition-shadow duration-200 relative">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-3">
            <CardTitle className="text-lg font-semibold text-gray-900">
              {brand.name}
            </CardTitle>
            
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <Switch
                  checked={isActive}
                  onCheckedChange={handleStatusChange}
                  disabled={isPending || isDeleting}
                  className="data-[state=checked]:bg-green-600"
                />
                <Badge 
                  variant={isActive ? "default" : "secondary"}
                  className={`${isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}
                >
                  {isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              
              {!isEditing && discountRate > 0 && (
                <Badge variant="destructive" className="bg-red-100 text-red-800">
                  <Percent className="w-3 h-3 mr-1" />
                  {discountRate}% OFF
                </Badge>
              )}
            </div>
          </div>

          {/* Action buttons as a column on the right */}
          <div className="flex flex-col gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
              className="h-8 px-3 bg-gray-50 hover:bg-gray-100 border-gray-200"
              disabled={isPending || isDeleting}
            >
              <Settings className="h-4 w-4 mr-1" />
              Settings
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleEdit}
              className="h-8 px-3 bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
              disabled={isDeleting}
            >
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </Button>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  size="sm"
                  className="h-8 px-3 bg-red-600 hover:bg-red-700 text-white shadow-sm"
                  disabled={isPending || isDeleting}
                >
                  {isDeleting ? (
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4 mr-1" />
                  )}
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the brand &quot;{brand.name}&quot; 
                    and all {brand._count.products} associated products.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleDelete}
                    className="bg-red-600 hover:bg-red-700"
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      'Delete Brand'
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-3">
          {isEditing && (
            <div className="p-3 bg-gray-50 rounded-lg space-y-3">
              <div className="space-y-2">
                <Label htmlFor="discount" className="text-sm font-medium">
                  Discount Rate (%)
                </Label>
                <Input
                  id="discount"
                  type="number"
                  min="0"
                  max="100"
                  value={discountRate}
                  onChange={(e) => setDiscountRate(Number(e.target.value))}
                  className="h-8"
                  disabled={isPending || isDeleting}
                />
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={handleDiscountSave}
                  disabled={isPending || isDeleting}
                  className="h-7 px-3 flex-1"
                >
                  {isPending ? (
                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                  ) : (
                    <Check className="h-3 w-3 mr-1" />
                  )}
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleDiscountCancel}
                  disabled={isPending || isDeleting}
                  className="h-7 px-3 flex-1"
                >
                  <X className="h-3 w-3 mr-1" />
                  Cancel
                </Button>
              </div>
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <div className="flex items-center text-sm text-gray-600">
              <Package className="w-4 h-4 mr-2" />
              Products
            </div>
            <span className="font-medium text-gray-900">
              {brand._count.products}
            </span>
          </div>
          
          <div className="pt-2 border-t border-gray-100">
            <div className="text-xs text-gray-500 space-y-1">
              <div>Created: {formatDate(brand.createdAt)}</div>
              <div>Updated: {formatDate(brand.updatedAt)}</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default BrandCard