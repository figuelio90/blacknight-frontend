import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  ticketTypeId: number;
  quantity: number;
}

interface CartState {
  eventId: number | null;
  items: CartItem[];

  setQuantity: (payload: {
    eventId: number;
    ticketTypeId: number;
    quantity: number;
  }) => void;

  reconcileCart: (payload: {
    eventId: number;
    activeTicketTypeIds: number[];
  }) => void;

  clearCart: () => void;
}

interface PersistedCartState {
  eventId?: number | null;
  items?: Array<Partial<CartItem>>;
}

const normalizeItems = (items: PersistedCartState["items"]): CartItem[] => {
  if (!Array.isArray(items)) return [];

  return items.reduce<CartItem[]>((normalizedItems, item) => {
    if (
      Number.isInteger(item.ticketTypeId) &&
      Number.isInteger(item.quantity) &&
      Number(item.quantity) > 0
    ) {
      normalizedItems.push({
        ticketTypeId: Number(item.ticketTypeId),
        quantity: Number(item.quantity),
      });
    }

    return normalizedItems;
  }, []);
};

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      eventId: null,
      items: [],

      setQuantity: ({ eventId, ticketTypeId, quantity }) => {
        set((state) => {
          if (
            state.items.length > 0 &&
            state.eventId !== null &&
            state.eventId !== eventId
          ) {
            return state;
          }

          if (quantity <= 0) {
            const items = state.items.filter(
              (item) => item.ticketTypeId !== ticketTypeId
            );

            return {
              eventId: items.length > 0 ? eventId : null,
              items,
            };
          }

          const existing = state.items.some(
            (item) => item.ticketTypeId === ticketTypeId
          );

          return {
            eventId,
            items: existing
              ? state.items.map((item) =>
                  item.ticketTypeId === ticketTypeId
                    ? { ...item, quantity }
                    : item
                )
              : [...state.items, { ticketTypeId, quantity }],
          };
        });
      },

      reconcileCart: ({ eventId, activeTicketTypeIds }) => {
        set((state) => {
          if (state.eventId !== null && state.eventId !== eventId) {
            return state;
          }

          const activeIds = new Set(activeTicketTypeIds);
          const items = state.items.filter((item) =>
            activeIds.has(item.ticketTypeId)
          );

          return {
            eventId: items.length > 0 ? eventId : null,
            items,
          };
        });
      },

      clearCart: () => set({ eventId: null, items: [] }),
    }),
    {
      name: "blacknight-cart",
      version: 2,
      migrate: (persistedState) => {
        const persisted = (persistedState ?? {}) as PersistedCartState;
        const items = normalizeItems(persisted.items);
        const eventId = Number.isInteger(persisted.eventId)
          ? Number(persisted.eventId)
          : null;

        return {
          eventId: items.length > 0 ? eventId : null,
          items,
        };
      },
      partialize: (state) => ({
        eventId: state.eventId,
        items: state.items,
      }),
    }
  )
);
