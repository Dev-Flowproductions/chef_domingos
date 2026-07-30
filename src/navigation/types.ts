import type { RestaurantId } from '../lib/menuI18n';

export type HomeStackParamList = {
  HomeMain: undefined;
  Menu: { restaurantId: RestaurantId };
};

export type ProfileStackParamList = {
  ProfileHome: undefined;
  EditProfile: undefined;
  Notifications: undefined;
  Help: undefined;
  Terms: undefined;
  Privacy: undefined;
  StaffHub: undefined;
  StaffValidate: undefined;
  AdminOffers: undefined;
  AdminMenu: undefined;
};

export type RewardsStackParamList = {
  RewardsMain: undefined;
  MyVouchers: undefined;
};
