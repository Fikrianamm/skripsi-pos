"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { fetcher, formatRupiah } from "@/lib/func";
import { Customer, Product } from "@/types/types";
import { PageHeader } from "@/components/page-header";
import { DatePicker } from "@heroui/date-picker";
import { parseDate } from "@internationalized/date";
import {
  Button,
  Select,
  SelectItem,
  Textarea,
  Chip,
  Card,
  CardBody,
  CardHeader,
  Divider,
  ScrollShadow,
  Autocomplete,
  AutocompleteItem,
} from "@heroui/react";
import {
  ShoppingCart,
  Search,
  Trash2,
  User,
  ClipboardList,
  CreditCard,
  Calendar,
  Truck,
  Tag,
  FileText,
  Zap,
} from "lucide-react";
import { addToast } from "@heroui/toast";
import { FormattedNumberInput } from "@/components/ui/formatted-number-input";
import { CartItemRow } from "./components/cart-item-row";
import { ProductSearchPanel } from "./components/product-search-panel";
import {
  CartItem,
  OrderChannel,
  StatusPembayaran,
  MetodePembayaran,
  CHANNELS,
  PAYMENT_STATUS,
  PAYMENT_METHODS,
} from "./components/types";

import { AddNewCustomerInline } from "../components/add-new-customer-inline";

