# InvoiceIQ SDK for Node.js

SDK Node.js pour l'API InvoiceIQ - Transformation et génération de factures Factur-X / ZUGFeRD.

## 🚀 Installation

```bash
# Cloner le dépôt
git clone https://github.com/votre-compte/invoiceiq-sdk-node.git
cd invoiceiq-sdk-node

# Installer les dépendances
npm install

# Compiler le SDK
npm run build
```

## 💡 Utilisation dans votre projet

Pour utiliser ce SDK dans votre projet Node.js :

### Option 1 : Installation locale

```bash
# Dans votre projet
npm install ../chemin/vers/invoiceiq-sdk-node
```

### Option 2 : Lien symbolique (développement)

```bash
# Dans le dossier du SDK
npm link

# Dans votre projet
npm link invoiceiq-sdk-node
```

## ⚡ Démarrage rapide

```typescript
import { InvoiceIQ } from 'invoiceiq-sdk-node';

// Initialiser le client avec votre clé API
const client = new InvoiceIQ({
  apiKey: 'votre-cle-api',
});

// Valider un document Factur-X
const validation = await client.validations.create('./facture.pdf');
const result = await client.validations.waitForCompletion(validation.id);
console.log('Score de conformité:', result.finalScore);

// Transformer un PDF en Factur-X
const metadata = {
  invoiceNumber: 'INV-2024-001',
  issueDate: '2024-02-22',
  seller: { name: 'Ma Société', countryCode: 'FR' },
  buyer: { name: 'Client', countryCode: 'FR' },
  totalTaxExclusiveAmount: 100,
  taxTotalAmount: 20,
  totalTaxInclusiveAmount: 120,
};

const transformation = await client.transformations.create('./invoice.pdf', metadata);
const completed = await client.transformations.waitForCompletion(transformation.id);

// Télécharger le résultat
const pdf = await client.transformations.downloadResult(completed);
fs.writeFileSync('./facturx.pdf', pdf);
```

## 📚 Fonctionnalités

- ✅ **Validation** : Vérifiez la conformité de vos documents Factur-X
- 🔄 **Transformation** : Convertissez un PDF simple en Factur-X (Profil BASIC)
- 🎨 **Génération** : Créez des factures Factur-X complètes avec rendu personnalisé (Profil EXTENDED)
- 🔐 **Authentification** : Support API Key et JWT Bearer Token
- 📦 **TypeScript** : Types complets pour une excellente expérience développeur
- 🧪 **Tests** : Suite de tests complète avec Jest

## 🔧 Configuration

### Avec API Key (recommandé pour serveur à serveur)

```typescript
const client = new InvoiceIQ({
  apiKey: process.env.INVOICEIQ_API_KEY,
});
```

### Avec Bearer Token (JWT)

```typescript
const client = new InvoiceIQ({
  bearerToken: 'your-jwt-token',
});

// Ou via login
const response = await client.auth.login({
  email: 'user@example.com',
  password: 'password',
});
// Le token est automatiquement configuré
```

### Environnement personnalisé

```typescript
const client = new InvoiceIQ({
  apiKey: 'your-key',
  baseUrl: 'http://localhost:8080', // Pour le développement local
});
```

## 📖 Documentation

### Validation

Validez la conformité d'un document Factur-X existant.

```typescript
// Créer une validation
const validation = await client.validations.create('./facture.pdf');

// Depuis un buffer
const buffer = fs.readFileSync('./facture.pdf');
const validation = await client.validations.createFromBuffer(buffer, 'facture.pdf');

// Attendre la fin du traitement
const result = await client.validations.waitForCompletion(validation.id);

// Télécharger le rapport
const report = await client.validations.downloadReport(result);
console.log('Score:', report.finalScore);
console.log('Profil:', report.profile);
console.log('Problèmes:', report.issues);

// Lister les validations
const list = await client.validations.list({ page: 1, limit: 10 });
```

### Transformation

Transformez un PDF simple en PDF Factur-X en ajoutant les métadonnées XML.

> **Note importante** : L'objet `rendering` n'est **pas supporté** dans les transformations. Il est uniquement disponible pour les générations.

```typescript
const metadata = {
  invoiceNumber: 'INV-2024-001',
  issueDate: '2024-02-22',
  currency: 'EUR',
  seller: {
    name: 'Ma Société SARL',
    vatId: 'FR12123456789',
    countryCode: 'FR',
    address: {
      line1: '10 Rue de la Paix',
      city: 'Paris',
      postCode: '75001',
      countryCode: 'FR',
    },
  },
  buyer: {
    name: 'Client Exemple',
    countryCode: 'FR',
  },
  lines: [
    {
      id: '1',
      name: 'Service Cloud',
      quantity: 1,
      unitCode: 'C62',
      netPrice: 100.0,
      taxRate: 20.0,
      taxCategoryCode: 'S',
      totalAmount: 100.0,
    },
  ],
  totalTaxExclusiveAmount: 100.0,
  taxTotalAmount: 20.0,
  totalTaxInclusiveAmount: 120.0,
};

// Créer la transformation
const transformation = await client.transformations.create('./invoice.pdf', metadata, {
  idempotencyKey: 'unique-key', // Optionnel : évite les doublons
});

// Attendre la fin
const completed = await client.transformations.waitForCompletion(transformation.id);

// Télécharger le PDF Factur-X
const pdf = await client.transformations.downloadResult(completed);
fs.writeFileSync('./facturx.pdf', pdf);

// Télécharger le rapport
const report = await client.transformations.downloadReport(completed);
```

### Génération

Générez une facture Factur-X complète à partir de métadonnées JSON (avec rendu PDF).

