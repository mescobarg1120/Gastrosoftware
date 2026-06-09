export interface Employee {
  id: number;
  fullName: string;
  rut: string;
  email: string;
  role: string;
  branchId: number;
  branchName: string;
  active: boolean;
}

export interface Order {
  id: number;
  customerId?: number;
  customerName?: string;
  branchId: number;
  orderType: string;
  status: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  createdAt: string;
}

export interface OrderItem {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  categoryId: number;
  categoryName: string;
  active: boolean;
}

export interface RawMaterial {
  id: number;
  name: string;
  unit: string;
  stockQty: number;
  minStock: number;
  avgUnitCost: number;
  lastUnitCost: number;
  branchId: number;
}

export interface Customer {
  id: number;
  fullName: string;
  phone: string;
  email?: string;
  loyaltyTier: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderAt?: string;
}

export interface Supplier {
  id: number;
  legalName: string;
  tradeName?: string;
  rut: string;
  active: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  employeeId: number;
  email: string;
  role: string;
  branchId: number;
  fullName: string;
  expiresIn: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface AuthEmployee {
  id: number;
  email: string;
  role: string;
  branchId: number;
  fullName: string;
}
