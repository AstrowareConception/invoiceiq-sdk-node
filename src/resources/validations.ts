import { HttpClient } from '../client';
import { ValidationJob, PaginatedResponse, ListOptions, ValidationReport } from '../types';
import * as fs from 'fs';
import * as FormData from 'form-data';

export class ValidationsResource {
  constructor(private client: HttpClient) {}

  async list(options: ListOptions = {}): Promise<PaginatedResponse<ValidationJob>> {
    const query: Record<string, string> = {};
    if (options.page) query.page = options.page.toString();
    if (options.limit) query.limit = options.limit.toString();
    if (options.status) query.status = options.status;

    return this.client.request<PaginatedResponse<ValidationJob>>('GET', '/v1/validations', {
      query,
    });
  }

  async create(filePath: string): Promise<ValidationJob> {
    const form = new FormData();
    form.append('file', fs.createReadStream(filePath));

    return this.client.uploadFile<ValidationJob>('/v1/validations', form);
  }

  async createFromBuffer(buffer: Buffer, filename: string): Promise<ValidationJob> {
    const form = new FormData();
    form.append('file', buffer, filename);

    return this.client.uploadFile<ValidationJob>('/v1/validations', form);
  }

  async get(id: string): Promise<ValidationJob> {
    return this.client.request<ValidationJob>('GET', `/v1/validations/${id}`);
  }

  async waitForCompletion(
    id: string,
    options: { pollInterval?: number; timeout?: number } = {}
  ): Promise<ValidationJob> {
    const pollInterval = options.pollInterval || 2000;
    const timeout = options.timeout || 60000;
    const startTime = Date.now();

    while (true) {
      const job = await this.get(id);

      if (job.status === 'completed' || job.status === 'failed') {
        return job;
      }

      if (Date.now() - startTime > timeout) {
        throw new Error('Validation timeout');
      }

      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }
  }

  async downloadReport(job: ValidationJob): Promise<ValidationReport> {
    if (!job.reportDownloadUrl) {
      throw new Error('No report URL available');
    }

    const buffer = await this.client.downloadFile(job.reportDownloadUrl);
    return JSON.parse(buffer.toString('utf-8'));
  }

  async downloadResult(job: ValidationJob): Promise<Buffer> {
    if (!job.downloadUrl) {
      throw new Error('No download URL available');
    }

    return this.client.downloadFile(job.downloadUrl);
  }
}
