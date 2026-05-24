---
name: azure-ai-formrecognizer-java
description: |
  Azure AI Document Intelligence SDK for Java (com.azure:azure-ai-documentintelligence).
  Use for extracting text, tables, key-value pairs from documents, receipts, invoices, IDs, or building custom document models.
  Triggers: "document intelligence java", "form recognizer java", "extract text from PDF java", "OCR document java",
  "analyze invoice receipt java", "custom document model java", "document classification java".
---

# Azure AI Document Intelligence SDK for Java

> **Rebranding:** Azure AI Form Recognizer is now **Azure AI Document Intelligence**.
> New projects should use `com.azure:azure-ai-documentintelligence`. The legacy `azure-ai-formrecognizer` package targets API version 2023-07-31 only.
> See [Migration Guide](https://github.com/Azure/azure-sdk-for-java/blob/main/sdk/documentintelligence/azure-ai-documentintelligence/MIGRATION_GUIDE.md).

## Before Implementation

Search `microsoft-docs` MCP for current API patterns:
- Query: `"azure-ai-documentintelligence Java SDK"`
- Verify: Parameters match installed SDK version (latest GA: 1.0.7)

## Installation

```xml
<dependency>
    <groupId>com.azure</groupId>
    <artifactId>azure-ai-documentintelligence</artifactId>
    <version>1.0.0</version>
</dependency>

<!-- For DefaultAzureCredential -->
<dependency>
    <groupId>com.azure</groupId>
    <artifactId>azure-identity</artifactId>
    <version>1.14.2</version>
</dependency>
```

## Environment Variables

```bash
DOCUMENT_INTELLIGENCE_ENDPOINT=https://<resource>.cognitiveservices.azure.com/ # Required for all auth methods
AZURE_TOKEN_CREDENTIALS=prod  # Required only if DefaultAzureCredential is used in production
```

## Authentication

### DefaultAzureCredential (Recommended)

```java
import com.azure.ai.documentintelligence.DocumentIntelligenceClient;
import com.azure.ai.documentintelligence.DocumentIntelligenceClientBuilder;
import com.azure.core.credential.TokenCredential;
import com.azure.identity.AzureIdentityEnvVars;
import com.azure.identity.DefaultAzureCredentialBuilder;
import com.azure.identity.ManagedIdentityCredentialBuilder;

TokenCredential credential = new DefaultAzureCredentialBuilder()
    .requireEnvVars(AzureIdentityEnvVars.AZURE_TOKEN_CREDENTIALS)
    .build();
// Or use a specific credential directly in production:
// See https://learn.microsoft.com/java/api/overview/azure/identity-readme?view=azure-java-stable#credential-classes
// TokenCredential credential = new ManagedIdentityCredentialBuilder().build();

DocumentIntelligenceClient client = new DocumentIntelligenceClientBuilder()
    .endpoint(System.getenv("DOCUMENT_INTELLIGENCE_ENDPOINT"))
    .credential(credential)
    .buildClient();
```

### API Key

```java
import com.azure.core.credential.AzureKeyCredential;

DocumentIntelligenceClient client = new DocumentIntelligenceClientBuilder()
    .endpoint(System.getenv("DOCUMENT_INTELLIGENCE_ENDPOINT"))
    .credential(new AzureKeyCredential(System.getenv("DOCUMENT_INTELLIGENCE_KEY")))
    .buildClient();
```

### Administration Client

```java
import com.azure.ai.documentintelligence.DocumentIntelligenceAdministrationClient;
import com.azure.ai.documentintelligence.DocumentIntelligenceAdministrationClientBuilder;
import com.azure.core.credential.TokenCredential;
import com.azure.identity.AzureIdentityEnvVars;
import com.azure.identity.DefaultAzureCredentialBuilder;
import com.azure.identity.ManagedIdentityCredentialBuilder;

TokenCredential credential = new DefaultAzureCredentialBuilder()
    .requireEnvVars(AzureIdentityEnvVars.AZURE_TOKEN_CREDENTIALS)
    .build();
// Or use a specific credential directly in production:
// See https://learn.microsoft.com/java/api/overview/azure/identity-readme?view=azure-java-stable#credential-classes
// TokenCredential credential = new ManagedIdentityCredentialBuilder().build();

DocumentIntelligenceAdministrationClient adminClient = new DocumentIntelligenceAdministrationClientBuilder()
    .endpoint(System.getenv("DOCUMENT_INTELLIGENCE_ENDPOINT"))
    .credential(credential)
    .buildClient();
```

### Async Client

```java
import com.azure.ai.documentintelligence.DocumentIntelligenceAsyncClient;
import com.azure.core.credential.TokenCredential;
import com.azure.identity.AzureIdentityEnvVars;
import com.azure.identity.DefaultAzureCredentialBuilder;
import com.azure.identity.ManagedIdentityCredentialBuilder;

TokenCredential credential = new DefaultAzureCredentialBuilder()
    .requireEnvVars(AzureIdentityEnvVars.AZURE_TOKEN_CREDENTIALS)
    .build();
// Or use a specific credential directly in production:
// See https://learn.microsoft.com/java/api/overview/azure/identity-readme?view=azure-java-stable#credential-classes
// TokenCredential credential = new ManagedIdentityCredentialBuilder().build();

DocumentIntelligenceAsyncClient asyncClient = new DocumentIntelligenceClientBuilder()
    .endpoint(System.getenv("DOCUMENT_INTELLIGENCE_ENDPOINT"))
    .credential(credential)
    .buildAsyncClient();
```

## Prebuilt Models

| Model ID | Purpose |
|----------|---------|
| `prebuilt-read` | Extract text, lines, words, languages |
| `prebuilt-layout` | Text, tables, selection marks, structure |
| `prebuilt-receipt` | Receipt data extraction |
| `prebuilt-invoice` | Invoice field extraction |
| `prebuilt-idDocument` | ID documents (passport, license) |
| `prebuilt-tax.us.w2` | US W2 tax forms |
| `prebuilt-healthInsuranceCard.us` | US health insurance cards |
| `prebuilt-contract` | Contract field extraction |

> **Retired models:** `prebuilt-businessCard` and `prebuilt-document` are retired in API version 2024-11-30. Use the legacy `azure-ai-formrecognizer` package for these.

## Core Patterns

### Analyze from File

```java
import com.azure.ai.documentintelligence.models.*;
import com.azure.core.util.BinaryData;
import com.azure.core.util.polling.SyncPoller;
import java.io.File;

File document = new File("document.pdf");
BinaryData documentData = BinaryData.fromFile(document.toPath(), (int) document.length());

SyncPoller<AnalyzeOperationDetails, AnalyzeResult> poller =
    client.beginAnalyzeDocument("prebuilt-layout",
        new AnalyzeDocumentOptions(documentData));

AnalyzeResult result = poller.getFinalResult();
```

### Analyze from URL

```java
String documentUrl = "https://example.com/invoice.pdf";

SyncPoller<AnalyzeOperationDetails, AnalyzeResult> poller =
    client.beginAnalyzeDocument("prebuilt-invoice",
        new AnalyzeDocumentOptions(documentUrl));

AnalyzeResult result = poller.getFinalResult();
```

### Extract Layout

```java
AnalyzeResult result = poller.getFinalResult();

for (DocumentPage page : result.getPages()) {
    System.out.printf("Page has width: %.2f and height: %.2f, measured with unit: %s%n",
        page.getWidth(), page.getHeight(), page.getUnit());

    // Lines
    for (DocumentLine line : page.getLines()) {
        System.out.printf("Line '%s' is within bounding box %s.%n",
            line.getContent(), line.getPolygon());
    }

    // Selection marks
    for (DocumentSelectionMark mark : page.getSelectionMarks()) {
        System.out.printf("Selection mark is '%s' with confidence %.2f.%n",
            mark.getState(), mark.getConfidence());
    }
}

// Tables
for (DocumentTable table : result.getTables()) {
    System.out.printf("Table: %d rows x %d columns%n",
        table.getRowCount(), table.getColumnCount());
    for (DocumentTableCell cell : table.getCells()) {
        System.out.printf("Cell[%d,%d]: %s%n",
            cell.getRowIndex(), cell.getColumnIndex(), cell.getContent());
    }
}
```

### Extract Document Fields

```java
SyncPoller<AnalyzeOperationDetails, AnalyzeResult> poller =
    client.beginAnalyzeDocument("prebuilt-receipt",
        new AnalyzeDocumentOptions(receiptUrl));

AnalyzeResult result = poller.getFinalResult();

for (AnalyzedDocument doc : result.getDocuments()) {
    Map<String, DocumentField> fields = doc.getFields();

    DocumentField merchantName = fields.get("MerchantName");
    if (merchantName != null && merchantName.getType() == DocumentFieldType.STRING) {
        System.out.printf("Merchant: %s (confidence: %.2f)%n",
            merchantName.getValueString(), merchantName.getConfidence());
    }

    DocumentField transactionDate = fields.get("TransactionDate");
    if (transactionDate != null && transactionDate.getType() == DocumentFieldType.DATE) {
        System.out.printf("Date: %s%n", transactionDate.getValueDate());
    }
}
```

### Analyze with Options

```java
SyncPoller<AnalyzeOperationDetails, AnalyzeResult> poller =
    client.beginAnalyzeDocument("my-custom-model",
        new AnalyzeDocumentOptions(documentUrl)
            .setPages(Collections.singletonList("1-3"))
            .setLocale("en-US")
            .setDocumentAnalysisFeatures(Arrays.asList(DocumentAnalysisFeature.LANGUAGES))
            .setOutputContentFormat(DocumentContentFormat.TEXT));
```

## Custom Models

### Build Custom Model

```java
String blobContainerUrl = "{SAS_URL_of_training_data}";

SyncPoller<DocumentModelBuildOperationDetails, DocumentModelDetails> poller =
    adminClient.beginBuildDocumentModel(
        new BuildDocumentModelOptions("my-custom-model", DocumentBuildMode.TEMPLATE)
            .setAzureBlobSource(new AzureBlobContentSource(blobContainerUrl)));

DocumentModelDetails model = poller.getFinalResult();
System.out.printf("Model ID: %s%n", model.getModelId());
System.out.printf("Created: %s%n", model.getCreatedOn());

model.getDocumentTypes().forEach((docType, details) -> {
    details.getFieldSchema().forEach((field, schema) -> {
        System.out.printf("Field: %s (%s)%n", field, schema.getType());
    });
});
```

### Manage Models

```java
// Resource limits
DocumentIntelligenceResourceDetails resourceDetails = adminClient.getResourceDetails();
System.out.printf("Models: %d / %d%n",
    resourceDetails.getCustomDocumentModels().getCount(),
    resourceDetails.getCustomDocumentModels().getLimit());

// List models
PagedIterable<DocumentModelDetails> models = adminClient.listModels();
for (DocumentModelDetails model : models) {
    System.out.printf("Model: %s, Created: %s%n",
        model.getModelId(), model.getCreatedOn());
}

// Get model
DocumentModelDetails model = adminClient.getModel("model-id");

// Delete model
adminClient.deleteModel("model-id");
```

## Document Classification

### Build Classifier

```java
Map<String, ClassifierDocumentTypeDetails> docTypes = new HashMap<>();
docTypes.put("invoice", new ClassifierDocumentTypeDetails()
    .setAzureBlobSource(new AzureBlobContentSource(containerUrl).setPrefix("invoices/")));
docTypes.put("receipt", new ClassifierDocumentTypeDetails()
    .setAzureBlobSource(new AzureBlobContentSource(containerUrl).setPrefix("receipts/")));

SyncPoller<DocumentClassifierBuildOperationDetails, DocumentClassifierDetails> poller =
    adminClient.beginBuildClassifier(
        new BuildDocumentClassifierOptions("my-classifier", docTypes));

DocumentClassifierDetails classifier = poller.getFinalResult();
```

### Classify Document

```java
SyncPoller<AnalyzeOperationDetails, AnalyzeResult> poller =
    client.beginClassifyDocument("my-classifier",
        new ClassifyDocumentOptions(documentUrl));

AnalyzeResult result = poller.getFinalResult();
for (AnalyzedDocument doc : result.getDocuments()) {
    System.out.printf("Classified as: %s (confidence: %.2f)%n",
        doc.getDocumentType(), doc.getConfidence());
}
```

## Error Handling

```java
import com.azure.core.exception.HttpResponseException;

try {
    client.beginAnalyzeDocument("prebuilt-receipt",
        new AnalyzeDocumentOptions("invalid-url"));
} catch (HttpResponseException e) {
    System.out.printf("Status: %d, Error: %s%n",
        e.getResponse().getStatusCode(), e.getMessage());
}
```

## Migration from azure-ai-formrecognizer

| Old (formrecognizer v4.x) | New (documentintelligence v1.x) |
|---|---|
| `DocumentAnalysisClient` | `DocumentIntelligenceClient` |
| `DocumentAnalysisClientBuilder` | `DocumentIntelligenceClientBuilder` |
| `DocumentModelAdministrationClient` | `DocumentIntelligenceAdministrationClient` |
| `beginAnalyzeDocumentFromUrl(modelId, url)` | `beginAnalyzeDocument(modelId, new AnalyzeDocumentOptions(url))` |
| `beginAnalyzeDocument(modelId, data)` | `beginAnalyzeDocument(modelId, new AnalyzeDocumentOptions(data))` |
| `SyncPoller<OperationResult, AnalyzeResult>` | `SyncPoller<AnalyzeOperationDetails, AnalyzeResult>` |
| `field.getValueAsString()` | `field.getValueString()` |
| `field.getValueAsDate()` | `field.getValueDate()` |
| `field.getValueAsDouble()` | `field.getValueNumber()` |
| `field.getValueAsList()` | `field.getValueList()` |
| `field.getValueAsMap()` | `field.getValueObject()` |
| `mark.getSelectionMarkState()` | `mark.getState()` |
| `adminClient.beginBuildDocumentModel(url, mode, prefix, options, ctx)` | `adminClient.beginBuildDocumentModel(new BuildDocumentModelOptions(id, mode).setAzureBlobSource(...))` |
| `adminClient.getResourceDetails()` → `.getCustomDocumentModelCount()` | `adminClient.getResourceDetails()` → `.getCustomDocumentModels().getCount()` |
| `FORM_RECOGNIZER_ENDPOINT` | `DOCUMENT_INTELLIGENCE_ENDPOINT` |

## Reference Files

| File | Contents |
|------|----------|
| [references/examples.md](references/examples.md) | Complete code examples for all scenarios |
