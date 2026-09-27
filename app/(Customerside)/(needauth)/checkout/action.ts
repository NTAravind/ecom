// action.ts
'use server'
import prisma from "@/lib/prisma";
import { encodeAddress } from "@/utils/address";

interface ActionResult {
  success: boolean;
  message: string;
  user?: any;
}

export async function createUser(prevState: any, formData: FormData): Promise<ActionResult> {
  try {
    const name     = formData.get("name")?.toString().trim();
    const street   = formData.get("street")?.toString().trim();
    const city     = formData.get("city")?.toString().trim();
    const state    = formData.get("state")?.toString().trim();
    const landmark = formData.get("landmark")?.toString().trim();
    const phone    = formData.get("phone")?.toString().trim();
    const pincode  = formData.get("pincode")?.toString().trim();
    const delivered = formData.get("delivered") === "true";

    // All fields are required (landmark is now required too)
    if (!name || !phone || !street || !city || !state || !landmark || !pincode) {
      return {
        success: false,
        message: "All fields (name, phone, street, city, state, landmark, and pincode) are required",
      };
    }

    // Additional validation for pincode (should be numeric and reasonable length)
    if (!/^\d{4,8}$/.test(pincode)) {
      return {
        success: false,
        message: "Please enter a valid pincode (4-8 digits)",
      };
    }

    const userData = {
      name,
      phone,
      Address: encodeAddress(street, city, state, landmark),
      pincode,
    };

    const user = await prisma.user.create({ data: userData });

    return {
      success: true,
      message: `User details saved successfully for ${delivered ? "delivery" : "pickup"} order`,
      user,
    };
  } catch (error: any) {
    console.error("Error creating user:", error);

    // Handle duplicate phone number error
    if (error.code === "P2002" && error.meta?.target?.includes("phone")) {
      return {
        success: false,
        message: "A user with this phone number already exists. Try updating instead.",
      };
    }

    return { success: false, message: "Failed to save user details. Please try again." };
  }
}

export async function updateUser(prevState: any, formData: FormData): Promise<ActionResult> {
  try {
    const name     = formData.get("name")?.toString().trim();
    const street   = formData.get("street")?.toString().trim();
    const city     = formData.get("city")?.toString().trim();
    const state    = formData.get("state")?.toString().trim();
    const landmark = formData.get("landmark")?.toString().trim();
    const phone    = formData.get("phone")?.toString().trim();
    const pincode  = formData.get("pincode")?.toString().trim();
    const delivered = formData.get("delivered") === "true";

    // All fields are required (landmark is now required too)
    if (!name || !phone || !street || !city || !state || !landmark || !pincode) {
      return {
        success: false,
        message: "All fields (name, phone, street, city, state, landmark, and pincode) are required",
      };
    }

    // Additional validation for pincode (should be numeric and reasonable length)
    if (!/^\d{4,8}$/.test(pincode)) {
      return {
        success: false,
        message: "Please enter a valid pincode (4-8 digits)",
      };
    }

    const updateData = {
      name,
      Address: encodeAddress(street, city, state, landmark),
      pincode,
    };

    const user = await prisma.user.update({
      where: { phone },
      data: updateData,
    });

    return {
      success: true,
      message: `User details updated successfully for ${delivered ? "delivery" : "pickup"} order`,
      user,
    };
  } catch (error: any) {
    console.error("Error updating user:", error);

    // Handle case where user doesn't exist
    if (error.code === "P2025") {
      return {
        success: false,
        message: "User not found. Please create a new account.",
      };
    }

    return { success: false, message: "Failed to update user details. Please try again." };
  }
}