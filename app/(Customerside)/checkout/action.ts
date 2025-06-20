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

const pc = formData.get("pincode")?.toString().trim() ?? "";
    if (!name || !address || !phone || !pc) {
      return { success: false, message: "All fields are required" };
    }

    const user = await prisma.user.create({
      data: { name: name ?? "", Address: address ?? "", phone: phone ?? "", pincode: pc }
    });

    return { success: true, message: "User created successfully", user };
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
    const pc = formData.get("pincode")?.toString().trim() ?? "";
    if (!name || !address || !phone) {
      return { success: false, message: "All fields are required" };
    }

    const user = await prisma.user.update({
      where: { phone },
      data: { name, Address: address , pincode: pc }
    });

    return { success: true, message: "User updated successfully", user };
  } catch (error) {
    console.error("Error updating user:", error);
    return { success: false, message: "Failed to update user. Please try again." };
  }
}