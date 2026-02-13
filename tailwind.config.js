import { heroui } from "@heroui/theme";

/** @type {import('tailwindcss').Config} */
export const content = [
  "./node_modules/@heroui/theme/dist/components/(alert|button|divider|dropdown|input|kbd|listbox|modal|pagination|select|skeleton|table|toast|ripple|spinner|menu|popover|form|checkbox).js",
];
export const theme = {
  extend: {},
};
export const darkMode = "class";
export const plugins = [heroui()];
