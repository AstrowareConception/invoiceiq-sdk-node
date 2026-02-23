import { HttpClient } from '../client';
import { ValidationJob } from '../types';
import * as fs from 'fs';
import * as FormData from 'form-data';

export class FreeValidationsResource {
  constructor(private client: HttpClient) {}

  async create(filePath: string): Promise<ValidationJob> {
    const form = new FormData();
    form.append('file', fs.createReadStream(filePath));

    return this.client.uploadFile<ValidationJob>('/v1/free-validations', form);
  }

  async createFromBuffer(buffer: Buffer, filename: string): Promise<ValidationJob> {
    const form = new FormData();
    form.append('file', buffer, filename);

    return this.client.uploadFile<ValidationJob>('/v1/free-validations', form);
  }
}
