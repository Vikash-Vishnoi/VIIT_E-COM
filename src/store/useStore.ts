import { create } from 'zustand';

interface GlobalState {
  wishlistIds: Set<string>;
  wishlistCount: number;
  cartCount: number;
  user: any | null;
  loadingAuth: boolean;
  
  setWishlistData: (ids: string[]) => void;
  toggleWishlistId: (id: string, action: 'added' | 'removed') => void;
  setCartCount: (count: number) => void;
  setUser: (user: any | null) => void;
  setLoadingAuth: (loading: boolean) => void;
}

export const useStore = create<GlobalState>((set) => ({
  wishlistIds: new Set(),
  wishlistCount: 0,
  cartCount: 0,
  user: null,
  loadingAuth: true,
  
  setWishlistData: (ids) => set(() => ({
    wishlistIds: new Set(ids),
    wishlistCount: ids.length,
  })),
  
  toggleWishlistId: (id, action) => set((state) => {
    const newSet = new Set(state.wishlistIds);
    if (action === 'added') {
      newSet.add(id);
    } else {
      newSet.delete(id);
    }
    return {
      wishlistIds: newSet,
      wishlistCount: newSet.size,
    };
  }),
  
  setCartCount: (count) => set({ cartCount: count }),
  setUser: (user) => set({ user }),
  setLoadingAuth: (loading) => set({ loadingAuth: loading }),
}));
