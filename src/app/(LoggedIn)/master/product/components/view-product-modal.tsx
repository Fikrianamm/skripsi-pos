import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@heroui/modal";
import { Button } from "@heroui/button";
import { Chip, Divider } from "@heroui/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Product } from "@/types/types";

function formatRupiah(value: number | string) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(Number(value));
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex justify-between items-center py-2">
      <span className="text-sm text-default-500">{label}</span>
      <span className="text-sm font-medium text-right max-w-[60%]">
        {value}
      </span>
    </div>
  );
}

export default function ViewProductModal({
  product,
  isOpen,
  onOpenChange,
}: {
  product: Product;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const stok = Number(product.stok ?? 0);
  const minStok = Number(product.minStok ?? 0);

  function getStockStatus() {
    if (product.isService) return null;
    if (stok <= 0)
      return (
        <Chip color="danger" size="sm" variant="flat">
          Habis
        </Chip>
      );
    if (stok <= minStok)
      return (
        <Chip color="warning" size="sm" variant="flat">
          Menipis
        </Chip>
      );
    return (
      <Chip color="success" size="sm" variant="flat">
        Aman
      </Chip>
    );
  }

  const margin =
    product.hargaJual > 0 && product.hpp > 0
      ? (
          ((Number(product.hargaJual) - Number(product.hpp)) /
            Number(product.hargaJual)) *
          100
        ).toFixed(1)
      : null;

  return (
    <Modal
      isOpen={isOpen}
      placement="bottom-center"
      onOpenChange={onOpenChange}
      scrollBehavior="inside"
      size="xl"
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col">Detail Produk</ModalHeader>

            <ModalBody className="pb-2">
              {/* Header produk */}
              <div className="flex items-center gap-4 mb-2">
                <Avatar className="size-16 rounded-lg">
                  <AvatarImage
                    src={product.image || ""}
                    alt={product.nama}
                    className="object-contain"
                  />
                  <AvatarFallback className="rounded-lg text-base font-semibold">
                    {product.sku.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-base leading-tight">
                    {product.nama}
                  </p>
                  <p className="text-sm text-default-400">{product.sku}</p>
                  <div className="flex gap-2 mt-1">
                    <Chip
                      size="sm"
                      variant="flat"
                      color={product.isService ? "secondary" : "default"}
                    >
                      {product.isService ? "Jasa" : "Produk"}
                    </Chip>
                    {getStockStatus()}
                  </div>
                </div>
              </div>

              <Divider />

              {/* Informasi umum */}
              <div>
                <p className="text-xs font-semibold text-default-400 uppercase mt-2 mb-1">
                  Informasi
                </p>
                <DetailRow
                  label="Kategori"
                  value={product.category?.nama ?? "-"}
                />
                <DetailRow label="Satuan" value={product.unit?.nama ?? "-"} />
                <DetailRow
                  label="Tipe"
                  value={product.isService ? "Jasa" : "Produk Fisik"}
                />
              </div>

              <Divider />

              {/* Harga */}
              <div>
                <p className="text-xs font-semibold text-default-400 uppercase mt-2 mb-1">
                  Harga
                </p>
                <DetailRow
                  label="HPP (Modal)"
                  value={formatRupiah(product.hpp)}
                />
                <DetailRow
                  label="Harga Jual"
                  value={formatRupiah(product.hargaJual)}
                />
                {margin !== null && (
                  <DetailRow
                    label="Margin"
                    value={
                      <span className="text-success font-semibold">
                        {margin}%
                      </span>
                    }
                  />
                )}
              </div>

              {/* Stok (hanya produk fisik) */}
              {!product.isService && (
                <>
                  <Divider />
                  <div>
                    <p className="text-xs font-semibold text-default-400 uppercase mt-2 mb-1">
                      Stok
                    </p>
                    <DetailRow label="Stok Saat Ini" value={stok} />
                    <DetailRow label="Min. Stok" value={minStok} />
                  </div>

                  {product.bahanBakuList && product.bahanBakuList.length > 0 && (
                    <>
                      <Divider />
                      <div>
                        <p className="text-xs font-semibold text-default-400 uppercase mt-2 mb-1">
                          Resep Bahan Baku (BOM)
                        </p>
                        <div className="flex flex-col gap-0">
                          {product.bahanBakuList.map((bb, idx) => (
                            <DetailRow 
                              key={idx} 
                              label={bb.bahanBaku?.nama || "-"} 
                              value={`${Number(bb.jumlahButuh)} ${bb.bahanBaku?.unit?.nama || ""}`} 
                            />
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </>
              )}
            </ModalBody>

            <ModalFooter>
              <Button color="primary" variant="flat" onPress={onClose}>
                Tutup
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
