import { HttpClient } from './client';
import { InvoiceIQConfig } from './types';
import { AuthResource } from './resources/auth';
import { ValidationsResource } from './resources/validations';
import { TransformationsResource } from './resources/transformations';
import { GenerationsResource } from './resources/generations';
import { FreeValidationsResource } from './resources/free-validations';

export class InvoiceIQ {
  private client: HttpClient;

  public auth: AuthResource;
  public validations: ValidationsResource;
  public transformations: TransformationsResource;
  public generations: GenerationsResource;
  public freeValidations: FreeValidationsResource;

  constructor(config: InvoiceIQConfig = {}) {
    this.client = new HttpClient(config);

    this.auth = new AuthResource(this.client);
    this.validations = new ValidationsResource(this.client);
    this.transformations = new TransformationsResource(this.client);
    this.generations = new GenerationsResource(this.client);
    this.freeValidations = new FreeValidationsResource(this.client);
  }

  setApiKey(apiKey: string): void {
    this.client.setApiKey(apiKey);
  }

  setBearerToken(token: string): void {
    this.client.setBearerToken(token);
  }
}

// Export des types
export * from './types';

// Export par défaut
export default InvoiceIQ;
