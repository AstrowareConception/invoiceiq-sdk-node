# Spécifications de l'API de Transformation Factur-X

Ce document détaille le format JSON accepté par le endpoint `POST /api/v1/transformations` pour convertir un PDF simple en PDF Factur-X (Profil BASIC).

## Endpoint
`POST /api/v1/transformations`

- **Content-Type**: `multipart/form-data`
- **Paramètres**:
    - `file`: Le fichier PDF source à transformer. (Le paramètre doit être nommé `file` dans le multipart)
    - `metadata`: Une chaîne de caractères JSON contenant les données de la facture (voir détails ci-dessous).
- **Header**:
    - `Idempotency-Key` (optionnel) : Clé unique pour éviter les doublons de traitement.

## Réponse et Rapport

Après la transformation, l'API retourne un objet `Job`. Une fois le statut à `completed`, vous aurez accès à :
- `downloadUrl` : Lien vers le PDF Factur-X généré.
- `reportDownloadUrl` : Lien vers un rapport JSON contenant le score de compatibilité.

Exemple de rapport :
```json
{
  "transformation": "success",
  "finalScore": 100,
  "profile": "BASIC",
  "issues": []
}
```

En cas de problèmes de conformité, le champ `issues` contient la liste des erreurs détectées :
```json
{
  "transformation": "success",
  "finalScore": 85,
  "profile": "BASIC",
  "issues": [
    {
      "message": "The seller VAT identifier is missing",
      "code": "VAT-ID-MISSING"
    }
  ]
}
```

## Structure du JSON (metadata)

Le format JSON est conçu pour être proche de la norme sémantique européenne EN 16931 et du format technique Factur-X.

### Objet principal (Root)

| Champ | Type | Description |
| :--- | :--- | :--- |
| `invoiceNumber` | String | Numéro de la facture (ex: "INV-2024-001"). **Requis**. |
| `issueDate` | String | Date d'émission au format ISO 8601 (ex: "2024-02-22"). **Requis**. |
| `currency` | String | Code devise ISO 4217 (ex: "EUR"). Défaut: "EUR". |
| `typeCode` | String | Type de document (380 = Facture, 381 = Avoir). Défaut: "380". |
| `seller` | Object | Informations sur le vendeur. **Requis**. |
| `buyer` | Object | Informations sur l'acheteur. **Requis**. |
| `lines` | Array | Liste des lignes de facture. |
| `taxes` | Array | Récapitulatif des taxes par taux. |
| `totalTaxExclusiveAmount`| Number | Total Hors Taxes (HT). **Requis**. |
| `totalTaxInclusiveAmount`| Number | Total Toutes Taxes Comprises (TTC). **Requis**. |
| `taxTotalAmount` | Number | Montant total de la taxe (TVA). **Requis**. |
| `purchaseOrderReference`| String | Référence du bon de commande. |

### Parties (Seller / Buyer)

| Champ | Type | Description |
| :--- | :--- | :--- |
| `name` | String | Nom ou raison sociale. **Requis**. |
| `registrationId` | String | Identifiant légal (SIRET en France). |
| `vatId` | String | Numéro de TVA intracommunautaire. |
| `countryCode` | String | Code pays ISO 3166-1 alpha-2 (ex: "FR"). **Requis**. |
| `address` | Object | Adresse postale (voir ci-dessous). |

### Adresse (Address)

| Champ | Type | Description |
| :--- | :--- | :--- |
| `line1` | String | Adresse ligne 1. |
| `line2` | String | Adresse ligne 2 (optionnel). |
| `postCode` | String | Code postal. |
| `city` | String | Ville. |
| `countryCode` | String | Code pays ISO 3166-1 alpha-2. |

### Lignes de facture (InvoiceLine)

| Champ | Type | Description |
| :--- | :--- | :--- |
| `id` | String | Identifiant de la ligne (ex: "1"). |
| `name` | String | Nom du produit ou service. **Requis**. |
| `description` | String | Description détaillée. |
| `quantity` | Number | Quantité. **Requis**. |
| `unitCode` | String | Code unité (ex: "C62" pour unité, "HUR" pour heure). Défaut: "C62". |
| `netPrice` | Number | Prix unitaire net HT. **Requis**. |
| `taxRate` | Number | Taux de taxe en pourcentage (ex: 20.00). |
| `taxCategoryCode` | String | Code catégorie de taxe (S = Standard, E = Exonéré, O = Hors champ, etc.). Défaut: "S". |
| `taxExemptionReason` | String | Raison de l'exonération (ex: "Art. 262 ter I du CGI"). Requis si `taxCategoryCode` != "S". |
| `totalAmount` | Number | Montant total HT de la ligne. **Requis**. |

### Récapitulatif des taxes (TaxSummary)

| Champ | Type | Description |
| :--- | :--- | :--- |
| `taxRate` | Number | Taux de taxe. |
| `basisAmount` | Number | Montant de base HT pour ce taux. |
| `taxAmount` | Number | Montant de la taxe calculé. |
| `taxCategoryCode` | String | Code catégorie de taxe (Défaut: "S"). |
| `taxExemptionReason` | String | Raison de l'exonération (ex: "Auto-liquidation"). |

## Exemple complet

```json
{
  "invoiceNumber": "INV-2024-0042",
  "issueDate": "2024-02-22",
  "currency": "EUR",
  "typeCode": "380",
  "seller": {
    "name": "InvoiceLabs SAS",
    "registrationId": "12345678900012",
    "vatId": "FR12123456789",
    "countryCode": "FR",
    "address": {
      "line1": "10 Rue de la Paix",
      "city": "Paris",
      "postCode": "75001",
      "countryCode": "FR"
    }
  },
  "buyer": {
    "name": "Client Exemple",
    "countryCode": "FR",
    "address": {
      "line1": "5 Avenue des Champs-Élysées",
      "city": "Paris",
      "postCode": "75008",
      "countryCode": "FR"
    }
  },
  "lines": [
    {
      "id": "1",
      "name": "Abonnement Service Cloud",
      "quantity": 1,
      "unitCode": "C62",
      "netPrice": 100.00,
      "taxRate": 20.00,
      "taxCategoryCode": "S",
      "totalAmount": 100.00
    },
    {
      "id": "2",
      "name": "Frais de mise en service",
      "quantity": 1,
      "unitCode": "C62",
      "netPrice": 25.00,
      "taxRate": 20.00,
      "taxCategoryCode": "S",
      "totalAmount": 25.00
    }
  ],
  "taxes": [
    {
      "taxRate": 20.00,
      "basisAmount": 125.00,
      "taxAmount": 25.00,
      "taxCategoryCode": "S"
    }
  ],
  "totalTaxExclusiveAmount": 125.00,
  "taxTotalAmount": 25.00,
  "totalTaxInclusiveAmount": 150.00
}
```

**Note importante** : L'objet `rendering` (qui contient `template`, `logo`, `footer`, etc.) n'est **pas supporté** dans l'endpoint de transformation. Il est uniquement utilisé pour l'endpoint de génération `/api/v1/generations`.