```typescript
const metadata = {
  invoiceNumber: 'F-2024-042',
  issueDate: '2024-02-22',
  dueDate: '2024-03-22',
  currency: 'EUR',
  seller: {
    name: 'InvoiceLabs SAS',
    registrationId: '98765432100012',
    vatId: 'FR987654321',
    countryCode: 'FR',
    addressLine1: '12 Avenue de l\'Innovation',
    city: 'Paris',
    postCode: '75013',
  },
  buyer: {
    name: 'Client Pro',
    countryCode: 'FR',
  },
  lines: [
    {
      id: '1',
      name: 'Abonnement Premium',
      quantity: 1,
      unitCode: 'C62',
      netPrice: 1000.0,
      taxRate: 20.0,
      taxCategoryCode: 'S',
      totalAmount: 1000.0,
    },
  ],
  totalTaxExclusiveAmount: 1000.0,
  taxTotalAmount: 200.0,
  totalTaxInclusiveAmount: 1200.0,
  rendering: {
    template: 'classic-01',
    primaryColor: '#0F172A',
    accentColor: '#2563EB',
    logo: {
      url: 'https://example.com/logo.png',
      width: 120,
      align: 'left',
    },
    footer: {
      extraText: 'SIRET 987 654 321 00012',
      showPageNumbers: true,
    },
    locale: 'fr-FR',
  },
};

// Créer la génération
const generation = await client.generations.create(metadata);

// Attendre la fin
const completed = await client.generations.waitForCompletion(generation.id);

// Télécharger la facture
const invoice = await client.generations.downloadResult(completed);
fs.writeFileSync('./invoice.pdf', invoice);
```

### Validation gratuite

Testez l'API sans authentification (limité à 1 requête / 15 min).

```typescript
const client = new InvoiceIQ(); // Pas de clé API nécessaire
const validation = await client.freeValidations.create('./facture.pdf');
```

## 🧪 Tests

```bash
# Installer les dépendances
npm install

# Lancer les tests
npm test

# Tests en mode watch
npm run test:watch

# Coverage
npm test -- --coverage
```

## 📦 Build

```bash
# Compiler TypeScript
npm run build

# Le SDK compilé sera dans ./dist/
```

## 🔥 Exemples avancés

### Gestion d'erreurs avec retry

```typescript
async function generateWithRetry(metadata, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const job = await client.generations.create(metadata);
      const completed = await client.generations.waitForCompletion(job.id);
      return await client.generations.downloadResult(completed);
    } catch (error) {
      if (attempt === maxRetries) throw error;
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }
}
```

### Traitement par lots

```typescript
const invoices = [metadata1, metadata2, metadata3];

// Lancer toutes les générations en parallèle
const jobs = await Promise.all(
  invoices.map(metadata => client.generations.create(metadata))
);

// Attendre toutes les générations
const completed = await Promise.all(
  jobs.map(job => client.generations.waitForCompletion(job.id))
);

// Télécharger tous les PDFs
for (const job of completed) {
  const pdf = await client.generations.downloadResult(job);
  // ... sauvegarder le PDF
}
```

### Facture avec exonération TVA

```typescript
const exemptionMetadata = {
  invoiceNumber: 'F-2024-001',
  issueDate: '2024-02-22',
  seller: { name: 'Micro-entrepreneur', countryCode: 'FR' },
  buyer: { name: 'Client', countryCode: 'FR' },
  lines: [
    {
      id: '1',
      name: 'Prestation',
      quantity: 1,
      netPrice: 500.0,
      taxRate: 0.0,
      taxCategoryCode: 'E', // E = Exonéré
      taxExemptionReason: 'TVA non applicable, art. 293 B du CGI',
      totalAmount: 500.0,
    },
  ],
  taxSummaries: [
    {
      taxRate: 0.0,
      taxableAmount: 500.0,
      taxAmount: 0.0,
      taxCategoryCode: 'E',
      taxExemptionReason: 'TVA non applicable, art. 293 B du CGI',
    },
  ],
  totalTaxExclusiveAmount: 500.0,
  taxTotalAmount: 0.0,
  totalTaxInclusiveAmount: 500.0,
};
```

## 📄 Types disponibles

Le SDK inclut des types TypeScript complets :

```typescript
import {
  InvoiceIQ,
  InvoiceMetadata,
  ValidationJob,
  TransformationJob,
  GenerationJob,
  ValidationReport,
  RenderingOptions,
  InvoiceLine,
  TaxSummary,
  // ... et bien d'autres
} from 'invoiceiq-sdk-node';
```

## 💰 Coûts en crédits

- **Validation** : 1 crédit
- **Transformation** : 5 crédits
- **Génération** : 10 crédits

## 📁 Structure du projet

```
invoiceiq-sdk-node/
├── src/
│   ├── index.ts                    # Point d'entrée principal
│   ├── client.ts                   # Client HTTP avec authentification
│   ├── types.ts                    # Types TypeScript complets
│   ├── resources/
│   │   ├── auth.ts                 # Authentification
│   │   ├── validations.ts          # Validations de documents
│   │   ├── transformations.ts      # Transformations PDF → Factur-X
│   │   ├── generations.ts          # Génération complète de factures
│   │   └── free-validations.ts     # Validations gratuites
│   └── __tests__/                  # Tests unitaires Jest
├── examples/
│   ├── basic-usage.ts              # Exemples d'utilisation basique
│   └── advanced-usage.ts           # Exemples avancés (batch, retry, etc.)
├── docs/                           # Documentation API source
├── dist/                           # Code compilé (après build)
└── package.json
```

## 🔗 Liens utiles

- [Documentation API](https://api.invoiceiq.fr/docs)
- [Site InvoiceIQ](https://www.invoiceiq.fr)
- [Support](mailto:support@invoiceiq.fr)

## 📝 Licence

MIT
