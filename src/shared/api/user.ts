import { api } from './api';

export interface User {
  id: number;
  name: string;
  email: string;
  score: number;
}

export interface Pagination {
  page: number;
  per_page: number;
}

export interface PaginatedUsers {
  data: User[];
  total: number;
  totalPages: number;
  page: number;
  perPage: number;
}

export const getUsers = async (pagination: Pagination): Promise<PaginatedUsers> => {
  const response = await api.get('/users', {
    params: pagination,
  });
  return {
    data: response.data,
    total: parseInt(response.headers['x-total'] || '0', 10),
    totalPages: parseInt(response.headers['x-total-pages'] || '0', 10),
    page: parseInt(response.headers['x-page'] || '0', 10),
    perPage: parseInt(response.headers['x-per-page'] || '0', 10),
  };
};
