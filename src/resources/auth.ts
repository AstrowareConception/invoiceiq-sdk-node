import { HttpClient } from '../client';
import { AuthResponse, RegisterPayload, LoginPayload } from '../types';

export class AuthResource {
  constructor(private client: HttpClient) {}

  async register(payload: RegisterPayload): Promise<AuthResponse> {
    return this.client.request<AuthResponse>('POST', '/api/v1/auth/register', {
      body: payload,
    });
  }

  async login(payload: LoginPayload): Promise<AuthResponse> {
    const response = await this.client.request<AuthResponse>('POST', '/api/v1/auth/login', {
      body: payload,
    });

    // Auto-configure le client avec le token reçu
    if (response.token) {
      this.client.setBearerToken(response.token);
    }

    return response;
  }
}
