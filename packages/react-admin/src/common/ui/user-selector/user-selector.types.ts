export interface User {
  id: string;
  name?: string;
  email?: string;
  createdAt: string;
}

export interface UserListResponse {
  items: User[];
  totalItems?: number;
  page?: number;
  limit?: number;
}
