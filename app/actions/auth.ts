'use server'

import prisma from "@/lib/prisma";
import { hash } from "bcryptjs";
import { redirect } from "next/navigation";
import { z } from "zod";

// Define a schema for registration input validation
const registerSchema = z.object({
  name: z.string().min(1, "Name is required").trim(),
  email: z.string().email("Invalid email address").min(1, "Email is required").trim(),
  password: z.string().min(6, "Password must be at least 6 characters").trim(),
});

// Define a type for action results to ensure consistency
export type ActionResult<T = any> =
  | {
      success: true;
      data?: T;
    }
  | {
      success: false;
      error: string;
    };

export async function register(
  prevState: any,
  formData: FormData
): Promise<ActionResult | { error: string } | void> {
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

// Placeholder for login action - will be fully implemented later
import { signIn } from "@/lib/auth";

export async function login(
  prevState: any,
  formData: FormData
): Promise<ActionResult | { error: string } | void> {
  try {
    await signIn("credentials", formData, { redirectTo: "/" });
  } catch (error) {
    if (error instanceof Error && error.message.includes("CredentialsSignin")) {
      return { error: "Invalid credentials." };
    }
    console.error("Login error:", error);
    return { error: "Failed to login. Please try again." };
  }
}


