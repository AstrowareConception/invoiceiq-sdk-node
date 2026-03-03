import { HttpClient } from '../client';
import nock from 'nock';

describe('HttpClient', () => {
  let client: HttpClient;
  const baseUrl = 'https://api.invoiceiq.fr';

  beforeEach(() => {
    client = new HttpClient({ baseUrl });
  });

  afterEach(() => {
    nock.cleanAll();
  });

  describe('Authentication', () => {
    it('should send API key in headers', async () => {
      client.setApiKey('test-api-key');

      nock(baseUrl)
        .get('/test')
        .matchHeader('X-API-KEY', 'test-api-key')
        .reply(200, { success: true });

      const result = await client.request<{ success: boolean }>('GET', '/test');
      expect(result.success).toBe(true);
    });

    it('should send Bearer token in headers', async () => {
      client.setBearerToken('test-token');

      nock(baseUrl)
        .get('/test')
        .matchHeader('Authorization', 'Bearer test-token')
        .reply(200, { success: true });

      const result = await client.request<{ success: boolean }>('GET', '/test');
      expect(result.success).toBe(true);
    });

    it('should prioritize Bearer token over API key', async () => {
      client.setApiKey('test-api-key');
      client.setBearerToken('test-token');

      nock(baseUrl)
        .get('/test')
        .matchHeader('Authorization', 'Bearer test-token')
        .reply(200, { success: true });

      const result = await client.request<{ success: boolean }>('GET', '/test');
      expect(result.success).toBe(true);
    });
  });

  describe('Request methods', () => {
    it('should handle GET requests', async () => {
      nock(baseUrl).get('/validations').reply(200, { data: [] });

      const result = await client.request<{ data: any[] }>('GET', '/validations');
      expect(result.data).toEqual([]);
    });

    it('should handle POST requests with body', async () => {
      const payload = { email: 'test@example.com', password: 'pass123' };

      nock(baseUrl).post('/api/v1/auth/login', payload).reply(200, { token: 'abc123' });

      const result = await client.request<{ token: string }>('POST', '/api/v1/auth/login', {
        body: payload,
      });

      expect(result.token).toBe('abc123');
    });

    it('should handle query parameters', async () => {
      nock(baseUrl).get('/validations?page=1&limit=10').reply(200, { data: [] });

      const result = await client.request<{ data: any[] }>('GET', '/validations', {
        query: { page: '1', limit: '10' },
      });

      expect(result.data).toEqual([]);
    });

    it('should handle error responses', async () => {
      nock(baseUrl).get('/validations').reply(401, { error: 'Unauthorized' });

      await expect(client.request('GET', '/validations')).rejects.toThrow('401');
    });
  });
});
