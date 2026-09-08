export type AuthUser = {
  sub: string;
  phone: string;
  role: 'user' | 'super_admin';
};
