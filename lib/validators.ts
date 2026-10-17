import { z } from 'zod';

export const OrderItemSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  name: z.string().min(1, 'Product name is required'),
  price: z.number().int().positive('Price must be a positive integer'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1').max(100, 'Quantity cannot exceed 100'),
  size: z.string().optional(),
});

export const AddressFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().regex(/^[0-9]{10}$/, 'Phone number must be a 10-digit mobile number'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  address: z.string().min(5, 'Street address is required'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  pincode: z.string().regex(/^[0-9]{6}$/, 'PIN code must be 6 digits'),
});

export type AddressFormData = z.infer<typeof AddressFormSchema>;

export const CreateOrderSchema = z.object({
  customerName: z.string().min(2, 'Customer name must be at least 2 characters'),
  phone: z.string().regex(/^[0-9+() -]{10,15}$/, 'Invalid phone number format'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  address: z.string().min(5, 'Full street address is required'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  pincode: z.string().regex(/^[0-9]{6}$/, 'Indian PIN code must be 6 digits'),
  items: z.array(OrderItemSchema).min(1, 'Order must contain at least 1 item'),
  couponCode: z.string().optional(),
  paymentMethod: z.enum(['RAZORPAY', 'COD']).default('RAZORPAY'),
});

export const ValidateCouponSchema = z.object({
  code: z.string().min(1, 'Coupon code is required').trim(),
  subtotal: z.number().int().nonnegative('Subtotal must be non-negative'),
});

export const ProductQuerySchema = z.object({
  category: z.string().optional(),
  sort: z.enum(['price-low', 'price-high', 'rating', 'newest']).optional(),
  q: z.string().optional(),
  limit: z.coerce.number().int().positive().max(100).optional().default(50),
  page: z.coerce.number().int().positive().optional().default(1),
});

export const CreateReviewSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  name: z.string().min(2, 'Name is required'),
  rating: z.number().min(1).max(5),
  comment: z.string().min(5, 'Review comment must be at least 5 characters'),
});
