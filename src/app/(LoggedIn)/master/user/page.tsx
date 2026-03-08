"use client";
import React from "react";
import { TableCell, TableRow } from "@heroui/table";
import { Button } from "@heroui/button";
import { type Selection } from "@heroui/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Factory,
  KeyRound,
  MoreVertical,
  PencilRuler,
  PenLine,
  ShieldUser,
  Trash2,
  User,
  Warehouse,
} from "lucide-react";
import { ROLES } from "@/config/roles";
import { fetcher, getInitialName } from "@/lib/func";
import useSWR from "swr";
import { User as UserType } from "@/types/types";
import AddUserModal from "./components/add-user-modal";
import EditUserModal from "./components/edit-user-modal";
import DeleteUserModal from "./components/delete-user-modal";
import BulkDeleteModal from "./components/bulk-delete-modal";
import GoogleIcon from "@/components/google-icon";
import { useTableMultipleSelection } from "@/hooks/use-table-multiple-selection";
import { useDebounce } from "@/hooks/use-debounce";
import { useContextMenu } from "@/hooks/use-context-menu";
import { PageHeader } from "@/components/page-header";
import { SearchInput } from "@/components/search-input";
import { FilterDropdown, type FilterItem } from "@/components/filter-dropdown";
import { ContextMenu } from "@/components/data-table/context-menu";
import { BulkSelectionBar } from "@/components/data-table/bulk-selection-bar";
import { DataTable } from "@/components/data-table/data-table";
import { TablePagination } from "@/components/data-table/table-pagination";
import { columns } from "./components/columns";

const ROLE_CONFIG: Record<
  string,
  { icon: React.ReactNode; label: string; bg: string; text: string }
> = {
  admin: {
    icon: <ShieldUser size={14} />,
    label: "Administrator",
    bg: "bg-red-100 dark:bg-red-900/30",
    text: "text-red-700 dark:text-red-400",
  },
  kasir: {
    icon: <User size={14} />,
    label: "Kasir",
    bg: "bg-blue-100 dark:bg-blue-900/30",
    text: "text-blue-700 dark:text-blue-400",
  },
  designer: {
    icon: <PencilRuler size={14} />,
    label: "Designer",
    bg: "bg-purple-100 dark:bg-purple-900/30",
    text: "text-purple-700 dark:text-purple-400",
  },
  produksi: {
    icon: <Factory size={14} />,
    label: "Produksi",
    bg: "bg-amber-100 dark:bg-amber-900/30",
    text: "text-amber-700 dark:text-amber-400",
  },
  gudang: {
    icon: <Warehouse size={14} />,
    label: "Gudang",
    bg: "bg-emerald-100 dark:bg-emerald-900/30",
    text: "text-emerald-700 dark:text-emerald-400",
  },
};

const ROLE_FILTER_ITEMS: FilterItem[] = [
  { key: "all", label: "Semua" },
  ...ROLES.map((r) => ({ key: r.key, label: r.label })),
];

const ROWS_PER_PAGE = 10;

