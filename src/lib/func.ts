export function normalizeName(name: string) {
  return name
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[^a-zA-Z\s'-]/g, "")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export const VALID_DOMAINS = () => {
  const domains = ["gmail.com", "yahoo.com", "outlook.com"];

  if (process.env.NODE_ENV === "development") {
    domains.push("example.com");
  }

  return domains;
};

export const getInitialName = (name: string) => {
  const words = name.split(" ");
  return words.map((word) => word.charAt(0).toUpperCase()).join("");
};

export const fetcher = (url: string) => fetch(url).then((res) => res.json());
