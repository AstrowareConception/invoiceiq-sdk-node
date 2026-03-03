import { TransformationsResource } from '../resources/transformations';
import { HttpClient } from '../client';
import { InvoiceMetadata } from '../types';
import nock from 'nock';

describe('TransformationsResource', () => {
  let client: HttpClient;
  let transformations: TransformationsResource;
  const baseUrl = 'https://api.invoiceiq.fr';

  beforeEach(() => {
    client = new HttpClient({ baseUrl, apiKey: 'test-key' });
    transformations = new TransformationsResource(client);
  });

  afterEach(() => {
    nock.cleanAll();
  });

  describe('list', () => {
    it('should list transformations', async () => {
      const mockResponse = {
        data: [
          { id: 't_1', status: 'completed', createdAt: '2024-02-22T10:00:00Z' },
        ],
        total: 1,
        page: 1,
        limit: 10,
      };

      nock(baseUrl).get('/api/v1/transformations').reply(200, mockResponse);

      const result = await transformations.list();
      expect(result.data).toHaveLength(1);
    });
  });

  describe('get', () => {
    it('should get a specific transformation', async () => {
      const mockJob = {
        id: 't_123',
        status: 'completed',
        createdAt: '2024-02-22T10:00:00Z',
        downloadUrl: 'https://cdn.example.com/facturx.pdf',
      };

      nock(baseUrl).get('/api/v1/transformations/t_123').reply(200, mockJob);

      const result = await transformations.get('t_123');
      expect(result.id).toBe('t_123');
      expect(result.status).toBe('completed');
    });
  });

  describe('createFromBuffer', () => {
    it('should create transformation from buffer with metadata', async () => {
      const buffer = Buffer.from('fake-pdf-content');
      const metadata: InvoiceMetadata = {
        invoiceNumber: 'INV-2024-001',
        issueDate: '2024-02-22',
        currency: 'EUR',
        seller: {
          name: 'Test Corp',
          countryCode: 'FR',
        },
        buyer: {
          name: 'Client',
          countryCode: 'FR',
        },
        totalTaxExclusiveAmount: 100,
        totalTaxInclusiveAmount: 120,
        taxTotalAmount: 20,
      };

      const mockJob = {
        id: 't_new',
        status: 'pending',
        createdAt: '2024-02-22T10:00:00Z',
      };

      nock(baseUrl)
        .post('/api/v1/transformations')
        .reply(202, mockJob);

      const result = await transformations.createFromBuffer(buffer, 'test.pdf', metadata);
      expect(result.id).toBe('t_new');
      expect(result.status).toBe('pending');
    });

    it('should support idempotency key', async () => {
      const buffer = Buffer.from('fake-pdf-content');
      const metadata: InvoiceMetadata = {
        invoiceNumber: 'INV-2024-001',
        issueDate: '2024-02-22',
        seller: { name: 'Test', countryCode: 'FR' },
        buyer: { name: 'Client', countryCode: 'FR' },
        totalTaxExclusiveAmount: 100,
        totalTaxInclusiveAmount: 120,
        taxTotalAmount: 20,
      };

      nock(baseUrl)
        .post('/api/v1/transformations')
        .matchHeader('Idempotency-Key', 'unique-key-123')
        .reply(202, { id: 't_idempotent', status: 'pending' });

      const result = await transformations.createFromBuffer(buffer, 'test.pdf', metadata, {
        idempotencyKey: 'unique-key-123',
      });

      expect(result.id).toBe('t_idempotent');
    });
  });

  describe('waitForCompletion', () => {
    it('should poll until transformation is complete', async () => {
      nock(baseUrl)
        .get('/api/v1/transformations/t_123')
        .reply(200, { id: 't_123', status: 'processing' });

      nock(baseUrl)
        .get('/api/v1/transformations/t_123')
        .reply(200, { id: 't_123', status: 'completed', downloadUrl: 'https://example.com/file.pdf' });

      const result = await transformations.waitForCompletion('t_123', { pollInterval: 100 });
      expect(result.status).toBe('completed');
    });
  });
});