export default function Page() {
  const { selectionMode } = useTableMultipleSelection(true);
  const [search, setSearch] = React.useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [selectedKeys, setSelectedKeys] = React.useState<Selection>(
    new Set([""]),
  );
  const [selectedRole, setSelectedRole] = React.useState<Selection>(
    new Set(["all"]),
  );
  const [page, setPage] = React.useState(1);

  const [editUser, setEditUser] = React.useState<UserType | null>(null);
  const [deleteUser, setDeleteUser] = React.useState<UserType | null>(null);
  const { contextMenu, openMenu, openMenuFromButton, closeMenu } =
    useContextMenu<UserType>();

  const roleKey = Array.from(selectedRole)[0] as string;

  const { data, isLoading, mutate } = useSWR(
    `/api/admin/user?page=${page}&role=${roleKey}&search=${debouncedSearch}`,
    fetcher,
    { keepPreviousData: true },
  );

  const pages = React.useMemo(
    () => (data?.count ? Math.ceil(data.count / ROWS_PER_PAGE) : 0),
    [data?.count],
  );

  const selectedUserIds = React.useMemo(() => {
    if (selectedKeys === "all")
      return (data?.results ?? []).map((u: UserType) => u.id);
    return Array.from(selectedKeys).filter((k) => k !== "");
  }, [selectedKeys, data?.results]);

  const selectedRoleLabel = React.useMemo(() => {
    if (roleKey === "all") return "Semua";
    return ROLES.find((r) => r.key === roleKey)?.label ?? "Semua";
  }, [roleKey]);

  return (
    <div className="flex flex-col flex-1 min-h-0 gap-4 mb-4">
      <PageHeader
        title="Manajemen Pengguna"
        description="Kelola akun, peran, dan hak akses seluruh pengguna sistem."
      />

      <div className="flex flex-col md:flex-row gap-3 justify-between items-center border-t border-default-200 pt-4">
        <SearchInput
          value={search}
          placeholder="Cari pengguna"
          onChange={setSearch}
          onClear={() => setSearch("")}
        />
        <div className="flex flex-row gap-2 items-center justify-start md:justify-between w-full">
          <FilterDropdown
            label="Role"
            icon={<ShieldUser size={16} />}
            items={ROLE_FILTER_ITEMS}
            selectedKeys={selectedRole}
            selectedLabel={selectedRoleLabel}
            onSelectionChange={(keys) => {
              if (keys === "all") return;
              const sel = Array.from(keys)[0] as string;
              setSelectedRole(new Set([sel || "all"]));
            }}
            onReset={() => {
              setSelectedRole(new Set(["all"]));
              setSearch("");
            }}
          />
          <AddUserModal onUserCreated={() => mutate()} />
        </div>
      </div>

      <BulkSelectionBar count={selectedUserIds.length} label="pengguna dipilih">
        <BulkDeleteModal
          userIds={selectedUserIds as string[]}
          onDeleted={() => {
            setSelectedKeys(new Set([""]));
            mutate();
          }}
        />
      </BulkSelectionBar>

      <DataTable<UserType>
        columns={columns}
        items={(data?.results ?? []) as UserType[]}
        isLoading={isLoading}
        selectionMode={selectionMode}
        selectedKeys={selectedKeys}
        onSelectionChange={setSelectedKeys}
        renderRow={(user) => {
          const cfg = ROLE_CONFIG[user.role as string] ?? {
            icon: null,
            label: user.role,
            bg: "bg-slate-100 dark:bg-slate-800",
            text: "text-slate-600 dark:text-slate-400",
          };
          return (
            <TableRow
              key={user.id}
              onContextMenu={(e) => openMenu(e, user)}
              className="cursor-context-menu"
            >
              <TableCell>
                <div className="flex items-center gap-2 font-medium">
                  <Avatar>
                    <AvatarImage src={user.image || ""} alt={user.name} />
                    <AvatarFallback>{getInitialName(user.name)}</AvatarFallback>
                  </Avatar>
                  {user.name}
                </div>
              </TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>
                <div className="flex flex-col gap-1">
                  {user.accounts.map((account, i) =>
                    account.providerId === "google" ? (
                      <div
                        key={i}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-slate-100 dark:bg-slate-800 text-sm text-slate-600 w-max"
                      >
                        <GoogleIcon />
                        <span>Google</span>
                      </div>
                    ) : account.providerId === "credential" ? (
                      <div
                        key={i}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-slate-100 dark:bg-slate-800 text-sm text-slate-600 w-max"
                      >
                        <KeyRound size={16} />
                        <span>Email & Password</span>
                      </div>
                    ) : null,
                  )}
                </div>
              </TableCell>
              <TableCell>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}
                >
                  {cfg.icon}
                  {cfg.label}
                </span>
              </TableCell>
              <TableCell className="md:hidden">
                <Button
                  className="p-1.5 rounded-md hover:bg-accent"
                  onClick={(e) => openMenuFromButton(e, user)}
                  isIconOnly
                  variant="light"
                >
                  <MoreVertical size={16} />
                </Button>
              </TableCell>
            </TableRow>
          );
        }}
      />

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          actions={[
            {
              label: "Edit",
              icon: <PenLine size={16} />,
              variant: "primary",
              onClick: () => {
                setEditUser(contextMenu.item);
                closeMenu();
              },
            },
            {
              label: "Hapus",
              icon: <Trash2 size={16} />,
              variant: "destructive",
              onClick: () => {
                setDeleteUser(contextMenu.item);
                closeMenu();
              },
            },
          ]}
        />
      )}

      {editUser && (
        <EditUserModal
          key={`edit-${editUser.id}`}
          user={editUser}
          onUserEdited={() => {
            mutate();
            setEditUser(null);
          }}
          isOpen
          onOpenChange={(open) => {
            if (!open) setEditUser(null);
          }}
        />
      )}
      {deleteUser && (
        <DeleteUserModal
          key={`delete-${deleteUser.id}`}
          user={deleteUser}
          onUserDeleted={() => {
            mutate();
            setDeleteUser(null);
          }}
          isOpen
          onOpenChange={(open) => {
            if (!open) setDeleteUser(null);
          }}
        />
      )}

      <TablePagination page={page} total={pages} onChange={setPage} />
    </div>
  );
}
