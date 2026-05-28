"use client";

import {
  Card,
  CardBody,
  CardHeader,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@heroui/react";
import { formatRupiah } from "@/lib/func";
import { OrderItem } from "./types";

interface OrderItemsTableProps {
  items: OrderItem[];
}

export function OrderItemsTable({ items }: OrderItemsTableProps) {
  return (
    <Card shadow="none" className="border border-default-200">
      <CardHeader className="pb-1 pt-4 px-4 flex items-center justify-between">
        <span className="text-sm font-semibold text-default-700">
          Item Pesanan
        </span>
        <span className="text-xs text-default-400">
          {items.length} produk · {items.reduce((s, i) => s + i.qty, 0)} pcs
        </span>
      </CardHeader>
      <Divider />
      <CardBody className="p-0">
        <Table
          removeWrapper
          aria-label="Daftar item pesanan"
          classNames={{ th: "bg-default-50 text-xs", td: "text-sm py-3" }}
        >
          <TableHeader>
            <TableColumn>PRODUK</TableColumn>
            <TableColumn className="text-right w-24">HARGA</TableColumn>
            <TableColumn className="text-center w-16">QTY</TableColumn>
            <TableColumn className="text-right w-28">SUBTOTAL</TableColumn>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <div>
                    <p className="font-medium">{item.nama}</p>
                    {item.product && (
                      <p className="text-xs text-default-400 font-mono">
                        {item.product.sku}
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right text-default-600">
                  {formatRupiah(parseFloat(item.harga))}
                </TableCell>
                <TableCell className="text-center font-semibold">
                  {item.qty}
                </TableCell>
                <TableCell className="text-right font-semibold text-default-900">
                  {formatRupiah(parseFloat(item.subtotal))}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardBody>
    </Card>
  );
}
