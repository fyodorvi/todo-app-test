import type { NominatimAddress } from "@/api/nominatim";
import type { TodoLocation } from "@/api/todos";

export function formatShortAddress(address: NominatimAddress): string {
  const streetParts = [address.house_number, address.road].filter(Boolean);
  const street = streetParts.join(" ").trim();

  const suburb =
    address.suburb ??
    address.neighbourhood ??
    address.town ??
    address.village ??
    address.city ??
    address.county;

  if (street && suburb) {
    return `${street}, ${suburb}`;
  }

  return street || suburb || "";
}

export function formatShortAddressFromText(text: string): string {
  const parts = text
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length <= 3) {
    return text;
  }

  const streetPart = parts.slice(0, 2).join(", ");
  const suburbPart = parts[2];

  return suburbPart ? `${streetPart}, ${suburbPart}` : streetPart;
}

export function getDisplayAddress(location: TodoLocation): string {
  if (location.shortText) {
    return location.shortText;
  }

  return formatShortAddressFromText(location.text);
}
