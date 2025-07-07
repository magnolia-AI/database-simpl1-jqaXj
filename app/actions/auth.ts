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
type FormActionResult = { error: string } | void;

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
    return { error: errorMessages.join(", ") };
  }

  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return { error: "User with this email already exists." };
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
  } catch (error) {
    console.error("Registration error:", error);
    return { error: "Failed to register user. Please try again." };
  }
}

export async function login(
  prevState: any,
  formData: FormData
): Promise<FormActionResult> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  // Validate input using Zod (optional, but good practice)
  const validatedFields = loginSchema.safeParse({
    email,
    password,
  });

  if (!validatedFields.success) {
    const errorMessages = validatedFields.error.issues.map(
      (issue) => issue.message
    );
    return { error: errorMessages.join(", ") };
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/",
    });
  } catch (error) {
    // next-auth throws an error on redirect, so we catch it
    // and only return an error if it's not the redirect error
    if (error instanceof Error && error.message.includes("CredentialsSignin")) {
      return { error: "Invalid credentials." };
    }
    // If it's not a CredentialsSignin error, it might be a redirect error
    // or another unexpected error. For redirect errors, we don't return anything.
    // For other errors, we log and return a generic message.
    console.error("Login error:", error);
    return { error: "Failed to login. Please try again." };
  }
}

export async function signOut(): Promise<void> {
  await nextAuthSignOut({ redirectTo: "/auth/login" });
}

