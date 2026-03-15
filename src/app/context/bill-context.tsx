import { createContext, useContext, useState, type ReactNode } from "react";

interface BillContextValue {
  billId: string | null;
  setBillId: (id: string) => void;
}

const BillContext = createContext<BillContextValue>({
  billId: null,
  setBillId: () => {},
});

export function BillProvider({ children }: { children: ReactNode }) {
  const [billId, setBillIdState] = useState<string | null>(() => {
    return localStorage.getItem("billclarity_bill_id");
  });

  const setBillId = (id: string) => {
    localStorage.setItem("billclarity_bill_id", id);
    setBillIdState(id);
  };

  return (
    <BillContext.Provider value={{ billId, setBillId }}>
      {children}
    </BillContext.Provider>
  );
}

export function useBillContext() {
  return useContext(BillContext);
}
