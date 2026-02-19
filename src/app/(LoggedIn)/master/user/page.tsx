/* eslint-disable react-hooks/preserve-manual-memoization */
"use client";
import { Input } from "@heroui/input";
import {
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell,
} from "@heroui/table";
import {
  ChevronDown,
  ChevronUp,
  Factory,
  Info,
  KeyRound,
  Mail,
  PencilRuler,
  Search,
  ShieldUser,
  User,
  Warehouse,
  X,
} from "lucide-react";
import { ROLES } from "@/config/roles";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/dropdown";
import { Button } from "@heroui/button";
import React from "react";
import { Pagination, Spinner, Tooltip, type Selection } from "@heroui/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { fetcher, getInitialName } from "@/lib/func";
import useSWR from "swr";
import { User as UserType } from "@/types/types";
import AddUserModal from "@/app/(LoggedIn)/master/user/components/add-user-modal";
import EditUserModal from "./components/edit-user-modal";
import { useTableMultipleSelection } from "@/hooks/use-table-multiple-selection";
import GoogleIcon from "@/components/google-icon";
import { useDebounce } from "@/hooks/use-debounce";
import DeleteUserModal from "./components/delete-user-modal";
import BulkDeleteModal from "./components/bulk-delete-modal";

const columns = [
  {
    key: "name",
    label: (
      <div className="flex items-center gap-2">
        <User size={16} />
        <span>NAME</span>
      </div>
    ),
  },
  {
    key: "email",
    label: (
      <div className="flex items-center gap-2">
        <Mail size={16} />
        <span>EMAIL</span>
      </div>
    ),
  },
  {
    key: "providerId",
    label: (
      <div className="flex items-center gap-2">
        <KeyRound size={16} />
        <span>PROVIDER</span>
        <Tooltip content="Provider adalah metode autentikasi yang digunakan untuk membuat account tersebut">
          <Info size={16} />
        </Tooltip>
      </div>
    ),
  },
  {
    key: "role",
    label: (
      <div className="flex items-center gap-2">
        <ShieldUser size={16} />
        <span>ROLE</span>
      </div>
    ),
  },
  {
    key: "action",
    label: "ACTION",
  },
];

