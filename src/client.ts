import * as https from 'https';
import * as http from 'http';
import { InvoiceIQConfig } from './types';

export class HttpClient {
  private apiKey?: string;
  private bearerToken?: string;
  private baseUrl: string;

  constructor(config: InvoiceIQConfig) {
    this.apiKey = config.apiKey;
    this.bearerToken = config.bearerToken;
    this.baseUrl = config.baseUrl || 'https://api.invoiceiq.fr';
  }

  setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
  }

  setBearerToken(token: string): void {
    this.bearerToken = token;
  }

  private getHeaders(additionalHeaders?: Record<string, string>): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...additionalHeaders,
    };

    if (this.bearerToken) {
      headers['Authorization'] = `Bearer ${this.bearerToken}`;
    } else if (this.apiKey) {
      headers['X-API-KEY'] = this.apiKey;
    }

    return headers;
  }

  async request<T>(
    method: string,
    path: string,
    options: {
      body?: any;
      headers?: Record<string, string>;
      query?: Record<string, string>;
    } = {}
  ): Promise<T> {
    const url = new URL(path, this.baseUrl);

    if (options.query) {
      Object.entries(options.query).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }

    const headers = this.getHeaders(options.headers);
    const isHttps = url.protocol === 'https:';
    const lib = isHttps ? https : http;

    return new Promise((resolve, reject) => {
      const req = lib.request(
        url,
        {
          method,
          headers,
        },
        (res) => {
          let data = '';

          res.on('data', (chunk) => {
            data += chunk;
          });

          res.on('end', () => {
            if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
              try {
                const parsed = data ? JSON.parse(data) : {};
                resolve(parsed as T);
              } catch (e) {
                resolve(data as any);
              }
            } else {
              let errorMessage: any;
              try {
                errorMessage = JSON.parse(data);
              } catch {
                errorMessage = data;
              }
              reject(new Error(`HTTP ${res.statusCode}: ${JSON.stringify(errorMessage)}`));
            }
          });
        }
      );

      req.on('error', reject);

      if (options.body) {
        req.write(JSON.stringify(options.body));
      }

      req.end();
    });
  }

  async uploadFile<T>(
    path: string,
    formData: any,
    options: {
      headers?: Record<string, string>;
    } = {}
  ): Promise<T> {
    const url = new URL(path, this.baseUrl);
    const isHttps = url.protocol === 'https:';
    const lib = isHttps ? https : http;

    const headers = {
      ...formData.getHeaders(),
      ...this.getHeaders(options.headers),
    };

    return new Promise((resolve, reject) => {
      const req = lib.request(
        url,
        {
          method: 'POST',
          headers,
        },
        (res) => {
          let data = '';

          res.on('data', (chunk) => {
            data += chunk;
          });

          res.on('end', () => {
            if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
              try {
                const parsed = data ? JSON.parse(data) : {};
                resolve(parsed as T);
              } catch (e) {
                resolve(data as any);
              }
            } else {
              let errorMessage: any;
              try {
                errorMessage = JSON.parse(data);
              } catch {
                errorMessage = data;
              }
              reject(new Error(`HTTP ${res.statusCode}: ${JSON.stringify(errorMessage)}`));
            }
          });
        }
      );

      req.on('error', reject);
      formData.pipe(req);
    });
  }

  async downloadFile(url: string): Promise<Buffer> {
    const fileUrl = url.startsWith('http') ? url : new URL(url, this.baseUrl).toString();
    const parsedUrl = new URL(fileUrl);
    const isHttps = parsedUrl.protocol === 'https:';
    const lib = isHttps ? https : http;

    return new Promise((resolve, reject) => {
      lib.get(fileUrl, (res) => {
        if (res.statusCode !== 200) {
          reject(new Error(`Failed to download file: HTTP ${res.statusCode}`));
          return;
        }

        const chunks: Buffer[] = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => resolve(Buffer.concat(chunks)));
        res.on('error', reject);
      }).on('error', reject);
    });
  }
}
