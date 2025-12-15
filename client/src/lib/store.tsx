import React, { createContext, useContext, useState, useEffect } from "react";

export type User = {
  id: number;
  name: string;
  pin?: string;
  mustResetPin?: string;
};

export type Product = {
  id: number;
  name: string;
  price: number;
  type: "monster" | "coke" | "other";
  icon?: string;
  borderColor?: string;
};

export type Transaction = {
  id: number;
  userId: number;
  productId: number;
  productName: string;
  timestamp: string;
  price: number;
};

export type PurchaseHistory = {
  id: number;
  userId: number;
  userName: string;
  productName: string;
  price: number;
  timestamp: string;
  month: string;
};

interface BeverageContextType {
  users: User[];
  products: Product[];
  transactions: Transaction[];
  purchaseHistory: PurchaseHistory[];
  availableMonths: string[];
  currentUser: User | null;
  isAdmin: boolean;
  loading: boolean;
  loginUser: (userId: number) => void;
  loginUserWithPin: (pin: string) => Promise<{ success: boolean; user?: User; mustResetPin?: boolean; message?: string }>;
  resetUserPin: (userId: number, newPin: string) => Promise<void>;
  createUser: (name: string) => Promise<void>;
  updateUser: (userId: number, name: string) => Promise<void>;
  deleteUser: (userId: number) => Promise<void>;
  logoutUser: () => void;
  loginAdmin: (password: string) => Promise<boolean>;
  logoutAdmin: () => void;
  addProduct: (product: Omit<Product, "id">) => Promise<void>;
  updateProduct: (productId: number, data: Partial<Omit<Product, "id">>) => Promise<void>;
  removeProduct: (productId: number) => Promise<void>;
  updateProductPrice: (productId: number, newPrice: number) => Promise<void>;
  recordTransaction: (userId: number, productId: number) => Promise<void>;
  resetMonth: () => Promise<void>;
  clearUserTransactions: (userId: number) => Promise<void>;
  getUserBalance: (userId: number) => number;
  getUserHistory: (userId: number) => Transaction[];
  getUserPurchaseHistory: (userId: number) => PurchaseHistory[];
  getPurchaseHistoryByMonth: (month: string) => PurchaseHistory[];
  refreshData: () => Promise<void>;
}

const BeverageContext = createContext<BeverageContextType | undefined>(undefined);

