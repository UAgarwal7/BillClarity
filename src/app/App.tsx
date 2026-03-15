import { RouterProvider } from "react-router";
import { router } from "./routes";
import { BillProvider } from "./context/bill-context";

export default function App() {
  return (
    <BillProvider>
      <RouterProvider router={router} />
    </BillProvider>
  );
}
