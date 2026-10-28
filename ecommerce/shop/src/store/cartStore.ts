import { create } from "zustand";
import { persist } from "zustand/middleware";
import { CartItem, Coupon, Product, Language } from "@/types";
import { AVAILABLE_COUPONS } from "@/data/products";

// Интерфейс уведомления (Toast)
export interface ToastMessage {
  id: string;
  type: "success" | "info" | "warning";
  text: string;
}

interface CartStore {
  language: Language;
  items: CartItem[];
  wishlist: string[]; // ID товаров в избранном
  appliedCoupon: Coupon | null;
  isCartDrawerOpen: boolean;
  toast: ToastMessage | null;

  // Действия с языком
  setLanguage: (lang: Language) => void;

  // Действия с корзиной
  addItem: (product: Product, quantity?: number, selectedColor?: string, selectedSize?: string) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;

  // Действия с промокодом
  applyCoupon: (code: string) => { success: boolean; message: string };
  removeCoupon: () => void;

  // Действия с интерфейсом
  setCartDrawerOpen: (isOpen: boolean) => void;
  toggleCartDrawer: () => void;
  showToast: (text: string, type?: "success" | "info" | "warning") => void;
  hideToast: () => void;

  // Действия с избранным
  toggleWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;

  // Вычисляемые геттеры
  getTotalItems: () => number;
  getSubtotal: () => number;
  getDiscountAmount: () => number;
  getTaxAmount: () => number;
  getShippingCost: () => number;
  getTotalAmount: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      language: "es", // Испанский по умолчанию
      items: [],
      wishlist: [],
      appliedCoupon: null,
      isCartDrawerOpen: false,
      toast: null,

      // Смена языка
      setLanguage: (lang) => {
        set({ language: lang });
      },

      // Добавление товара в корзину
      addItem: (product, quantity = 1, selectedColor, selectedSize) => {
        set((state) => {
          const existingIndex = state.items.findIndex((item) => item.product.id === product.id);
          const lang = state.language;
          const productTitle = product.title[lang] || product.title.es;

          let newItems: CartItem[];
          if (existingIndex > -1) {
            newItems = state.items.map((item, index) =>
              index === existingIndex
                ? { ...item, quantity: item.quantity + quantity }
                : item
            );
          } else {
            newItems = [
              ...state.items,
              { product, quantity, selectedColor, selectedSize },
            ];
          }

          const toastText =
            lang === "es"
              ? `«${productTitle}» añadido al carrito`
              : `"${productTitle}" added to cart`;

          return {
            items: newItems,
            isCartDrawerOpen: true, // Автоматически открываем корзину
            toast: {
              id: Date.now().toString(),
              type: "success",
              text: toastText,
            },
          };
        });
      },

      // Удаление товара
      removeItem: (productId) => {
        set((state) => ({
          items: state.items.filter((item) => item.product.id !== productId),
        }));
      },

      // Изменение количества товара
      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }
        set((state) => ({
          items: state.items.map((item) =>
            item.product.id === productId ? { ...item, quantity } : item
          ),
        }));
      },

      // Очистка корзины
      clearCart: () => {
        set({ items: [], appliedCoupon: null });
      },

      // Применение промокода
      applyCoupon: (code) => {
        const cleanCode = code.trim().toUpperCase();
        const found = AVAILABLE_COUPONS.find((c) => c.code === cleanCode);
        const lang = get().language;

        if (!found) {
          return {
            success: false,
            message: lang === "es" ? "Código promocional no válido" : "Invalid coupon code",
          };
        }

        const subtotal = get().getSubtotal();
        if (found.minSubtotal && subtotal < found.minSubtotal) {
          return {
            success: false,
            message:
              lang === "es"
                ? `Pedido mínimo para ${found.code}: ${found.minSubtotal}€`
                : `Minimum order for ${found.code}: €${found.minSubtotal}`,
          };
        }

        set({ appliedCoupon: found });
        return {
          success: true,
          message:
            lang === "es"
              ? `¡Código ${found.code} aplicado (-${found.discountPercent}%)!`
              : `Coupon ${found.code} applied (-${found.discountPercent}%)!`,
        };
      },

      // Удаление промокода
      removeCoupon: () => {
        set({ appliedCoupon: null });
      },

      // Управление drawer корзины
      setCartDrawerOpen: (isOpen) => set({ isCartDrawerOpen: isOpen }),
      toggleCartDrawer: () =>
        set((state) => ({ isCartDrawerOpen: !state.isCartDrawerOpen })),

      // Toast уведомления
      showToast: (text, type = "success") => {
        set({ toast: { id: Date.now().toString(), type, text } });
      },
      hideToast: () => set({ toast: null }),

      // Избранное
      toggleWishlist: (productId) => {
        set((state) => {
          const exists = state.wishlist.includes(productId);
          const lang = state.language;
          const newWishlist = exists
            ? state.wishlist.filter((id) => id !== productId)
            : [...state.wishlist, productId];
          const text = exists
            ? lang === "es" ? "Eliminado de favoritos" : "Removed from wishlist"
            : lang === "es" ? "Añadido a favoritos" : "Added to wishlist";

          return {
            wishlist: newWishlist,
            toast: {
              id: Date.now().toString(),
              type: "info",
              text,
            },
          };
        });
      },
      isInWishlist: (productId) => get().wishlist.includes(productId),

      // Вычисления сумм
      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },

      getSubtotal: () => {
        return get().items.reduce(
          (total, item) => total + item.product.price * item.quantity,
          0
        );
      },

      getDiscountAmount: () => {
        const subtotal = get().getSubtotal();
        const coupon = get().appliedCoupon;
        if (!coupon) return 0;
        return (subtotal * coupon.discountPercent) / 100;
      },

      getShippingCost: () => {
        const subtotal = get().getSubtotal();
        if (subtotal === 0) return 0;
        // Бесплатная доставка от 50 евро
        if (subtotal >= 50) return 0;
        return 4.99;
      },

      getTaxAmount: () => {
        // НДС 21% включен в стоимость (европейский стандарт цен B2C)
        const subtotalAfterDiscount = get().getSubtotal() - get().getDiscountAmount();
        return (subtotalAfterDiscount * 0.21) / 1.21;
      },

      getTotalAmount: () => {
        const subtotal = get().getSubtotal();
        if (subtotal === 0) return 0;
        const discount = get().getDiscountAmount();
        const shipping = get().getShippingCost();
        return Math.max(0, subtotal - discount + shipping);
      },
    }),
    {
      name: "viasglobal-shop-storage",
      partialize: (state) => ({
        language: state.language,
        items: state.items,
        wishlist: state.wishlist,
        appliedCoupon: state.appliedCoupon,
      }),
    }
  )
);