export function BeverageProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<User[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [purchaseHistory, setPurchaseHistory] = useState<PurchaseHistory[]>([]);
  const [availableMonths, setAvailableMonths] = useState<string[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // Restaurar usuário do localStorage ao iniciar
  useEffect(() => {
    const savedUserId = localStorage.getItem("recria_current_user_id");
    if (savedUserId && users.length > 0) {
      const user = users.find(u => u.id === parseInt(savedUserId));
      if (user) {
        setCurrentUser(user);
      }
    }
  }, [users]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersRes, productsRes, transactionsRes, historyRes, monthsRes] = await Promise.all([
        fetch("/api/users"),
        fetch("/api/products"),
        fetch("/api/transactions"),
        fetch("/api/history"),
        fetch("/api/history/months"),
      ]);

      const usersData = await usersRes.json();
      const productsData = await productsRes.json();
      const transactionsData = await transactionsRes.json();
      const historyData = await historyRes.json();
      const monthsData = await monthsRes.json();

      setUsers(usersData);
      setProducts(productsData);
      setTransactions(transactionsData);
      setPurchaseHistory(historyData);
      setAvailableMonths(monthsData);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const loginUser = (userId: number) => {
    const user = users.find((u) => u.id === userId);
    if (user) {
      setCurrentUser(user);
      localStorage.setItem("recria_current_user_id", userId.toString());
    }
  };

  const createUser = async (name: string) => {
    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const newUser = await response.json();
      setUsers([...users, newUser]);
    } catch (error) {
      console.error("Error creating user:", error);
    }
  };

  const updateUser = async (userId: number, name: string) => {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const updatedUser = await response.json();
      setUsers(users.map((u) => (u.id === userId ? updatedUser : u)));
    } catch (error) {
      console.error("Error updating user:", error);
    }
  };

  const deleteUser = async (userId: number) => {
    try {
      await fetch(`/api/users/${userId}`, {
        method: "DELETE",
      });
      setUsers(users.filter((u) => u.id !== userId));
    } catch (error) {
      console.error("Error deleting user:", error);
    }
  };

  const logoutUser = () => {
    setCurrentUser(null);
    localStorage.removeItem("recria_current_user_id");
  };

  const loginUserWithPin = async (pin: string) => {
    try {
      const response = await fetch("/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      const data = await response.json();

      if (data.success && data.user) {
        setCurrentUser(data.user);
        localStorage.setItem("recria_current_user_id", data.user.id.toString());
        return {
          success: true,
          user: data.user,
          mustResetPin: data.mustResetPin
        };
      }
      return { success: false, message: data.message };
    } catch (error) {
      console.error("Error logging in with PIN:", error);
      return { success: false, message: "Erro ao fazer login" };
    }
  };

  const resetUserPin = async (userId: number, newPin: string) => {
    try {
      const response = await fetch(`/api/users/${userId}/reset-pin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPin }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      const updatedUser = await response.json();
      setUsers(users.map(u => u.id === userId ? updatedUser : u));
      if (currentUser?.id === userId) {
        setCurrentUser(updatedUser);
      }
    } catch (error) {
      console.error("Error resetting PIN:", error);
      throw error;
    }
  };

  const loginAdmin = async (password: string) => {
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await response.json();

      if (data.success) {
        setIsAdmin(true);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error logging in as admin:", error);
      return false;
    }
  };

  const logoutAdmin = () => setIsAdmin(false);

  const addProduct = async (product: Omit<Product, "id">) => {
    try {
      const response = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(product),
      });
      const newProduct = await response.json();
      setProducts([...products, newProduct]);
    } catch (error) {
      console.error("Error adding product:", error);
    }
  };

  const updateProduct = async (productId: number, data: Partial<Omit<Product, "id">>) => {
    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const updatedProduct = await response.json();
      setProducts(products.map((p) => (p.id === productId ? updatedProduct : p)));
    } catch (error) {
      console.error("Error updating product:", error);
    }
  };

  const removeProduct = async (productId: number) => {
    try {
      await fetch(`/api/products/${productId}`, {
        method: "DELETE",
      });
      setProducts(products.filter((p) => p.id !== productId));
    } catch (error) {
      console.error("Error removing product:", error);
    }
  };

  const updateProductPrice = async (productId: number, newPrice: number) => {
    try {
      const response = await fetch(`/api/products/${productId}/price`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ price: newPrice }),
      });
      const updatedProduct = await response.json();
      setProducts(products.map((p) => (p.id === productId ? updatedProduct : p)));
    } catch (error) {
      console.error("Error updating product price:", error);
    }
  };

  const recordTransaction = async (userId: number, productId: number) => {
    try {
      const product = products.find((p) => p.id === productId);
      if (!product) return;

      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          productId,
          productName: product.name,
          price: product.price,
        }),
      });
      const newTransaction = await response.json();
      setTransactions([...transactions, newTransaction]);
    } catch (error) {
      console.error("Error recording transaction:", error);
    }
  };

  const resetMonth = async () => {
    try {
      await fetch("/api/transactions", {
        method: "DELETE",
      });
      setTransactions([]);
    } catch (error) {
      console.error("Error resetting month:", error);
    }
  };

  const clearUserTransactions = async (userId: number) => {
    try {
      await fetch(`/api/transactions/user/${userId}`, {
        method: "DELETE",
      });
      setTransactions(transactions.filter((t) => t.userId !== userId));
    } catch (error) {
      console.error("Error clearing user transactions:", error);
    }
  };

  const getUserBalance = (userId: number) => {
    return transactions
      .filter((t) => t.userId === userId)
      .reduce((sum, t) => sum + t.price, 0);
  };

  const getUserHistory = (userId: number) => {
    return transactions
      .filter((t) => t.userId === userId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  };

  const getUserPurchaseHistory = (userId: number) => {
    return purchaseHistory
      .filter((h) => h.userId === userId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  };

  const getPurchaseHistoryByMonth = (month: string) => {
    return purchaseHistory
      .filter((h) => h.month === month)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  };

  return (
    <BeverageContext.Provider
      value={{
        users,
        products,
        transactions,
        purchaseHistory,
        availableMonths,
        currentUser,
        isAdmin,
        loading,
        loginUser,
        loginUserWithPin,
        resetUserPin,
        createUser,
        updateUser,
        deleteUser,
        logoutUser,
        loginAdmin,
        logoutAdmin,
        addProduct,
        updateProduct,
        removeProduct,
        updateProductPrice,
        recordTransaction,
        resetMonth,
        clearUserTransactions,
        getUserBalance,
        getUserHistory,
        getUserPurchaseHistory,
        getPurchaseHistoryByMonth,
        refreshData: fetchData,
      }}
    >
      {children}
    </BeverageContext.Provider>
  );
}

export function useBeverage() {
  const context = useContext(BeverageContext);
  if (context === undefined) {
    throw new Error("useBeverage must be used within a BeverageProvider");
  }
  return context;
}
