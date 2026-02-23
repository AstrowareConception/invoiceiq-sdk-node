import { HttpClient } from '../client';
import { GenerationJob, InvoiceMetadata, PaginatedResponse, ListOptions, ValidationReport } from '../types';

export class GenerationsResource {
  constructor(private client: HttpClient) {}

  async list(options: ListOptions = {}): Promise<PaginatedResponse<GenerationJob>> {
    const query: Record<string, string> = {};
    if (options.page) query.page = options.page.toString();
    if (options.limit) query.limit = options.limit.toString();
    if (options.status) query.status = options.status;

    return this.client.request<PaginatedResponse<GenerationJob>>('GET', '/api/v1/generations', {
      query,
    });
  }

  async create(
    metadata: InvoiceMetadata,
    options: { idempotencyKey?: string } = {}
  ): Promise<GenerationJob> {
    const headers: Record<string, string> = {};
    if (options.idempotencyKey) {
      headers['Idempotency-Key'] = options.idempotencyKey;
    }

    return this.client.request<GenerationJob>('POST', '/api/v1/generations', {
      body: metadata,
      headers,
    });
  }

  async get(id: string): Promise<GenerationJob> {
    return this.client.request<GenerationJob>('GET', `/api/v1/generations/${id}`);
  }

  async waitForCompletion(
    id: string,
    options: { pollInterval?: number; timeout?: number } = {}
  ): Promise<GenerationJob> {
    const pollInterval = options.pollInterval || 2000;
    const timeout = options.timeout || 120000; // 2 minutes par défaut
    const startTime = Date.now();

    while (true) {
      const job = await this.get(id);

      if (job.status === 'completed' || job.status === 'failed') {
        return job;
      }

      if (Date.now() - startTime > timeout) {
        throw new Error('Generation timeout');
      }

      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }
  }

  async downloadReport(job: GenerationJob): Promise<ValidationReport> {
    if (!job.reportDownloadUrl) {
      throw new Error('No report URL available');
    }

    const buffer = await this.client.downloadFile(job.reportDownloadUrl);
    return JSON.parse(buffer.toString('utf-8'));
  }

  async downloadResult(job: GenerationJob): Promise<Buffer> {
    if (!job.downloadUrl) {
      throw new Error('No download URL available');
    }

    return this.client.downloadFile(job.downloadUrl);
  }
}
