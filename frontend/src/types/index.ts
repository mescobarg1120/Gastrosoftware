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
  branchId: number;
  employeeId: number;
  customerId?: number;
  customerName?: string;
  orderTypeId: number;
  orderTypeName: string;
  orderStatusId: number;
  orderStatusName: string;
  orderStatusColor?: string;
  subtotal: number;
  discountAmount: number;
  platformCommission: number;
  total: number;
  items: OrderItem[];
  createdAt: string;
  updatedAt?: string;
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

export interface ProductResponse {
  id: number;
  name: string;
  productType: string;
  price: number;
  available: boolean;
  categoryName: string;
}

export interface CreateProductRequest {
  categoryId: number;
  name: string;
  productType: string;
  description?: string;
  price: number;
}

export interface RawMaterialResponse {
  id: number;
  name: string;
  unit: string;
  stockQty: number;
  minStock: number;
  avgUnitCost: number;
}

export interface EmployeeResponse {
  id: number;
  fullName: string;
  rut: string;
  email: string;
  role: string;
  branchId: number;
  active: boolean;
}

export interface CreateEmployeeRequest {
  branchId: number;
  roleId: number;
  fullName: string;
  rut: string;
  email: string;
  password: string;
}

export interface CustomerResponse {
  id: number;
  fullName: string;
  phone: string;
  email?: string;
  loyaltyTier: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderAt?: string;
}

export interface CreateCustomerRequest {
  fullName: string;
  phone: string;
  email?: string;
}

export interface SupplierResponse {
  id: number;
  legalName: string;
  tradeName?: string;
  rut: string;
  active: boolean;
}

export interface CreateSupplierRequest {
  legalName: string;
  tradeName?: string;
  rut: string;
  address?: string;
  leadTimeDays?: number;
  deliveryDays?: string;
  paymentTerms?: string;
}

export interface AuthEmployee {
  id: number;
  email: string;
  role: string;
  branchId: number;
  fullName: string;
}

export interface Category {
  id: number;
  name: string;
  active: boolean;
}

export interface IntermediateStockResponse {
  id: number;
  recipeId: number;
  recipeName: string;
  stockQty: number;
  unit: string;
  lastProducedAt: string;
}

export interface ProductionRequest {
  recipeId: number;
  branchId: number;
  employeeId: number;
  quantityProduced: number;
}

export interface RecipeResponse {
  id: number;
  productId: number;
  productName: string;
  name: string;
  size: string;
  isIntermediate: boolean;
  yieldQty: number;
  yieldUnit: string;
  items: RecipeItemResponse[];
}

export interface RecipeItemResponse {
  id: number;
  ingredientType: string;
  materialId: number;
  materialName: string;
  subRecipeId: number | null;
  subRecipeName: string | null;
  quantity: number;
  unit: string;
}

export interface CreateRecipeRequest {
  productId: number;
  name: string;
  size?: string;
  isIntermediate?: boolean;
  yieldQty?: number;
  yieldUnit?: string;
}

export interface CreateRecipeItemRequest {
  ingredientType: string;
  materialId?: number;
  subRecipeId?: number;
  quantityRequired: number;
  unit: string;
}

export interface CreateRawMaterialRequest {
  branchId: number;
  name: string;
  unit: string;
  stockQty: number;
  minStock: number;
  avgUnitCost: number;
}

export interface UpdateRawMaterialRequest {
  name?: string;
  unit?: string;
  minStock?: number;
}

export interface AdjustStockRequest {
  type: string;
  quantity: number;
  reason: string;
}
