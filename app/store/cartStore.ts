import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  ticketTypeId: number;
  name: string;
  price: number;
  quantity: number;
}

interface CartState {
  items: CartItem[];

  setQuantity: (payload: {
    ticketTypeId: number;
    name: string;
    price: number;
    quantity: number;
  }) => void;

  clearCart: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],

      setQuantity: (payload) => {
        if (!payload) return;

        const { ticketTypeId, name, price, quantity } = payload;

        set((state) => {
          // ❌ Si quantity = 0 → quitar item
          if (quantity === 0) {
            return {
              items: state.items.filter(
                (i) => i.ticketTypeId !== ticketTypeId
              ),
            };
          }

          const existing = state.items.find(
            (i) => i.ticketTypeId === ticketTypeId
          );

          // 🔄 Si existe → actualizar
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.ticketTypeId === ticketTypeId
                  ? { ...i, quantity }
                  : i
              ),
            };
          }

          // ➕ Si NO existe → agregar
          return {
            items: [
              ...state.items,
              { ticketTypeId, name, price, quantity },
            ],
          };
        });
      },

      clearCart: () => set({ items: [] }),
    }),
    {
      name: "blacknight-cart", // 👈 CLAVE ABSOLUTA
    }
  )
);
