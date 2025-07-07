'use server'

import prisma from "@/lib/prisma";
import { hash } from "bcryptjs";
import { redirect } from "next/navigation";
import { z } from "zod";
import { signIn, signOut as nextAuthSignOut } from "@/lib/auth";

// Define a schema for registration input validation
const registerSchema = z.object({
  name: z.string().min(1, "Name is required").trim(),
  email: z.string().email("Invalid email address").min(1, "Email is required").trim(),
  password: z.string().min(6, "Password must be at least 6 characters").trim(),
});

// Define a schema for login input validation (optional, but good practice)
const loginSchema = z.object({
  email: z.string().email("Invalid email address").min(1, "Email is required").trim(),
  password: z.string().min(1, "Password is required").trim(),
});

// Type for form action results (simple error object or void for redirect)
type FormActionResult = { success: true } | { success: false; error: string };

export async function register(
  prevState: any,
  formData: FormData
): Promise<FormActionResult> {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  // Validate input using Zod
  const validatedFields = registerSchema.safeParse({
    name,
    email,
    password,
  });

  if (!validatedFields.success) {
    const errorMessages = validatedFields.error.issues.map(
      (issue) => issue.message
    );
    return { success: false, error: errorMessages.join(", ") };
  }

  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return { success: false, error: "User with this email already exists." };
    }

    // Hash password
    const hashedPassword = await hash(password, 10);

    // Create user in database
    await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    // Redirect to login page on success
    redirect("/auth/login");
    return { success: true }; // Explicitly return success after redirect
  } catch (error) {
    console.error("Registration error:", error);
    return { success: false, error: "Failed to register user. Please try again." };
  }
}

export async function login(
  prevState: any,
  formData: FormData
): Promise<FormActionResult> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  // Validate input using Zod
  const validatedFields = loginSchema.safeParse({
    email,
    password,
  });

  if (!validatedFields.success) {
    const errorMessages = validatedFields.error.issues.map(
      (issue) => issue.message
    );
    return { success: false, error: errorMessages.join(", ") };
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/", // Redirect to home page on successful login
    });
    return { success: true }; // Should not be reached if redirect is successful
  } catch (error) {
    console.error("Login error:", error);
    // Handle specific errors from signIn if needed
    if ((error as Error).message.includes("CredentialsSignin")) {
      return { success: false, error: "Invalid credentials." };
    }
    return { success: false, error: "Failed to login. Please try again." };
  }
}

export async function signOutAction(): Promise<FormActionResult> {
  try {
    await nextAuthSignOut({ redirectTo: "/auth/login" });
    return { success: true };
  } catch (error) {
    console.error("Sign out error:", error);
    return { success: false, error: "Failed to sign out. Please try again." };
  }
}

