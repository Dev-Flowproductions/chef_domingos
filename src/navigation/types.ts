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
};
