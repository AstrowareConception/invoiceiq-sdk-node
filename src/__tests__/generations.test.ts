import { GenerationsResource } from '../resources/generations';
import { HttpClient } from '../client';
import { InvoiceMetadata } from '../types';
import * as nock from 'nock';

describe('GenerationsResource', () => {
  let client: HttpClient;
  let generations: GenerationsResource;
  const baseUrl = 'https://api.invoiceiq.fr';

  beforeEach(() => {
    client = new HttpClient({ baseUrl, apiKey: 'test-key' });
    generations = new GenerationsResource(client);
  });

  afterEach(() => {
    nock.cleanAll();
  });

  describe('create', () => {
    it('should create a generation from metadata', async () => {
      const metadata: InvoiceMetadata = {
        invoiceNumber: 'F-2024-00125',
        issueDate: '2024-02-15',
        currency: 'EUR',
        seller: {
          name: 'Test Company',
          countryCode: 'FR',
          vatId: 'FR123456789',
        },
        buyer: {
          name: 'Client Corp',
          countryCode: 'FR',
        },
        lines: [
          {
            id: '1',
            name: 'Service',
            quantity: 1,
            netPrice: 100,
            totalAmount: 100,
          },
        ],
        totalTaxExclusiveAmount: 100,
        taxTotalAmount: 20,
        totalTaxInclusiveAmount: 120,
        rendering: {
          template: 'classic-01',
          primaryColor: '#0F172A',
        },
      };

      const mockJob = {
        id: 'g_new',
        status: 'pending',
        createdAt: '2024-02-22T10:00:00Z',
      };

      nock(baseUrl).post('/api/v1/generations', metadata).reply(202, mockJob);

      const result = await generations.create(metadata);
      expect(result.id).toBe('g_new');
      expect(result.status).toBe('pending');
    });

    it('should support idempotency key', async () => {
      const metadata: InvoiceMetadata = {
        invoiceNumber: 'F-2024-001',
        issueDate: '2024-02-22',
        seller: { name: 'Test', countryCode: 'FR' },
        buyer: { name: 'Client', countryCode: 'FR' },
        totalTaxExclusiveAmount: 100,
        totalTaxInclusiveAmount: 120,
        taxTotalAmount: 20,
      };

      nock(baseUrl)
        .post('/api/v1/generations')
        .matchHeader('Idempotency-Key', 'gen-key-123')
        .reply(202, { id: 'g_idempotent', status: 'pending' });

      const result = await generations.create(metadata, { idempotencyKey: 'gen-key-123' });
      expect(result.id).toBe('g_idempotent');
    });
  });

  describe('list', () => {
    it('should list generations', async () => {
      const mockResponse = {
        data: [{ id: 'g_1', status: 'completed' }],
        total: 1,
        page: 1,
        limit: 10,
      };

      nock(baseUrl).get('/api/v1/generations').reply(200, mockResponse);

      const result = await generations.list();
      expect(result.data).toHaveLength(1);
    });
  });

  describe('get', () => {
    it('should get a specific generation', async () => {
      const mockJob = {
        id: 'g_123',
        status: 'completed',
        createdAt: '2024-02-22T10:00:00Z',
        downloadUrl: 'https://cdn.example.com/invoice.pdf',
      };

      nock(baseUrl).get('/api/v1/generations/g_123').reply(200, mockJob);

      const result = await generations.get('g_123');
      expect(result.id).toBe('g_123');
      expect(result.status).toBe('completed');
    });
  });

  describe('waitForCompletion', () => {
    it('should poll until generation is complete', async () => {
      nock(baseUrl).get('/api/v1/generations/g_123').reply(200, { id: 'g_123', status: 'processing' });

      nock(baseUrl)
        .get('/api/v1/generations/g_123')
        .reply(200, { id: 'g_123', status: 'completed', downloadUrl: 'https://example.com/file.pdf' });

      const result = await generations.waitForCompletion('g_123', { pollInterval: 100 });
      expect(result.status).toBe('completed');
    });
  });
});
