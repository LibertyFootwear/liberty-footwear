/**
 * Client-safe user types/constants — do not import DB modules from Client Components.
 */

export interface Notifications {
  specialOffers: boolean;
  newsletter: boolean;
  blog: boolean;
  newProducts: boolean;
}

export const defaultNotifications: Notifications = {
  specialOffers: true,
  newsletter: true,
  blog: true,
  newProducts: true,
};

export interface Address {
  line1: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

export interface SavedAddress extends Address {
  id: string;
  label: string;
  isDefault?: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  passwordHash: string;
  favorites: string[];
  newsletter: boolean;
  notifications: Notifications;
  address?: Address;
  addresses: SavedAddress[];
  createdAt: string;
}
