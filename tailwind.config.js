import { heroui } from "@heroui/theme";

/** @type {import('tailwindcss').Config} */
export const content = [
  "./node_modules/@heroui/theme/dist/components/(alert|button|chip|divider|dropdown|input|kbd|modal|pagination|skeleton|table|toast|ripple|spinner|menu|popover|form|checkbox).js",
];
export const theme = {
  extend: {},
};
export const darkMode = "class";
export const plugins = [heroui()];
