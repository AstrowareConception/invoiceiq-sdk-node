import { ValidationsResource } from '../resources/validations';
import { HttpClient } from '../client';
import * as nock from 'nock';
import * as path from 'path';

describe('ValidationsResource', () => {
  let client: HttpClient;
  let validations: ValidationsResource;
  const baseUrl = 'https://api.invoiceiq.fr';

  beforeEach(() => {
    client = new HttpClient({ baseUrl, apiKey: 'test-key' });
    validations = new ValidationsResource(client);
  });

  afterEach(() => {
    nock.cleanAll();
  });

  describe('list', () => {
    it('should list validations', async () => {
      const mockResponse = {
        data: [
          { id: '1', status: 'completed', createdAt: '2024-02-22T10:00:00Z' },
          { id: '2', status: 'pending', createdAt: '2024-02-22T11:00:00Z' },
        ],
        total: 2,
        page: 1,
        limit: 10,
      };

      nock(baseUrl).get('/v1/validations').reply(200, mockResponse);

      const result = await validations.list();
      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
    });

    it('should support pagination', async () => {
      const mockResponse = { data: [], total: 0, page: 2, limit: 5 };

      nock(baseUrl).get('/v1/validations?page=2&limit=5').reply(200, mockResponse);

      const result = await validations.list({ page: 2, limit: 5 });
      expect(result.page).toBe(2);
      expect(result.limit).toBe(5);
    });
  });

  describe('get', () => {
    it('should get a specific validation', async () => {
      const mockJob = {
        id: 'val_123',
        status: 'completed',
        createdAt: '2024-02-22T10:00:00Z',
        downloadUrl: 'https://cdn.example.com/result.pdf',
      };

      nock(baseUrl).get('/v1/validations/val_123').reply(200, mockJob);

      const result = await validations.get('val_123');
      expect(result.id).toBe('val_123');
      expect(result.status).toBe('completed');
    });
  });

  describe('waitForCompletion', () => {
    it('should poll until completion', async () => {
      nock(baseUrl)
        .get('/v1/validations/val_123')
        .reply(200, { id: 'val_123', status: 'processing' });

      nock(baseUrl)
        .get('/v1/validations/val_123')
        .reply(200, { id: 'val_123', status: 'completed', downloadUrl: 'https://example.com/file.pdf' });

      const result = await validations.waitForCompletion('val_123', { pollInterval: 100 });
      expect(result.status).toBe('completed');
    });

    it('should timeout if job takes too long', async () => {
      nock(baseUrl)
        .get('/v1/validations/val_123')
        .times(10)
        .reply(200, { id: 'val_123', status: 'processing' });

      await expect(
        validations.waitForCompletion('val_123', { pollInterval: 100, timeout: 500 })
      ).rejects.toThrow('timeout');
    });
  });

  describe('downloadReport', () => {
    it('should download and parse report', async () => {
      const mockJob = {
        id: 'val_123',
        status: 'completed',
        reportDownloadUrl: 'https://cdn.example.com/report.json',
      };

      const mockReport = {
        transformation: 'success',
        finalScore: 100,
        profile: 'BASIC',
        issues: [],
      };

      nock('https://cdn.example.com').get('/report.json').reply(200, JSON.stringify(mockReport));

      const result = await validations.downloadReport(mockJob as any);
      expect(result.finalScore).toBe(100);
      expect(result.issues).toEqual([]);
    });
  });
});
