export type PayloadForSocketClient = {
  sub: string;
  email: string;
  emailToggle: boolean;
  userUpdates: boolean;
  scheduling: boolean;
  userRegistration: boolean;
  contentStatus: boolean;
};
