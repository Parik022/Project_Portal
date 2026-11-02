const { z } = require("zod");
const { env } = require("../config/env");

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("Invalid email address")
  .refine(
    (email) => !env.ALLOWED_EMAIL_DOMAIN || email.endsWith(`@${env.ALLOWED_EMAIL_DOMAIN}`),
    `Use your @${env.ALLOWED_EMAIL_DOMAIN} email address`
  );

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Za-z]/, "Password must contain a letter")
  .regex(/\d/, "Password must contain a number");

// SRM register numbers look like RA2411030010438: "RA" followed by 13 digits.
const registerNoSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^RA\d{13}$/, "Register number must look like RA2411030010438");

const departmentSchema = z.string().trim().min(2, "Department is required").max(60);

// Public sign-up is limited to students and faculty. Faculty accounts start
// inactive until an admin approves them; HOD and admin accounts are created by an admin.
const registerSchema = z
  .object({
    name: z.string().trim().min(2, "Name must be at least 2 characters").max(80),
    email: emailSchema,
    password: passwordSchema,
    role: z.enum(["STUDENT", "FACULTY"]),
    registerNo: registerNoSchema.optional(),
    department: departmentSchema,
  })
  .refine((data) => data.role !== "STUDENT" || data.registerNo, {
    message: "Register number is required for students",
    path: ["registerNo"],
  });

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

const updateProfileSchema = z
  .object({
    name: z.string().trim().min(2).max(80).optional(),
    department: departmentSchema.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, "Nothing to update");

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: passwordSchema,
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "New password must be different",
    path: ["newPassword"],
  });

module.exports = {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  changePasswordSchema,
  registerNoSchema,
  departmentSchema,
  passwordSchema,
  emailSchema,
};
