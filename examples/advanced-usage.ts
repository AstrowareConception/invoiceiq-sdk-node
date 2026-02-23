/**
 * Exemples avancés d'utilisation du SDK InvoiceIQ
 */

import { InvoiceIQ, InvoiceMetadata } from '../src';
import * as fs from 'fs';

async function advancedExamples() {
  const client = new InvoiceIQ({
    apiKey: process.env.INVOICEIQ_API_KEY,
  });

  // ===========================================
  // EXEMPLE 1 : FACTURE AVEC EXONÉRATION TVA
  // ===========================================
  console.log('📋 EXEMPLE 1 : Facture avec exonération de TVA\n');

  const exemptionMetadata: InvoiceMetadata = {
    invoiceNumber: 'F-2024-MICRO-01',
    issueDate: '2024-02-22',
    currency: 'EUR',
    seller: {
      name: 'Jean Dupont Consultant',
      registrationId: '88990011223344',
      countryCode: 'FR',
      addressLine1: '15 Rue de l\'Artisanat',
      city: 'Bordeaux',
      postCode: '33000',
    },
    buyer: {
      name: 'Association Culturelle',
      countryCode: 'FR',
      addressLine1: 'Mairie de Bordeaux',
      city: 'Bordeaux',
      postCode: '33000',
    },
    lines: [
      {
        id: '1',
        name: 'Formation Gestion Projet',
        description: 'Session d\'accompagnement pour les bénévoles',
        quantity: 2,
        unitCode: 'DAY',
        netPrice: 450.0,
        taxRate: 0.0,
        taxCategoryCode: 'E',
        taxExemptionReason: 'TVA non applicable, art. 293 B du CGI',
        totalAmount: 900.0,
      },
    ],
    taxSummaries: [
      {
        taxRate: 0.0,
        taxableAmount: 900.0,
        taxAmount: 0.0,
        taxCategoryCode: 'E',
        taxExemptionReason: 'TVA non applicable, art. 293 B du CGI',
      },
    ],
    totalTaxExclusiveAmount: 900.0,
    taxTotalAmount: 0.0,
    totalTaxInclusiveAmount: 900.0,
    notes: 'Micro-entrepreneur : TVA non applicable, art. 293 B du CGI.',
  };

  try {
    const generation = await client.generations.create(exemptionMetadata);
    console.log('✓ Facture avec exonération créée:', generation.id);

    const completed = await client.generations.waitForCompletion(generation.id);
    if (completed.downloadUrl) {
      const pdf = await client.generations.downloadResult(completed);
      fs.writeFileSync('./examples/output-exemption.pdf', pdf);
      console.log('✓ PDF sauvegardé\n');
    }
  } catch (error) {
    console.error('❌ Erreur:', error);
  }

  // ================================================
  // EXEMPLE 2 : TRAITEMENT PAR LOTS (BATCH)
  // ================================================
  console.log('📋 EXEMPLE 2 : Traitement par lots de plusieurs factures\n');

  const invoices: InvoiceMetadata[] = [
    {
      invoiceNumber: 'BATCH-001',
      issueDate: '2024-02-22',
      seller: { name: 'Vendeur A', countryCode: 'FR' },
      buyer: { name: 'Client A', countryCode: 'FR' },
      totalTaxExclusiveAmount: 100,
      taxTotalAmount: 20,
      totalTaxInclusiveAmount: 120,
    },
    {
      invoiceNumber: 'BATCH-002',
      issueDate: '2024-02-22',
      seller: { name: 'Vendeur B', countryCode: 'FR' },
      buyer: { name: 'Client B', countryCode: 'FR' },
      totalTaxExclusiveAmount: 200,
      taxTotalAmount: 40,
      totalTaxInclusiveAmount: 240,
    },
    {
      invoiceNumber: 'BATCH-003',
      issueDate: '2024-02-22',
      seller: { name: 'Vendeur C', countryCode: 'FR' },
      buyer: { name: 'Client C', countryCode: 'FR' },
      totalTaxExclusiveAmount: 300,
      taxTotalAmount: 60,
      totalTaxInclusiveAmount: 360,
    },
  ];

  try {
    // Lancer toutes les générations en parallèle
    const jobs = await Promise.all(
      invoices.map((metadata, index) =>
        client.generations.create(metadata, {
          idempotencyKey: `batch-${index}-${Date.now()}`,
        })
      )
    );

    console.log(`✓ ${jobs.length} générations lancées`);

    // Attendre la fin de toutes les générations
    const completed = await Promise.all(
      jobs.map((job) => client.generations.waitForCompletion(job.id))
    );

    console.log(`✓ Toutes les générations terminées`);

    // Télécharger tous les PDFs
    for (let i = 0; i < completed.length; i++) {
      if (completed[i].downloadUrl) {
        const pdf = await client.generations.downloadResult(completed[i]);
        fs.writeFileSync(`./examples/output-batch-${i + 1}.pdf`, pdf);
      }
    }

    console.log('✓ Tous les PDFs sauvegardés\n');
  } catch (error) {
    console.error('❌ Erreur lors du traitement par lots:', error);
  }

  // =====================================================
  // EXEMPLE 3 : GESTION D'ERREURS ET RETRY
  // =====================================================
  console.log('📋 EXEMPLE 3 : Gestion d\'erreurs avec retry automatique\n');

  async function generateWithRetry(
    metadata: InvoiceMetadata,
    maxRetries = 3
  ): Promise<Buffer | null> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`  Tentative ${attempt}/${maxRetries}...`);

        const job = await client.generations.create(metadata);
        const completed = await client.generations.waitForCompletion(job.id);

        if (completed.status === 'failed') {
          throw new Error('Generation failed');
        }

        if (completed.downloadUrl) {
          return await client.generations.downloadResult(completed);
        }

        throw new Error('No download URL');
      } catch (error) {
        console.error(`  ❌ Tentative ${attempt} échouée:`, (error as Error).message);

        if (attempt === maxRetries) {
          console.error('  ❌ Échec après toutes les tentatives');
          return null;
        }

        // Attendre avant de réessayer (backoff exponentiel)
        const delay = Math.pow(2, attempt) * 1000;
        console.log(`  ⏳ Attente de ${delay}ms avant nouvelle tentative...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    return null;
  }

  const testMetadata: InvoiceMetadata = {
    invoiceNumber: 'RETRY-001',
    issueDate: '2024-02-22',
    seller: { name: 'Test Corp', countryCode: 'FR' },
    buyer: { name: 'Test Client', countryCode: 'FR' },
    totalTaxExclusiveAmount: 100,
    taxTotalAmount: 20,
    totalTaxInclusiveAmount: 120,
  };

  const result = await generateWithRetry(testMetadata);
  if (result) {
    console.log('✓ Génération réussie après retry\n');
  }

  // =====================================================
  // EXEMPLE 4 : PAGINATION DES RÉSULTATS
  // =====================================================
  console.log('📋 EXEMPLE 4 : Pagination et filtrage des résultats\n');

  try {
    // Récupérer la première page
    const page1 = await client.validations.list({ page: 1, limit: 10 });
    console.log(`✓ Page 1: ${page1.data.length} validations sur ${page1.total} total`);

    // Récupérer toutes les pages
    const allValidations = [];
    let currentPage = 1;
    const limit = 20;

    while (true) {
      const page = await client.validations.list({ page: currentPage, limit });
      allValidations.push(...page.data);

      console.log(
        `  Chargé page ${currentPage}: ${page.data.length} items (${allValidations.length}/${page.total})`
      );

      if (allValidations.length >= page.total) {
        break;
      }

      currentPage++;
    }

    console.log(`✓ Total chargé: ${allValidations.length} validations\n`);
  } catch (error) {
    console.error('❌ Erreur lors de la pagination:', error);
  }

  // =====================================================
  // EXEMPLE 5 : TRANSFORMATION DEPUIS UN BUFFER
  // =====================================================
  console.log('📋 EXEMPLE 5 : Transformation depuis un buffer (pas de fichier)\n');

  try {
    // Simuler la réception d'un PDF depuis une autre source (API, upload, etc.)
    const pdfBuffer = fs.readFileSync('./examples/simple-invoice.pdf');

    const metadata: InvoiceMetadata = {
      invoiceNumber: 'BUFFER-001',
      issueDate: '2024-02-22',
      seller: { name: 'Test', countryCode: 'FR' },
      buyer: { name: 'Client', countryCode: 'FR' },
      totalTaxExclusiveAmount: 100,
      taxTotalAmount: 20,
      totalTaxInclusiveAmount: 120,
    };

    const transformation = await client.transformations.createFromBuffer(
      pdfBuffer,
      'invoice.pdf',
      metadata
    );

    console.log('✓ Transformation depuis buffer créée:', transformation.id);

    const completed = await client.transformations.waitForCompletion(transformation.id);
    console.log('✓ Transformation terminée\n');
  } catch (error) {
    console.error('❌ Erreur:', error);
  }

  console.log('✨ Exemples avancés terminés !\n');
}

// Exécuter les exemples
if (require.main === module) {
  advancedExamples().catch(console.error);
}
