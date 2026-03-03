/**
 * Exemple d'utilisation basique du SDK InvoiceIQ
 */

import { InvoiceIQ, InvoiceMetadata } from '../src';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  // 1. Initialiser le client avec votre clé API
  const client = new InvoiceIQ({
    apiKey: process.env.INVOICEIQ_API_KEY,
  });

  // Alternative : utiliser un Bearer Token
  // const client = new InvoiceIQ({
  //   bearerToken: 'your-jwt-token',
  // });

  console.log('✅ Client InvoiceIQ initialisé\n');

  // ======================
  // EXEMPLE 1 : VALIDATION
  // ======================
  console.log('📋 EXEMPLE 1 : Validation d\'un PDF Factur-X\n');

  try {
    // Créer une validation
    const validation = await client.validations.create('./examples/sample-invoice.pdf');
    console.log('✓ Validation créée:', validation.id);

    // Attendre la fin du traitement
    const completedValidation = await client.validations.waitForCompletion(validation.id);
    console.log('✓ Validation terminée:', completedValidation.status);

    // Télécharger le rapport
    if (completedValidation.reportDownloadUrl) {
      const report = await client.validations.downloadReport(completedValidation);
      console.log('✓ Score de conformité:', report.finalScore);
      console.log('✓ Profil:', report.profile);

      if (report.issues && report.issues.length > 0) {
        console.log('⚠ Problèmes détectés:');
        report.issues.forEach((issue) => {
          console.log(`  - ${issue.message} (${issue.code})`);
        });
      }
    }
  } catch (error) {
    console.error('❌ Erreur lors de la validation:', error);
  }

  console.log('\n' + '='.repeat(60) + '\n');

  // ===========================
  // EXEMPLE 2 : TRANSFORMATION
  // ===========================
  console.log('📋 EXEMPLE 2 : Transformation PDF → Factur-X\n');

  try {
    // Préparer les métadonnées de la facture
    const metadata: InvoiceMetadata = {
      invoiceNumber: 'INV-2024-DEMO-001',
      issueDate: '2024-02-22',
      currency: 'EUR',
      seller: {
        name: 'Ma Société SARL',
        registrationId: '12345678900012',
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
        address: {
          line1: '5 Avenue des Champs-Élysées',
          city: 'Paris',
          postCode: '75008',
          countryCode: 'FR',
        },
      },
      lines: [
        {
          id: '1',
          name: 'Abonnement Service Cloud',
          quantity: 1,
          unitCode: 'C62',
          netPrice: 100.0,
          taxRate: 20.0,
          taxCategoryCode: 'S',
          totalAmount: 100.0,
        },
      ],
      taxes: [
        {
          taxRate: 20.0,
          basisAmount: 100.0,
          taxAmount: 20.0,
          taxCategoryCode: 'S',
        },
      ],
      totalTaxExclusiveAmount: 100.0,
      taxTotalAmount: 20.0,
      totalTaxInclusiveAmount: 120.0,
    };

    // Lancer la transformation
    const transformation = await client.transformations.create(
      './examples/simple-invoice.pdf',
      metadata,
      {
        idempotencyKey: 'demo-transform-001', // Optionnel : évite les doublons
      }
    );

    console.log('✓ Transformation créée:', transformation.id);

    // Attendre la fin du traitement (peut prendre quelques secondes)
    const completedTransformation = await client.transformations.waitForCompletion(
      transformation.id,
      { timeout: 120000 } // 2 minutes
    );

    console.log('✓ Transformation terminée:', completedTransformation.status);

    // Télécharger le PDF Factur-X
    if (completedTransformation.downloadUrl) {
      const facturxPdf = await client.transformations.downloadResult(completedTransformation);
      const outputPath = './examples/output-facturx.pdf';
      fs.writeFileSync(outputPath, facturxPdf);
      console.log('✓ PDF Factur-X sauvegardé:', outputPath);
    }

    // Télécharger le rapport de conformité
    if (completedTransformation.reportDownloadUrl) {
      const report = await client.transformations.downloadReport(completedTransformation);
      console.log('✓ Score de conformité:', report.finalScore);
    }
  } catch (error) {
    console.error('❌ Erreur lors de la transformation:', error);
  }

  console.log('\n' + '='.repeat(60) + '\n');

  // ========================
  // EXEMPLE 3 : GÉNÉRATION
  // ========================
  console.log('📋 EXEMPLE 3 : Génération complète d\'une facture Factur-X\n');

  try {
    // Métadonnées complètes avec options de rendu
    const generationMetadata: InvoiceMetadata = {
      invoiceNumber: 'F-2024-DEMO-042',
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
        email: 'billing@invoicelabs.io',
      },
      buyer: {
        name: 'Client Pro',
        countryCode: 'FR',
        addressLine1: '5 Rue du Commerce',
        city: 'Lyon',
        postCode: '69002',
      },
      lines: [
        {
          id: '1',
          name: 'Abonnement Premium SaaS',
          description: 'Accès plateforme pour 10 utilisateurs',
          quantity: 1,
          unitCode: 'C62',
          netPrice: 1000.0,
          taxRate: 20.0,
          taxCategoryCode: 'S',
          totalAmount: 1000.0,
        },
        {
          id: '2',
          name: 'Support Premium',
          description: 'Assistance prioritaire 24/7',
          quantity: 1,
          unitCode: 'C62',
          netPrice: 250.0,
          taxRate: 20.0,
          taxCategoryCode: 'S',
          totalAmount: 250.0,
        },
      ],
      taxSummaries: [
        {
          taxRate: 20.0,
          taxableAmount: 1250.0,
          taxAmount: 250.0,
          taxCategoryCode: 'S',
        },
      ],
      totalTaxExclusiveAmount: 1250.0,
      taxTotalAmount: 250.0,
      totalTaxInclusiveAmount: 1500.0,
      notes: 'Merci pour votre confiance !',
      rendering: {
        template: 'classic-01',
        font: 'Helvetica',
        primaryColor: '#0F172A',
        accentColor: '#2563EB',
        logo: {
          url: 'https://invoiceiq.fr/assets/demo/logo.png',
          width: 120,
          align: 'left',
        },
        footer: {
          extraText: 'InvoiceLabs SAS - SIRET 987 654 321 00012 - RCS Paris',
          showPageNumbers: true,
        },
        locale: 'fr-FR',
      },
    };

    // Créer la génération
    const generation = await client.generations.create(generationMetadata, {
      idempotencyKey: 'demo-gen-042',
    });

    console.log('✓ Génération créée:', generation.id);

    // Attendre la fin de la génération
    const completedGeneration = await client.generations.waitForCompletion(generation.id, {
      timeout: 120000,
    });

    console.log('✓ Génération terminée:', completedGeneration.status);

    // Télécharger la facture générée
    if (completedGeneration.downloadUrl) {
      const generatedInvoice = await client.generations.downloadResult(completedGeneration);
      const outputPath = './examples/output-generated.pdf';
      fs.writeFileSync(outputPath, generatedInvoice);
      console.log('✓ Facture générée sauvegardée:', outputPath);
    }
  } catch (error) {
    console.error('❌ Erreur lors de la génération:', error);
  }

  console.log('\n' + '='.repeat(60) + '\n');

  // ====================================
  // EXEMPLE 4 : VALIDATION GRATUITE
  // ====================================
  console.log('📋 EXEMPLE 4 : Test de validation gratuite (sans authentification)\n');

  try {
    const freeClient = new InvoiceIQ();
    const freeValidation = await freeClient.freeValidations.create('./examples/test-invoice.pdf');
    console.log('✓ Validation gratuite créée:', freeValidation.id);
    console.log('⚠ Note: Limitée à 1 requête par 15 minutes');
  } catch (error) {
    console.error('❌ Erreur:', error);
  }

  console.log('\n✨ Exemples terminés !\n');
}

// Exécuter les exemples
if (require.main === module) {
  main().catch(console.error);
}
