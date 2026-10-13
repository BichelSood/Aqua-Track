import { z } from "zod";
import {
  COMPLAINT_STATUSES,
  COMPLAINT_TYPES,
  DELIVERY_TRANSITION_TARGETS,
  LAUNDRY_STATUSES,
  WASHING_TRANSITION_TARGETS,
} from "@/types";

export const scanBagSchema = z.object({
  identifier: z.string().trim().min(1, "Please scan the QR code or enter a roll number."),
  pickupSessionId: z.string().uuid("Pickup session is required."),
});

export const laundryLookupSchema = z.object({
  identifier: z
    .string()
    .trim()
    .min(1, "Please scan the QR code or enter a roll number."),
});

export const createPickupSessionSchema = z
  .object({
    hostelId: z.string().uuid("Please choose a hostel."),
    deliveryBoyId: z.string().uuid("Please choose delivery staff."),
    scheduledDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Please choose a valid date."),
    startTime: z.string().min(1, "Start time is required."),
    endTime: z.string().min(1, "End time is required."),
  })
  .refine((value) => value.startTime < value.endTime, {
    message: "End time must be later than start time.",
    path: ["endTime"],
  });

export const announcePickupSessionSchema = z.object({
  pickupSessionId: z.string().uuid("Pickup session is required."),
});

export const pickupSessionActionSchema = z.object({
  pickupSessionId: z.string().uuid("Pickup session is required."),
  action: z.enum(["START", "COMPLETE"]),
});

export const transitionOrderStatusSchema = z.object({
  orderId: z.string().uuid("Laundry order is required."),
  targetStatus: z.enum(LAUNDRY_STATUSES),
  reason: z.string().trim().min(1).optional(),
});

export const washingTransitionSchema = transitionOrderStatusSchema.extend({
  targetStatus: z.enum(WASHING_TRANSITION_TARGETS),
});

export const deliveryTransitionSchema = transitionOrderStatusSchema.extend({
  targetStatus: z.enum(DELIVERY_TRANSITION_TARGETS),
});

export const createComplaintSchema = z.object({
  laundryOrderId: z.string().uuid("Please choose a laundry order."),
  type: z.enum(COMPLAINT_TYPES, {
    message: "Please choose a complaint type.",
  }),
  description: z.string().trim().min(1, "Please describe the problem."),
});

export const updateStudentProfileSchema = z.object({
  fullName: z.string().trim().min(2, "Please enter your full name.").max(100),
  phone: z.string().trim().max(20).optional(),
  roomNumber: z.string().trim().max(20).optional(),
});

export const createDeliveryBatchSchema = z.object({
  hostelId: z.string().uuid("Please choose a hostel."),
  orderIds: z.array(z.string().uuid()).min(1, "Select at least one order."),
});

export const deliveryBatchIdSchema = z.object({
  deliveryBatchId: z.string().uuid("Delivery batch is required."),
});

export const receiveWashingBatchSchema = z.object({
  washingBatchId: z.string().uuid("Washing batch is required."),
});

export const scannerIdentifierSchema = z.object({
  identifier: z
    .string()
    .trim()
    .min(1, "Please scan the QR code or enter a roll number."),
});

export const recordDeliveryAttemptSchema = scannerIdentifierSchema.extend({
  reason: z
    .string()
    .trim()
    .min(1, "Please record why delivery could not be completed."),
});

export const adminOverrideStatusSchema = z.object({
  orderId: z.string().uuid("Laundry order is required."),
  targetStatus: z.enum(LAUNDRY_STATUSES),
  reason: z.string().trim().min(1, "A reason is required for this correction."),
});

export const adminUpdateUserSchema = z.object({
  userId: z.string().uuid("User is required."),
  fullName: z.string().trim().min(2).max(100),
  role: z.enum(["STUDENT", "DELIVERY_BOY", "WASHING_STAFF"]),
  isActive: z.boolean(),
  hostelId: z.string().uuid().optional(),
  facilityId: z.string().uuid().optional(),
});

export const adminNamedLocationSchema = z.object({
  name: z.string().trim().min(2).max(100),
  code: z.string().trim().min(2).max(40),
  address: z.string().trim().max(200).optional(),
});

export const adminUpdateNamedLocationSchema = adminNamedLocationSchema.extend({
  id: z.string().uuid(),
  isActive: z.boolean(),
});

export const adminCreateBagSchema = z.object({
  ownerId: z.string().uuid("Please choose a student."),
  bagCode: z.string().trim().min(3).max(40),
});

export const adminUpdateBagSchema = z.object({
  bagId: z.string().uuid(),
  isActive: z.boolean(),
});

export const adminUpdateComplaintSchema = z.object({
  complaintId: z.string().uuid(),
  status: z.enum(COMPLAINT_STATUSES),
});

export const loginSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address."),
  password: z.string().min(1, "Password is required."),
});

export const signupSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
  fullName: z.string().trim().min(2, "Please enter your full name.").max(100),
  phone: z.string().trim().max(20).optional(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address."),
});

export const updatePasswordSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters."),
    confirmPassword: z.string().min(1, "Please confirm your password."),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export const messageSchema = z.object({
  receiverId: z.string().uuid(),
  laundryOrderId: z.string().uuid().optional(),
  message: z.string().trim().min(1),
});
