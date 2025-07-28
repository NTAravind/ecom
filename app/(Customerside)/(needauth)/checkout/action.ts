// action.ts
'use server'
import prisma from "@/lib/prisma";

interface ActionResult {
  success: boolean;
  message: string;
  user?: any;
}

export async function createUser(prevState: any, formData: FormData): Promise<ActionResult> {
  try {
    const name = formData.get("name")?.toString().trim();
    const address = formData.get("address")?.toString().trim();
    const phone = formData.get("phone")?.toString().trim();
    const pincode = formData.get("pincode")?.toString().trim();
    const delivered = formData.get("delivered") === "true"; // Get delivery mode

    // Basic validation - name and phone are always required
    if (!name || !phone) {
      return { success: false, message: "Name and phone number are required" };
    }

    // Delivery mode validation - address and pincode required for delivery
    if (delivered && (!address || !pincode)) {
      return { success: false, message: "Address and pincode are required for delivery orders" };
    }

    // For pickup mode, address and pincode are optional (use empty strings)
    const userData = {
      name: name,
      phone: phone,
      Address: delivered ? (address || "") : (address || ""), // Empty string for pickup
      pincode: delivered ? (pincode || "") : (pincode || "")  // Empty string for pickup
    };

    const user = await prisma.user.create({
      data: userData
    });

    return { 
      success: true, 
      message: `User created successfully for ${delivered ? 'delivery' : 'pickup'}`, 
      user 
    };
  } catch (error) {
    console.error("Error creating user:", error);
    return { success: false, message: "Failed to create user. Please try again." };
  }
}

export async function updateUser(prevState: any, formData: FormData): Promise<ActionResult> {
  try {
    const name = formData.get("name")?.toString().trim();
    const address = formData.get("address")?.toString().trim();
    const phone = formData.get("phone")?.toString().trim();
    const pincode = formData.get("pincode")?.toString().trim();
    const delivered = formData.get("delivered") === "true"; // Get delivery mode

    // Basic validation - name and phone are always required
    if (!name || !phone) {
      return { success: false, message: "Name and phone number are required" };
    }

    // Delivery mode validation - address and pincode required for delivery
    if (delivered && (!address || !pincode)) {
      return { success: false, message: "Address and pincode are required for delivery orders" };
    }

    // For pickup mode, address and pincode are optional (use empty strings)
    const updateData = {
      name: name,
      Address: delivered ? (address || "") : (address || ""), // Empty string for pickup
      pincode: delivered ? (pincode || "") : (pincode || "")  // Empty string for pickup
    };

    const user = await prisma.user.update({
      where: { phone },
      data: updateData
    });

    return { 
      success: true, 
      message: `User updated successfully for ${delivered ? 'delivery' : 'pickup'}`, 
      user 
    };
  } catch (error) {
    console.error("Error updating user:", error);
    
    // Handle case where user doesn't exist
    if (error.code === 'P2025') {
      return { success: false, message: "User not found. Please create a new account." };
    }
    
    return { success: false, message: "Failed to update user. Please try again." };
  }
}