export default function Page() {
  const router = useRouter();

  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Order info state
  const [customerId, setCustomerId] = useState("");
  const [channel, setChannel] = useState<OrderChannel>("LANGSUNG");
  const [statusPembayaran, setStatusPembayaran] =
    useState<StatusPembayaran>("BELUM_BAYAR");
  const [metodePembayaran, setMetodePembayaran] =
    useState<MetodePembayaran>("TUNAI");
  const [deadline, setDeadline] = useState<string>("");
  const [catatan, setCatatan] = useState("");
  const [diskon, setDiskon] = useState(0);
  const [ongkir, setOngkir] = useState<number | undefined>(undefined);

  const [kasBankId, setKasBankId] = useState<string>("");
  const [nominalBayar, setNominalBayar] = useState<number | undefined>(
    undefined,
  );
  const [nominalDpError, setNominalDpError] = useState<string>("");

  // Data KasBank
  const { data: kasBankData } = useSWR("/api/finance/kas-bank", fetcher);
  const kasBanks: {
    id: string;
    namaRekening: string;
    jenisRekening: string;
    nomorRekening?: string;
  }[] = kasBankData?.kasBanks ?? [];

  // Customer data
  const { data: customerData, mutate: mutateCustomers } = useSWR(
    "/api/admin/customer?&limit=1000",
    fetcher,
  );
  const customers: Customer[] = customerData?.results ?? [];

  // Cart helpers
  const addToCart = useCallback((product: Product) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === product.id);
      if (existing) {
        return prev.map((i) =>
          i.productId === product.id ? { ...i, qty: i.qty + 1 } : i,
        );
      }
      return [
        ...prev,
        {
          productId: product.id!,
          nama: product.nama,
          harga: Number(product.hargaJual),
          qty: 1,
          catatan: "",
          unit: product.unit?.nama ?? "pcs",
        },
      ];
    });
  }, []);

  const updateQty = useCallback((productId: string, qty: number) => {
    setCart((prev) =>
      prev.map((i) => (i.productId === productId ? { ...i, qty } : i)),
    );
  }, []);

  const removeItem = useCallback((productId: string) => {
    setCart((prev) => prev.filter((i) => i.productId !== productId));
  }, []);

  // Totals
  const subtotal = useMemo(
    () => cart.reduce((sum, i) => sum + i.harga * i.qty, 0),
    [cart],
  );
  const grandTotal = useMemo(
    () => Math.max(0, subtotal - diskon + (ongkir ?? 0)),
    [subtotal, diskon, ongkir],
  );

  // Submit
  async function handleSubmit() {
    if (cart.length === 0) {
      addToast({
        title: "Keranjang kosong",
        description: "Tambahkan setidaknya satu produk.",
        color: "warning",
      });
      return;
    }
    if (!customerId) {
      addToast({
        title: "Customer belum dipilih",
        description: "Pilih customer terlebih dahulu.",
        color: "warning",
      });
      return;
    }

    // Validasi nominal DP
    if (statusPembayaran === "DP") {
      const dp = nominalBayar ?? 0;
      if (dp <= 0) {
        setNominalDpError("Nominal DP wajib diisi.");
        return;
      }
      if (dp > grandTotal) {
        setNominalDpError(
          `Nominal DP tidak boleh melebihi Grand Total (${formatRupiah(grandTotal)}).`,
        );
        return;
      }
      setNominalDpError("");
    }

    setIsSubmitting(true);
    try {
      const body = {
        customerId,
        channel,
        statusPembayaran,
        metodePembayaran,
        deadline: deadline || undefined,
        catatan: catatan || undefined,
        diskon,
        ongkir: ongkir ?? null,
        subtotal,
        grandTotal,
        items: cart.map((i) => ({
          productId: i.productId,
          nama: i.nama,
          harga: i.harga,
          qty: i.qty,
          subtotal: i.harga * i.qty,
        })),
        kasBankId:
          statusPembayaran === "DP" || statusPembayaran === "LUNAS"
            ? kasBankId
            : undefined,
        nominalBayar:
          statusPembayaran === "LUNAS"
            ? grandTotal
            : statusPembayaran === "DP"
              ? nominalBayar
              : undefined,
      };

      const res = await fetch("/api/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const json = await res.json();

      if (!res.ok) {
        addToast({
          title: "Gagal membuat pesanan",
          description: json.error || "Terjadi kesalahan.",
          color: "danger",
        });
        return;
      }

      router.push(`/order/list`);
    } catch {
      addToast({
        title: "Gagal",
        description: "Terjadi kesalahan jaringan.",
        color: "danger",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 gap-5 mb-4">
      <PageHeader
        title="Buat Pesanan"
        description="Form pembuatan pesanan baru — pilih produk, isi info pesanan, lalu simpan."
      />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-5 flex-1 min-h-0">
        {/* LEFT: Product Search + Cart */}
        <div className="flex flex-col gap-5 min-h-0">
          {/* Product Search */}
          <Card className="border border-default-200 shadow-none">
            <CardHeader className="flex items-center gap-2 pb-2">
              <div className="p-1.5 rounded-md bg-primary/10">
                <Search size={15} className="text-primary" />
              </div>
              <span className="font-semibold text-sm">
                Cari &amp; Tambah Produk
              </span>
            </CardHeader>
            <Divider />
            <CardBody className="min-h-[260px] max-h-[340px] overflow-hidden flex flex-col">
              <ProductSearchPanel onAdd={addToCart} />
            </CardBody>
          </Card>

          {/* Cart */}
          <Card className="border border-default-200 shadow-none flex-1 min-h-0">
            <CardHeader className="flex items-center justify-between pb-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-primary/10">
                  <ShoppingCart size={15} className="text-primary" />
                </div>
                <span className="font-semibold text-sm">Keranjang</span>
                {cart.length > 0 && (
                  <Chip size="sm" color="primary" variant="flat">
                    {cart.length} item
                  </Chip>
                )}
              </div>
              {cart.length > 0 && (
                <Button
                  size="sm"
                  variant="light"
                  color="danger"
                  onPress={() => setCart([])}
                  startContent={<Trash2 size={13} />}
                >
                  Kosongkan
                </Button>
              )}
            </CardHeader>
            <Divider />
            <CardBody className="p-0">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-default-400 gap-2 h-full">
                  <ShoppingCart size={36} strokeWidth={1.5} />
                  <p className="text-sm">Keranjang masih kosong</p>
                  <p className="text-xs">
                    Cari produk di atas untuk menambahkan
                  </p>
                </div>
              ) : (
                <ScrollShadow
                  className="max-h-72 overflow-y-auto px-4"
                  hideScrollBar
                >
                  {cart.map((item) => (
                    <CartItemRow
                      key={item.productId}
                      item={item}
                      onQtyChange={(qty) => updateQty(item.productId, qty)}
                      onRemove={() => removeItem(item.productId)}
                    />
                  ))}
                </ScrollShadow>
              )}
            </CardBody>
          </Card>
        </div>

        {/* RIGHT: Order Info Panel */}
        <div className="flex flex-col gap-4">
          {/* Customer */}
          <Card className="border border-default-200 shadow-none">
            <CardHeader className="flex items-center gap-2 pb-2">
              <div className="p-1.5 rounded-md bg-blue-500/10">
                <User size={15} className="text-blue-500" />
              </div>
              <span className="font-semibold text-sm">Customer</span>
            </CardHeader>
            <Divider />
            <CardBody className="gap-1">
              <Autocomplete
                defaultItems={customers}
                label="Customer"
                placeholder="Cari dan pilih customer..."
                startContent={<User size={14} className="text-default-400" />}
                selectedKey={customerId || ""}
                onSelectionChange={(key) =>
                  setCustomerId((key as string) ?? "")
                }
                defaultFilter={(text, filterValue) =>
                  text.toLowerCase().includes(filterValue.toLowerCase())
                }
              >
                {(customer) => (
                  <AutocompleteItem
                    key={customer.id!}
                    textValue={customer.nama}
                  >
                    <p className="text-sm">{customer.nama}</p>
                  </AutocompleteItem>
                )}
              </Autocomplete>

              {/* Divider + Tambah Pelanggan Baru */}
              <div className="flex items-center gap-2">
                <Divider className="flex-1" />
                <span className="text-xs text-default-400 shrink-0">atau</span>
                <Divider className="flex-1" />
              </div>
              <AddNewCustomerInline
                onCustomerAdded={(newCustomer) => {
                  mutateCustomers();
                  setCustomerId(newCustomer.id);
                }}
              />
            </CardBody>
          </Card>

          {/* Order Detail */}
          <Card className="border border-default-200 shadow-none">
            <CardHeader className="flex items-center gap-2 pb-2">
              <div className="p-1.5 rounded-md bg-warning/10">
                <ClipboardList size={15} className="text-warning" />
              </div>
              <span className="font-semibold text-sm">Detail Pesanan</span>
            </CardHeader>
            <Divider />
            <CardBody className="gap-3">
              {/* Channel */}
              <Select
                label="Channel Pembelian"
                selectedKeys={[channel]}
                onSelectionChange={(keys) =>
                  setChannel(Array.from(keys)[0] as OrderChannel)
                }
                size="sm"
                startContent={<Zap size={14} className="text-default-400" />}
              >
                {CHANNELS.map((c) => (
                  <SelectItem key={c.key}>{c.label}</SelectItem>
                ))}
              </Select>

              {/* Deadline */}
              <DatePicker
                label="Deadline (opsional)"
                size="sm"
                minValue={parseDate(new Date().toISOString().split("T")[0])}
                value={deadline ? parseDate(deadline) : null}
                onChange={(date) => setDeadline(date ? date.toString() : "")}
                startContent={
                  <Calendar size={14} className="text-default-400" />
                }
              />

              {/* Catatan */}
              <Textarea
                label="Catatan Pesanan (opsional)"
                placeholder="Misal: warna, ukuran, instruksi khusus..."
                value={catatan}
                onValueChange={setCatatan}
                minRows={2}
                size="sm"
                startContent={
                  <FileText size={14} className="text-default-400 mt-2" />
                }
              />
            </CardBody>
          </Card>

          {/* Payment */}
          <Card className="border border-default-200 shadow-none">
            <CardHeader className="flex items-center gap-2 pb-2">
              <div className="p-1.5 rounded-md bg-success/10">
                <CreditCard size={15} className="text-success" />
              </div>
              <span className="font-semibold text-sm">Pembayaran</span>
            </CardHeader>
            <Divider />
            <CardBody className="gap-3">
              <div className="grid grid-cols-2 gap-2">
                <Select
                  label="Status Bayar"
                  selectedKeys={[statusPembayaran]}
                  onSelectionChange={(keys) =>
                    setStatusPembayaran(Array.from(keys)[0] as StatusPembayaran)
                  }
                  size="sm"
                >
                  {PAYMENT_STATUS.map((s) => (
                    <SelectItem key={s.key}>{s.label}</SelectItem>
                  ))}
                </Select>
                <Select
                  label="Metode"
                  selectedKeys={[metodePembayaran]}
                  onSelectionChange={(keys) =>
                    setMetodePembayaran(Array.from(keys)[0] as MetodePembayaran)
                  }
                  size="sm"
                >
                  {PAYMENT_METHODS.map((m) => (
                    <SelectItem key={m.key}>{m.label}</SelectItem>
                  ))}
                </Select>
              </div>

              {/* Tambahan Dropdown Rekening Kas & Input Nominal (jika bukan BELUM_BAYAR) */}
              {statusPembayaran !== "BELUM_BAYAR" && (
                <div className="flex flex-col gap-3 mt-1">
                  <Select
                    label="Simpan Ke Rekening"
                    placeholder="Pilih Kas/Bank tujuan..."
                    selectedKeys={kasBankId ? [kasBankId] : []}
                    onSelectionChange={(keys) =>
                      setKasBankId(Array.from(keys)[0] as string)
                    }
                    size="sm"
                    isRequired
                  >
                    {kasBanks.map((kb) => (
                      <SelectItem key={kb.id} textValue={kb.namaRekening}>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">
                            {kb.namaRekening}
                          </span>
                          <span className="text-xs text-default-400">
                            {kb.jenisRekening}{" "}
                            {kb.nomorRekening ? `- ${kb.nomorRekening}` : ""}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </Select>

                  {statusPembayaran === "DP" && (
                    <FormattedNumberInput
                      label="Nominal DP"
                      placeholder="Masukkan jumlah DP"
                      value={nominalBayar ?? 0}
                      onChange={(val) => {
                        setNominalBayar(Number(val));
                        setNominalDpError("");
                      }}
                      size="sm"
                      isRequired
                      isInvalid={!!nominalDpError}
                      errorMessage={nominalDpError}
                      startContent={
                        <span className="text-default-400 text-xs">Rp</span>
                      }
                    />
                  )}
                  {statusPembayaran === "LUNAS" && (
                    <div className="flex items-center justify-between px-3 py-2 bg-success-50 rounded-lg border border-success-200">
                      <span className="text-xs font-medium text-success-700">
                        Otomatis Lunas
                      </span>
                      <span className="text-sm font-bold text-success-700">
                        {formatRupiah(grandTotal)}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </CardBody>
          </Card>

          {/* Price Summary */}
          <Card className="border border-default-200 shadow-none">
            <CardHeader className="flex items-center gap-2 pb-2">
              <div className="p-1.5 rounded-md bg-red-500/10">
                <Tag size={15} className="text-red-500" />
              </div>
              <span className="font-semibold text-sm">Ringkasan Harga</span>
            </CardHeader>
            <Divider />
            <CardBody className="gap-3">
              {/* Diskon */}
              <FormattedNumberInput
                label="Diskon"
                placeholder="0"
                value={diskon}
                onChange={(v) => setDiskon(Number(v) || 0)}
                size="sm"
                startContent={
                  <span className="text-default-400 text-xs">Rp</span>
                }
              />

              {/* Ongkir */}
              <FormattedNumberInput
                label="Ongkos Kirim (opsional)"
                placeholder="0"
                value={ongkir ?? 0}
                onChange={(v) => setOngkir(v ? Number(v) : undefined)}
                size="sm"
                startContent={<Truck size={13} className="text-default-400" />}
              />

              <Divider />

              {/* Summary rows */}
              <div className="flex flex-col gap-1.5 text-sm">
                <div className="flex justify-between text-default-600">
                  <span>Subtotal ({cart.length} item)</span>
                  <span>{formatRupiah(subtotal)}</span>
                </div>
                {diskon > 0 && (
                  <div className="flex justify-between text-success">
                    <span>Diskon</span>
                    <span>- {formatRupiah(diskon)}</span>
                  </div>
                )}
                {(ongkir ?? 0) > 0 && (
                  <div className="flex justify-between text-default-600">
                    <span>Ongkir</span>
                    <span>+ {formatRupiah(ongkir!)}</span>
                  </div>
                )}
                <Divider />
                <div className="flex justify-between font-bold text-base text-default-900">
                  <span>Grand Total</span>
                  <span className="text-primary">
                    {formatRupiah(grandTotal)}
                  </span>
                </div>
              </div>

              {/* Submit */}
              <Button
                color="primary"
                size="lg"
                className="w-full font-semibold mt-1"
                startContent={<ShoppingCart size={18} />}
                isLoading={isSubmitting}
                isDisabled={cart.length === 0 || !customerId || isSubmitting}
                onPress={handleSubmit}
              >
                {isSubmitting ? "Menyimpan..." : "Simpan Pesanan"}
              </Button>

              {(cart.length === 0 || !customerId) && (
                <p className="text-xs text-center text-default-400">
                  {cart.length === 0
                    ? "Tambahkan produk ke keranjang"
                    : "Pilih customer untuk melanjutkan"}
                </p>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
