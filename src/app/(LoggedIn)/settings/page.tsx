"use client";
import { Button } from "@heroui/button";
import { ChevronDown, ChevronUp, User, Shield, LucideIcon } from "lucide-react";
import React, { useState, useMemo } from "react";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/dropdown";
import type { Selection } from "@heroui/react";
import ProfileSection from "./profile/profile-section";
import SecuritySection from "./security/security-section";
import WebSettingSection from "./web-setting/web-setting-section";
import { Settings } from "lucide-react";
import { authClient } from "@/lib/auth-client";

// Menu items configuration
const menuItems: { key: string; label: string; icon: LucideIcon }[] = [
  { key: "profile", label: "Profil", icon: User },
  { key: "security", label: "Keamanan", icon: Shield },
  { key: "web-setting", label: "Web Setting", icon: Settings },
];

export default function Page() {
  const { data: sessionData } = authClient.useSession();
  const role = sessionData?.user?.role ?? "";
  const [selectedKeys, setSelectedKeys] = useState<Selection>(
    new Set(["profile"]),
  );
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const selectedItem = useMemo(() => {
    const selectedKey = Array.from(selectedKeys)[0] as string;
    return menuItems.find((item) => item.key === selectedKey) || menuItems[0];
  }, [selectedKeys]);

  const SelectedIcon = selectedItem.icon;

  return (
    <>
      <div>
        <h1 className="text-2xl font-bold">Pengaturan</h1>
        <p className="text-muted-foreground">
          Sesuaikan informasi akun, keamanan, dan preferensi pribadi Anda.
        </p>
      </div>

      <div className="grid md:grid-cols-4 grid-cols-1 gap-6">
        {/* Desktop Sidebar */}
        <div className="hidden md:flex flex-col gap-2">
          {menuItems.filter((item) => role === "admin" || item.key !== "web-setting").map((item) => (
            <Button
              key={item.key}
              radius="sm"
              startContent={<item.icon size={14} />}
              className="w-full justify-start hover:bg-slate-100 bg-transparent data-[active=true]:bg-slate-100"
              onClick={() => setSelectedKeys(new Set([item.key]))}
              data-active={selectedItem.key === item.key}
            >
              {item.label}
            </Button>
          ))}
        </div>

        {/* Dropdown Show on Mobile View */}
        <Dropdown onOpenChange={setIsDropdownOpen}>
          <DropdownTrigger className="md:hidden w-full">
            <Button
              className="capitalize flex justify-start w-full"
              variant="bordered"
              startContent={<SelectedIcon size={14} />}
              endContent={
                isDropdownOpen ? (
                  <ChevronUp className="ml-auto" size={14} />
                ) : (
                  <ChevronDown className="ml-auto" size={14} />
                )
              }
            >
              {selectedItem.label}
            </Button>
          </DropdownTrigger>
          <DropdownMenu
            disallowEmptySelection
            aria-label="Menu pengaturan"
            selectedKeys={selectedKeys}
            selectionMode="single"
            variant="bordered"
            onSelectionChange={setSelectedKeys}
          >
            {menuItems.map((item) => (
              <DropdownItem
                key={item.key}
                startContent={<item.icon size={14} />}
              >
                {item.label}
              </DropdownItem>
            ))}
          </DropdownMenu>
        </Dropdown>

        <div className="col-span-3 space-y-2">
          {selectedItem.key === "profile" && <ProfileSection />}
          {selectedItem.key === "security" && <SecuritySection />}
          {selectedItem.key === "web-setting" && (
            <WebSettingSection />
          )}
        </div>
      </div>
    </>
  );
}
