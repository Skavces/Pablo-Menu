export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  isActive: boolean;
  order: number;
  categoryId: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  order: number;
  isActive: boolean;
  products: Product[];
}

export interface LoginResponse {
  accessToken: string;
}

export interface LoginRequiresTotp {
  requiresTotp: true;
  preAuthToken: string;
}
