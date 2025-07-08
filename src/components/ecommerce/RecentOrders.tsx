import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import Badge from "../ui/badge/Badge";
import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";

// Define the TypeScript interface for orders
interface OrderItem {
  order_item_id: number;
  product_id: number;
  product_name: string;
  product_sku: string;
  quantity: number;
  price: string;
  total_price: string;
}

interface Order {
  order_id: number;
  order_number: string;
  customer_name: string;
  customer_email: string;
  status: "pending" | "completed" | "cancelled" | "refunded";
  payment_status: "pending" | "paid" | "failed" | "refunded";
  total_amount: string;
  created_at: string;
  items: OrderItem[];
}

export default function RecentOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth(); // Assuming token is stored in localStorage
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await axios.get(
          "https://nexodus.tech/api/admin/orders",
          {
            params: {
              limit: 5, // Get only 5 most recent orders
              sortBy: "created_at",
              sortOrder: "desc",
            },
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`, // Assuming token is stored in localStorage
            },
          }
        );
        setOrders(response.data.data);
      } catch (err) {
        setError("Failed to fetch orders");
        console.error("Error fetching orders:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  if (loading) {
    return <div>Loading orders...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "completed":
        return "success";
      case "pending":
        return "warning";
      case "cancelled":
        return "error";
      case "refunded":
        return "info";
      default:
        return "default";
    }
  };

  const getPaymentStatusBadgeColor = (status: string) => {
    switch (status) {
      case "paid":
        return "success";
      case "pending":
        return "warning";
      case "failed":
        return "error";
      case "refunded":
        return "info";
      default:
        return "default";
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
      <div className="flex flex-col gap-2 mb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Recent Orders
          </h3>
        </div>

      </div>
      <div className="max-w-full overflow-x-auto">
        <Table>
          {/* Table Header */}
          <TableHeader className="border-gray-100 dark:border-gray-800 border-y">
            <TableRow>
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Order #
              </TableCell>
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Customer
              </TableCell>
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Date
              </TableCell>
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Items
              </TableCell>
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Total
              </TableCell>
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Status
              </TableCell>
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Payment
              </TableCell>
            </TableRow>
          </TableHeader>

          {/* Table Body */}
          <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
            {orders.map((order) => (
              <TableRow key={order.order_id} className="">
                <TableCell className="py-3">
                  <p className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                    #{order.order_number}
                  </p>
                </TableCell>
                <TableCell className="py-3">
                  <div>
                    <p className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                      {order.customer_name}
                    </p>
                    <span className="text-gray-500 text-theme-xs dark:text-gray-400">
                      {order.customer_email}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                  {new Date(order.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                  {order.items.length} items
                </TableCell>
                <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                  ${order.total_amount}
                </TableCell>
                <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                  <Badge size="sm" color={getStatusBadgeColor(order.status)}>
                    {order.status.charAt(0).toUpperCase() +
                      order.status.slice(1)}
                  </Badge>
                </TableCell>
                <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                  <Badge
                    size="sm"
                    color={getPaymentStatusBadgeColor(order.payment_status)}
                  >
                    {order.payment_status.charAt(0).toUpperCase() +
                      order.payment_status.slice(1)}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
