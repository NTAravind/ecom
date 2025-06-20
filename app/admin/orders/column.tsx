// app/(admin)/orders/columns.tsx
import { ColumnDef } from "@tanstack/react-table";
import { Order, User } from "@/app/generated/prisma";

type OrderWithUser = Order & { user: User };

export const columns: ColumnDef<OrderWithUser>[] = [
  {
    accessorKey: "id",
    header: "Order ID",
  },
  {
    accessorKey: "user.name",
    header: "Customer",
    cell: ({ row }) => <div>{row.original.user.name}</div>,
  },
  {
    accessorKey: "pricepaid",
    header: "Price Paid",
    cell: ({ row }) => <div>₹{row.original.pricepaid}</div>,
  },
  {
    accessorKey: "paymentid",
    header: "Payment ID",
  },
  {
    accessorKey: "paid",
    header: "Paid",
    cell: ({ row }) => <div>{row.original.paid ? "✅" : "❌"}</div>,
  },
  {
    accessorKey: "complete",
    header: "Complete",
    cell: ({ row }) => <div>{row.original.complete ? "✅" : "❌"}</div>,
  },
  {
    accessorKey: "createdAt",
    header: "Date",
    cell: ({ row }) => (
      <div>{new Date(row.original.createdAt).toLocaleDateString()}</div>
    ),
  },
];
