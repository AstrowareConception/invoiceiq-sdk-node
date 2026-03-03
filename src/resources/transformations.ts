import { HttpClient } from '../client';
import { TransformationJob, InvoiceMetadata, PaginatedResponse, ListOptions, ValidationReport } from '../types';
import * as fs from 'fs';
import FormData from 'form-data';

export class TransformationsResource {
  constructor(private client: HttpClient) {}

  async list(options: ListOptions = {}): Promise<PaginatedResponse<TransformationJob>> {
    const query: Record<string, string> = {};
    if (options.page) query.page = options.page.toString();
    if (options.limit) query.limit = options.limit.toString();
    if (options.status) query.status = options.status;

    return this.client.request<PaginatedResponse<TransformationJob>>('GET', '/api/v1/transformations', {
      query,
    });
  }

  async create(
    filePath: string,
    metadata: InvoiceMetadata,
    options: { idempotencyKey?: string } = {}
  ): Promise<TransformationJob> {
    const form = new FormData();
    form.append('file', fs.createReadStream(filePath));
    form.append('metadata', JSON.stringify(metadata));

    const headers: Record<string, string> = {};
    if (options.idempotencyKey) {
      headers['Idempotency-Key'] = options.idempotencyKey;
    }

    return this.client.uploadFile<TransformationJob>('/api/v1/transformations', form, { headers });
  }

  async createFromBuffer(
    buffer: Buffer,
    filename: string,
    metadata: InvoiceMetadata,
    options: { idempotencyKey?: string } = {}
  ): Promise<TransformationJob> {
    const form = new FormData();
    form.append('file', buffer, filename);
    form.append('metadata', JSON.stringify(metadata));

    const headers: Record<string, string> = {};
    if (options.idempotencyKey) {
      headers['Idempotency-Key'] = options.idempotencyKey;
    }

    return this.client.uploadFile<TransformationJob>('/api/v1/transformations', form, { headers });
  }

  async get(id: string): Promise<TransformationJob> {
    return this.client.request<TransformationJob>('GET', `/api/v1/transformations/${id}`);
  }

  async waitForCompletion(
    id: string,
    options: { pollInterval?: number; timeout?: number } = {}
  ): Promise<TransformationJob> {
    const pollInterval = options.pollInterval || 2000;
    const timeout = options.timeout || 120000; // 2 minutes par défaut
    const startTime = Date.now();

    while (true) {
      const job = await this.get(id);

      if (job.status === 'completed' || job.status === 'failed') {
        return job;
      }

      if (Date.now() - startTime > timeout) {
        throw new Error('Transformation timeout');
      }

      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }
  }

  async downloadReport(job: TransformationJob): Promise<ValidationReport> {
    if (!job.reportDownloadUrl) {
      throw new Error('No report URL available');
    }

    const buffer = await this.client.downloadFile(job.reportDownloadUrl);
    return JSON.parse(buffer.toString('utf-8'));
  }

  async downloadResult(job: TransformationJob): Promise<Buffer> {
    if (!job.downloadUrl) {
      throw new Error('No download URL available');
    }

    return this.client.downloadFile(job.downloadUrl);
  }
}
