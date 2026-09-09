export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: string;
  created_at: string;
}

export interface CreateUserPayload {
  name: string;
  email: string;
  password: string;
  role: string;
}