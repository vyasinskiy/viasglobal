/**
 * Типы данных для интернет-магазина Viasglobal Shop
 */

export type Language = "es" | "en";

// Категория товара
export type ProductCategory =
  | "all"
  | "electronics"
  | "smart-home"
  | "workspace"
  | "lifestyle"
  | "audio";

// Интерфейс отзыва покупателя
export interface ProductReview {
  id: string;
  author: string;
  rating: number; // от 1 до 5
  date: string;
  comment: {
    es: string;
    en: string;
  };
  verifiedPurchase: boolean;
}

// Интерфейс товара в магазине
export interface Product {
  id: string;
  slug: string;
  title: {
    es: string;
    en: string;
  };
  description: {
    es: string;
    en: string;
  };
  shortDescription: {
    es: string;
    en: string;
  };
  price: number; // Наша розничная цена на витрине в евро (€)
  distributorPrice?: number; // Оригинальная цена поставщика/дистрибьютора без наценки магазина (€)
  originalPrice?: number; // Старая зачеркнутая цена для скидок (€)
  currency: string;
  category: ProductCategory;
  brand: string;
  sku: string;
  ean?: string;
  images: string[];
  mainImage: string;
  rating: number;
  reviewCount: number;
  inStock: boolean;
  stockCount: number;
  isNew?: boolean;
  isBestseller?: boolean;
  isFeatured?: boolean;
  tags?: string[]; // Коллекционные теги для сезонных акций и фильтрации ('playa', 'verano', etc.)
  specs: {
    es: Record<string, string>;
    en: Record<string, string>;
  };
  features: {
    es: string[];
    en: string[];
  };
  reviews?: ProductReview[];
}

// Элемент корзины
export interface CartItem {
  product: Product;
  quantity: number;
  selectedColor?: string;
  selectedSize?: string;
}

// Промокод
export interface Coupon {
  code: string;
  discountPercent: number;
  minSubtotal?: number;
}

// Данные покупателя при оформлении заказа
export interface CustomerDetails {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  companyName?: string;
  vatNumber?: string; // для бизнеса (VIES 0% VAT)
  address: string;
  city: string;
  postalCode: string;
  country: string;
}

// Метод доставки
export interface ShippingMethod {
  id: string;
  title: {
    es: string;
    en: string;
  };
  description: {
    es: string;
    en: string;
  };
  price: number;
  estimatedDays: {
    es: string;
    en: string;
  };
}

// Метод оплаты
export type PaymentMethod = "card" | "paypal" | "apple_pay" | "klarna" | "bank_transfer";

// Заказ
export interface Order {
  id: string;
  orderNumber: string;
  createdAt: string;
  customer: CustomerDetails;
  items: CartItem[];
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number; // НДС 21%
  total: number;
  shippingMethod: string;
  paymentMethod: PaymentMethod;
  status: "pending" | "processing" | "completed" | "shipped";
}