export default function Page() {
  const { selectionMode } = useTableMultipleSelection(true);

  const [search, setSearch] = React.useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [selectedKeys, setSelectedKeys] = React.useState<Selection>(
    new Set([""]),
  );
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);
  const [selectedRole, setSelectedRole] = React.useState<Selection>(
    new Set(["all"]),
  );

  const handleSelectionChange = (keys: Selection) => {
    if (keys === "all") return;
    const selected = Array.from(keys)[0] as string;
    setSelectedRole(new Set([selected || "all"]));
  };

  const selectedValue = React.useMemo(() => {
    const key = Array.from(selectedRole)[0];
    if (key === "all") return "Semua";
    const found = ROLES.find((r) => r.key === key);
    return found?.label ?? "Semua";
  }, [selectedRole]);

  const handleResetFilter = () => {
    setSelectedRole(new Set(["all"]));
    setSearch("");
  };

  const [page, setPage] = React.useState(1);

  const { data, isLoading, mutate } = useSWR(
    `/api/admin/user?page=${page}&role=${Array.from(selectedRole).join(",")}&search=${debouncedSearch}`,
    fetcher,
    {
      keepPreviousData: true,
    },
  );

  const rowsPerPage = 10;

  const pages = React.useMemo(() => {
    return data?.count ? Math.ceil(data.count / rowsPerPage) : 0;
  }, [data?.count, rowsPerPage]);

  const loadingState = isLoading ? "loading" : "idle";

  const selectedUserIds = React.useMemo(() => {
    if (selectedKeys === "all") {
      return (data?.results ?? []).map((u: UserType) => u.id);
    }
    return Array.from(selectedKeys).filter((key) => key !== "");
  }, [selectedKeys, data?.results]);

  const handleBulkDeleted = () => {
    setSelectedKeys(new Set([""]));
    mutate();
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 gap-4 mb-4">
      <div>
        <h1 className="text-2xl font-bold">Daftar Pengguna</h1>
        <p className="text-muted-foreground">
          Daftar pengguna yang terdaftar di sistem
        </p>
      </div>
      <div className="flex flex-col md:flex-row gap-3 justify-between items-center">
        <Input
          placeholder="Cari pengguna"
          startContent={<Search size={14} className="text-slate-500" />}
          variant="bordered"
          isClearable
          classNames={{
            inputWrapper: "border-1",
          }}
          className="lg:w-1/3 w-full"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onClear={() => setSearch("")}
        />
        <div className="flex flex-row gap-2 items-center justify-start md:justify-between w-full">
          <div className="flex flex-row gap-2 items-center">
            <Dropdown isOpen={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
              <DropdownTrigger>
                <Button
                  className="capitalize border-1"
                  variant="bordered"
                  endContent={
                    isDropdownOpen ? (
                      <ChevronUp size={14} className="text-slate-500" />
                    ) : (
                      <ChevronDown size={14} className="text-slate-500" />
                    )
                  }
                >
                  <div className="flex items-center gap-2">
                    <User size={16} className="text-slate-500" />
                    Role
                    <span className="text-slate-300">|</span>
                    <span className="text-primary font-medium">
                      {selectedValue}
                    </span>
                  </div>
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                disallowEmptySelection
                aria-label="Single selection example"
                selectedKeys={selectedRole}
                selectionMode="single"
                variant="flat"
                onSelectionChange={handleSelectionChange}
              >
                {[
                  { key: "all", label: "Semua", icon: undefined },
                  ...ROLES.map((role) => ({
                    key: role.key,
                    label: role.label,
                    icon: (
                      {
                        admin: <ShieldUser size={16} />,
                        kasir: <User size={16} />,
                        designer: <PencilRuler size={16} />,
                        produksi: <Factory size={16} />,
                        gudang: <Warehouse size={16} />,
                      } as Record<string, React.ReactNode>
                    )[role.key],
                  })),
                ].map((item) => (
                  <DropdownItem key={item.key} startContent={item.icon}>
                    {item.label}
                  </DropdownItem>
                ))}
              </DropdownMenu>
            </Dropdown>
            {selectedValue !== "Semua" && (
              <Button
                variant="bordered"
                startContent={<X size={16} />}
                onClick={handleResetFilter}
              >
                Reset
              </Button>
            )}
          </div>
          <AddUserModal onUserCreated={() => mutate()} />
        </div>
      </div>
      {selectedUserIds.length > 0 && (
        <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-primary-50 border border-primary-200">
          <span className="text-sm font-medium text-primary">
            {selectedUserIds.length} pengguna dipilih
          </span>
          <BulkDeleteModal
            userIds={selectedUserIds as string[]}
            onDeleted={handleBulkDeleted}
          />
        </div>
      )}
      <div className="w-full max-w-full overflow-x-auto flex-1">
        <Table
          aria-label="Example static collection table"
          selectionMode={selectionMode}
          color="primary"
          onSelectionChange={setSelectedKeys}
          selectedKeys={selectedKeys}
          removeWrapper
        >
          <TableHeader columns={columns}>
            {(column) => (
              <TableColumn key={column.key}>{column.label}</TableColumn>
            )}
          </TableHeader>
          <TableBody
            emptyContent={"Tidak ada data"}
            items={data?.results ?? []}
            loadingContent={<Spinner />}
            loadingState={loadingState}
          >
            {(user: UserType) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="flex items-center gap-2 font-medium">
                    <Avatar>
                      <AvatarImage src={user.image || ""} alt={user.name} />
                      <AvatarFallback>
                        {getInitialName(user.name)}
                      </AvatarFallback>
                    </Avatar>
                    {user.name}
                  </div>
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <div className="flex flex-col gap-2">
                    {user.accounts.map((account, index) =>
                      account.providerId === "google" ? (
                        <div
                          key={index}
                          className="flex items-center gap-2 px-3 py-2 rounded-md bg-slate-100 dark:bg-slate-800 text-sm text-slate-600 w-max"
                        >
                          <GoogleIcon />
                          <span>Google</span>
                        </div>
                      ) : account.providerId === "credential" ? (
                        <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-slate-100 dark:bg-slate-800 text-sm text-slate-600 w-max">
                          <KeyRound size={16} />
                          <span>Email & Password</span>
                        </div>
                      ) : null,
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {(() => {
                    const roleConfig: Record<
                      string,
                      {
                        icon: React.ReactNode;
                        label: string;
                        bg: string;
                        text: string;
                      }
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
                    const cfg = roleConfig[user.role as string] ?? {
                      icon: null,
                      label: user.role,
                      bg: "bg-slate-100 dark:bg-slate-800",
                      text: "text-slate-600 dark:text-slate-400",
                    };
                    return (
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}
                      >
                        {cfg.icon}
                        {cfg.label}
                      </span>
                    );
                  })()}
                </TableCell>
                <TableCell>
                  <div className="flex flex-row gap-2">
                    <EditUserModal onUserEdited={() => mutate()} user={user} />
                    <DeleteUserModal
                      onUserDeleted={() => mutate()}
                      user={user}
                    />
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {pages > 0 ? (
        <div className="flex w-full justify-center">
          <Pagination
            isCompact
            showControls
            showShadow
            color="primary"
            page={page}
            total={pages}
            onChange={(page) => setPage(page)}
          />
        </div>
      ) : null}
    </div>
  );
}
