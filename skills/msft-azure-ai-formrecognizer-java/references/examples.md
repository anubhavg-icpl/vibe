# Azure AI Document Intelligence - Java Code Examples

## 1. Client Setup

### Sync Client with DefaultAzureCredential

```java
import com.azure.ai.documentintelligence.DocumentIntelligenceClient;
import com.azure.ai.documentintelligence.DocumentIntelligenceClientBuilder;
import com.azure.identity.DefaultAzureCredentialBuilder;

DocumentIntelligenceClient client = new DocumentIntelligenceClientBuilder()
    .endpoint(System.getenv("DOCUMENT_INTELLIGENCE_ENDPOINT"))
    .credential(new DefaultAzureCredentialBuilder().build())
    .buildClient();
```

### Async Client

```java
import com.azure.ai.documentintelligence.DocumentIntelligenceAsyncClient;

DocumentIntelligenceAsyncClient asyncClient = new DocumentIntelligenceClientBuilder()
    .endpoint(System.getenv("DOCUMENT_INTELLIGENCE_ENDPOINT"))
    .credential(new DefaultAzureCredentialBuilder().build())
    .buildAsyncClient();
```

### Administration Client

```java
import com.azure.ai.documentintelligence.DocumentIntelligenceAdministrationClient;
import com.azure.ai.documentintelligence.DocumentIntelligenceAdministrationClientBuilder;

DocumentIntelligenceAdministrationClient adminClient = new DocumentIntelligenceAdministrationClientBuilder()
    .endpoint(System.getenv("DOCUMENT_INTELLIGENCE_ENDPOINT"))
    .credential(new DefaultAzureCredentialBuilder().build())
    .buildClient();
```

---

## 2. Analyze Layout

### From Local File

```java
import com.azure.ai.documentintelligence.models.*;
import com.azure.core.util.BinaryData;
import com.azure.core.util.polling.SyncPoller;
import java.io.File;

File layoutDocument = new File("document.pdf");
BinaryData documentData = BinaryData.fromFile(
    layoutDocument.toPath(), (int) layoutDocument.length());

SyncPoller<AnalyzeOperationDetails, AnalyzeResult> poller =
    client.beginAnalyzeDocument("prebuilt-layout",
        new AnalyzeDocumentOptions(documentData));

AnalyzeResult result = poller.getFinalResult();

// Pages
for (DocumentPage page : result.getPages()) {
    System.out.printf("Page %d: %.2f x %.2f %s%n",
        page.getPageNumber(), page.getWidth(), page.getHeight(), page.getUnit());

    // Lines
    for (DocumentLine line : page.getLines()) {
        System.out.printf("  Line: '%s' [%s]%n",
            line.getContent(), line.getPolygon());
    }

    // Words
    for (DocumentWord word : page.getWords()) {
        System.out.printf("  Word: '%s' (confidence: %.2f)%n",
            word.getContent(), word.getConfidence());
    }

    // Selection marks
    for (DocumentSelectionMark mark : page.getSelectionMarks()) {
        System.out.printf("  Selection mark: %s (confidence: %.2f)%n",
            mark.getState(), mark.getConfidence());
    }
}

// Tables
for (int i = 0; i < result.getTables().size(); i++) {
    DocumentTable table = result.getTables().get(i);
    System.out.printf("Table %d: %d rows x %d columns%n",
        i, table.getRowCount(), table.getColumnCount());
    for (DocumentTableCell cell : table.getCells()) {
        System.out.printf("  Cell[%d,%d]: '%s'%n",
            cell.getRowIndex(), cell.getColumnIndex(), cell.getContent());
    }
}
```

### From URL

```java
String documentUrl = "https://raw.githubusercontent.com/Azure/azure-sdk-for-java/main/"
    + "sdk/documentintelligence/azure-ai-documentintelligence/"
    + "src/samples/resources/sample-forms/forms/Form_1.jpg";

SyncPoller<AnalyzeOperationDetails, AnalyzeResult> poller =
    client.beginAnalyzeDocument("prebuilt-layout",
        new AnalyzeDocumentOptions(documentUrl));

AnalyzeResult result = poller.getFinalResult();
System.out.printf("Content: %s%n", result.getContent());
```

---

## 3. Analyze Receipts

```java
import com.azure.ai.documentintelligence.models.*;
import java.util.Map;

String receiptUrl = "https://raw.githubusercontent.com/Azure/azure-sdk-for-java/main/"
    + "sdk/documentintelligence/azure-ai-documentintelligence/"
    + "src/samples/resources/sample-forms/receipts/contoso-allinone.jpg";

SyncPoller<AnalyzeOperationDetails, AnalyzeResult> poller =
    client.beginAnalyzeDocument("prebuilt-receipt",
        new AnalyzeDocumentOptions(receiptUrl));

AnalyzeResult result = poller.getFinalResult();

for (AnalyzedDocument receipt : result.getDocuments()) {
    Map<String, DocumentField> fields = receipt.getFields();

    // Merchant name
    DocumentField merchantName = fields.get("MerchantName");
    if (merchantName != null && merchantName.getType() == DocumentFieldType.STRING) {
        System.out.printf("Merchant: %s (confidence: %.2f)%n",
            merchantName.getValueString(), merchantName.getConfidence());
    }

    // Merchant phone
    DocumentField phone = fields.get("MerchantPhoneNumber");
    if (phone != null && phone.getType() == DocumentFieldType.PHONE_NUMBER) {
        System.out.printf("Phone: %s%n", phone.getValuePhoneNumber());
    }

    // Merchant address
    DocumentField address = fields.get("MerchantAddress");
    if (address != null && address.getType() == DocumentFieldType.STRING) {
        System.out.printf("Address: %s%n", address.getValueString());
    }

    // Transaction date
    DocumentField date = fields.get("TransactionDate");
    if (date != null && date.getType() == DocumentFieldType.DATE) {
        System.out.printf("Date: %s%n", date.getValueDate());
    }

    // Total
    DocumentField total = fields.get("Total");
    if (total != null && total.getType() == DocumentFieldType.NUMBER) {
        System.out.printf("Total: %.2f%n", total.getValueNumber());
    }

    // Items (array field)
    DocumentField items = fields.get("Items");
    if (items != null && items.getType() == DocumentFieldType.LIST) {
        for (DocumentField item : items.getValueList()) {
            Map<String, DocumentField> itemFields = item.getValueObject();
            DocumentField description = itemFields.get("Description");
            DocumentField totalPrice = itemFields.get("TotalPrice");
            if (description != null) {
                System.out.printf("  Item: %s", description.getValueString());
            }
            if (totalPrice != null) {
                System.out.printf(" - $%.2f", totalPrice.getValueNumber());
            }
            System.out.println();
        }
    }
}
```

---

## 4. Analyze Invoices

```java
String invoiceUrl = "https://raw.githubusercontent.com/Azure/azure-sdk-for-java/main/"
    + "sdk/documentintelligence/azure-ai-documentintelligence/"
    + "src/samples/resources/sample-forms/invoices/sample_invoice.jpg";

SyncPoller<AnalyzeOperationDetails, AnalyzeResult> poller =
    client.beginAnalyzeDocument("prebuilt-invoice",
        new AnalyzeDocumentOptions(invoiceUrl));

AnalyzeResult result = poller.getFinalResult();

for (AnalyzedDocument invoice : result.getDocuments()) {
    Map<String, DocumentField> fields = invoice.getFields();

    DocumentField vendorName = fields.get("VendorName");
    if (vendorName != null) {
        System.out.printf("Vendor: %s%n", vendorName.getValueString());
    }

    DocumentField customerName = fields.get("CustomerName");
    if (customerName != null) {
        System.out.printf("Customer: %s%n", customerName.getValueString());
    }

    DocumentField invoiceTotal = fields.get("InvoiceTotal");
    if (invoiceTotal != null && invoiceTotal.getType() == DocumentFieldType.NUMBER) {
        System.out.printf("Total: %.2f (Currency: %s)%n",
            invoiceTotal.getValueNumber(),
            fields.containsKey("CurrencyCode")
                ? fields.get("CurrencyCode").getValueString() : "N/A");
    }

    DocumentField invoiceDate = fields.get("InvoiceDate");
    if (invoiceDate != null && invoiceDate.getType() == DocumentFieldType.DATE) {
        System.out.printf("Date: %s%n", invoiceDate.getValueDate());
    }

    // Line items
    DocumentField lineItems = fields.get("Items");
    if (lineItems != null && lineItems.getType() == DocumentFieldType.LIST) {
        for (DocumentField lineItem : lineItems.getValueList()) {
            Map<String, DocumentField> itemFields = lineItem.getValueObject();
            System.out.printf("  Item: %s, Qty: %s, Amount: %s%n",
                getFieldString(itemFields, "Description"),
                getFieldString(itemFields, "Quantity"),
                getFieldString(itemFields, "Amount"));
        }
    }
}

// Helper
static String getFieldString(Map<String, DocumentField> fields, String key) {
    DocumentField field = fields.get(key);
    return (field != null) ? field.getContent() : "N/A";
}
```

---

## 5. Analyze ID Documents

```java
String idDocUrl = "https://raw.githubusercontent.com/Azure/azure-sdk-for-java/main/"
    + "sdk/documentintelligence/azure-ai-documentintelligence/"
    + "src/samples/resources/sample-forms/identityDocuments/license.jpg";

SyncPoller<AnalyzeOperationDetails, AnalyzeResult> poller =
    client.beginAnalyzeDocument("prebuilt-idDocument",
        new AnalyzeDocumentOptions(idDocUrl));

AnalyzeResult result = poller.getFinalResult();

for (AnalyzedDocument idDoc : result.getDocuments()) {
    Map<String, DocumentField> fields = idDoc.getFields();

    DocumentField firstName = fields.get("FirstName");
    DocumentField lastName = fields.get("LastName");
    DocumentField docNumber = fields.get("DocumentNumber");
    DocumentField dob = fields.get("DateOfBirth");

    if (firstName != null) System.out.printf("First Name: %s%n", firstName.getValueString());
    if (lastName != null) System.out.printf("Last Name: %s%n", lastName.getValueString());
    if (docNumber != null) System.out.printf("Document Number: %s%n", docNumber.getValueString());
    if (dob != null && dob.getType() == DocumentFieldType.DATE) {
        System.out.printf("Date of Birth: %s%n", dob.getValueDate());
    }
}
```

---

## 6. Build Custom Model

```java
import com.azure.ai.documentintelligence.models.*;
import com.azure.core.util.polling.SyncPoller;

String blobContainerUrl = "{SAS_URL_of_your_container_in_blob_storage}";

SyncPoller<DocumentModelBuildOperationDetails, DocumentModelDetails> poller =
    adminClient.beginBuildDocumentModel(
        new BuildDocumentModelOptions("my-custom-model", DocumentBuildMode.TEMPLATE)
            .setAzureBlobSource(new AzureBlobContentSource(blobContainerUrl)));

DocumentModelDetails model = poller.getFinalResult();

System.out.printf("Model ID: %s%n", model.getModelId());
System.out.printf("Description: %s%n", model.getDescription());
System.out.printf("Created: %s%n", model.getCreatedOn());

if (model.getDocumentTypes() != null) {
    model.getDocumentTypes().forEach((docType, details) -> {
        System.out.printf("Document type: %s%n", docType);
        details.getFieldSchema().forEach((field, schema) -> {
            System.out.printf("  Field: %s (%s)%n", field, schema.getType());
            if (details.getFieldConfidence() != null) {
                System.out.printf("  Confidence: %.2f%n",
                    details.getFieldConfidence().get(field));
            }
        });
    });
}
```

---

## 7. Analyze with Custom Model

```java
import java.util.Arrays;
import java.util.Collections;

String documentUrl = "{document-url}";
String modelId = "my-custom-model";

SyncPoller<AnalyzeOperationDetails, AnalyzeResult> poller =
    client.beginAnalyzeDocument(modelId,
        new AnalyzeDocumentOptions(documentUrl)
            .setPages(Collections.singletonList("1"))
            .setLocale("en-US")
            .setStringIndexType(StringIndexType.TEXT_ELEMENTS)
            .setDocumentAnalysisFeatures(
                Arrays.asList(DocumentAnalysisFeature.LANGUAGES))
            .setOutputContentFormat(DocumentContentFormat.TEXT));

AnalyzeResult result = poller.getFinalResult();

for (AnalyzedDocument doc : result.getDocuments()) {
    System.out.printf("Doc type: %s (confidence: %.2f)%n",
        doc.getDocumentType(), doc.getConfidence());
    doc.getFields().forEach((name, field) -> {
        System.out.printf("  %s: %s (confidence: %.2f)%n",
            name, field.getContent(), field.getConfidence());
    });
}

// Pages, lines, words
for (DocumentPage page : result.getPages()) {
    System.out.printf("Page %d: %.2f x %.2f %s%n",
        page.getPageNumber(), page.getWidth(), page.getHeight(), page.getUnit());
    for (DocumentLine line : page.getLines()) {
        System.out.printf("  Line: '%s'%n", line.getContent());
    }
    for (DocumentWord word : page.getWords()) {
        System.out.printf("  Word: '%s' (%.2f)%n",
            word.getContent(), word.getConfidence());
    }
}

// Tables
for (DocumentTable table : result.getTables()) {
    System.out.printf("Table: %d rows x %d columns%n",
        table.getRowCount(), table.getColumnCount());
    for (DocumentTableCell cell : table.getCells()) {
        System.out.printf("  Cell[%d,%d]: '%s'%n",
            cell.getRowIndex(), cell.getColumnIndex(), cell.getContent());
    }
}
```

---

## 8. Document Classification

### Build Classifier

```java
import java.util.HashMap;
import java.util.Map;

Map<String, ClassifierDocumentTypeDetails> docTypes = new HashMap<>();

docTypes.put("invoice", new ClassifierDocumentTypeDetails()
    .setAzureBlobSource(new AzureBlobContentSource(containerSasUrl)
        .setPrefix("invoices/")));

docTypes.put("receipt", new ClassifierDocumentTypeDetails()
    .setAzureBlobSource(new AzureBlobContentSource(containerSasUrl)
        .setPrefix("receipts/")));

SyncPoller<DocumentClassifierBuildOperationDetails, DocumentClassifierDetails> poller =
    adminClient.beginBuildClassifier(
        new BuildDocumentClassifierOptions("my-classifier", docTypes));

DocumentClassifierDetails classifier = poller.getFinalResult();
System.out.printf("Classifier ID: %s%n", classifier.getClassifierId());
System.out.printf("Created: %s%n", classifier.getCreatedOn());

classifier.getDocumentTypes().forEach((type, details) ->
    System.out.printf("  Type: %s%n", type));
```

### Classify a Document

```java
String documentUrl = "https://example.com/document.pdf";

SyncPoller<AnalyzeOperationDetails, AnalyzeResult> poller =
    client.beginClassifyDocument("my-classifier",
        new ClassifyDocumentOptions(documentUrl));

AnalyzeResult result = poller.getFinalResult();

for (AnalyzedDocument doc : result.getDocuments()) {
    System.out.printf("Type: %s (confidence: %.2f), pages: %d-%d%n",
        doc.getDocumentType(),
        doc.getConfidence(),
        doc.getBoundingRegions().get(0).getPageNumber(),
        doc.getBoundingRegions().get(doc.getBoundingRegions().size() - 1).getPageNumber());
}
```

---

## 9. Manage Models

```java
// Resource limits
DocumentIntelligenceResourceDetails resourceDetails = adminClient.getResourceDetails();
System.out.printf("Models: %d / %d%n",
    resourceDetails.getCustomDocumentModels().getCount(),
    resourceDetails.getCustomDocumentModels().getLimit());

// List all models
PagedIterable<DocumentModelDetails> models = adminClient.listModels();
for (DocumentModelDetails model : models) {
    System.out.printf("Model: %s (created: %s)%n",
        model.getModelId(), model.getCreatedOn());
}

// Get specific model
DocumentModelDetails model = adminClient.getModel("model-id");
System.out.printf("Model ID: %s%n", model.getModelId());
System.out.printf("Description: %s%n", model.getDescription());
System.out.printf("Created: %s%n", model.getCreatedOn());

if (model.getDocumentTypes() != null) {
    model.getDocumentTypes().forEach((docType, details) -> {
        details.getFieldSchema().forEach((field, schema) -> {
            System.out.printf("  Field: %s (%s)%n", field, schema.getType());
        });
    });
}

// Delete model
adminClient.deleteModel("model-id");
```

---

## 10. Async Pattern

```java
import com.azure.ai.documentintelligence.DocumentIntelligenceAsyncClient;
import reactor.core.publisher.Mono;

DocumentIntelligenceAsyncClient asyncClient = new DocumentIntelligenceClientBuilder()
    .endpoint(System.getenv("DOCUMENT_INTELLIGENCE_ENDPOINT"))
    .credential(new DefaultAzureCredentialBuilder().build())
    .buildAsyncClient();

// Async analyze from URL
asyncClient.beginAnalyzeDocument("prebuilt-layout",
        new AnalyzeDocumentOptions(documentUrl))
    .flatMap(poller -> poller.getFinalResult())
    .subscribe(result -> {
        System.out.printf("Content: %s%n", result.getContent());
        result.getPages().forEach(page ->
            System.out.printf("Page %d: %d lines%n",
                page.getPageNumber(), page.getLines().size()));
    }, error -> System.err.printf("Error: %s%n", error.getMessage()));
```

---

## 11. Error Handling

```java
import com.azure.core.exception.HttpResponseException;

try {
    SyncPoller<AnalyzeOperationDetails, AnalyzeResult> poller =
        client.beginAnalyzeDocument("prebuilt-receipt",
            new AnalyzeDocumentOptions("not-a-valid-url"));

    AnalyzeResult result = poller.getFinalResult();
} catch (HttpResponseException e) {
    System.err.printf("HTTP Error %d: %s%n",
        e.getResponse().getStatusCode(), e.getMessage());
} catch (Exception e) {
    System.err.printf("Error: %s%n", e.getMessage());
}
```

---

## 12. Complete Application Example

```java
import com.azure.ai.documentintelligence.DocumentIntelligenceClient;
import com.azure.ai.documentintelligence.DocumentIntelligenceClientBuilder;
import com.azure.ai.documentintelligence.models.*;
import com.azure.core.exception.HttpResponseException;
import com.azure.core.util.polling.SyncPoller;
import com.azure.identity.DefaultAzureCredentialBuilder;

import java.util.Map;

public class DocumentIntelligenceExample {

    public static void main(String[] args) {
        // Initialize client
        DocumentIntelligenceClient client = new DocumentIntelligenceClientBuilder()
            .endpoint(System.getenv("DOCUMENT_INTELLIGENCE_ENDPOINT"))
            .credential(new DefaultAzureCredentialBuilder().build())
            .buildClient();

        String receiptUrl = "https://raw.githubusercontent.com/Azure/azure-sdk-for-java/main/"
            + "sdk/documentintelligence/azure-ai-documentintelligence/"
            + "src/samples/resources/sample-forms/receipts/contoso-allinone.jpg";

        try {
            // Analyze receipt
            SyncPoller<AnalyzeOperationDetails, AnalyzeResult> poller =
                client.beginAnalyzeDocument("prebuilt-receipt",
                    new AnalyzeDocumentOptions(receiptUrl));

            AnalyzeResult result = poller.getFinalResult();

            System.out.printf("Analyzed %d document(s):%n", result.getDocuments().size());

            for (AnalyzedDocument doc : result.getDocuments()) {
                Map<String, DocumentField> fields = doc.getFields();

                printField("Merchant", fields.get("MerchantName"));
                printField("Date", fields.get("TransactionDate"));
                printField("Total", fields.get("Total"));

                DocumentField items = fields.get("Items");
                if (items != null && items.getType() == DocumentFieldType.LIST) {
                    System.out.println("Items:");
                    for (DocumentField item : items.getValueList()) {
                        Map<String, DocumentField> itemFields = item.getValueObject();
                        DocumentField desc = itemFields.get("Description");
                        DocumentField price = itemFields.get("TotalPrice");
                        System.out.printf("  - %s: %s%n",
                            desc != null ? desc.getContent() : "?",
                            price != null ? price.getContent() : "?");
                    }
                }
            }
        } catch (HttpResponseException e) {
            System.err.printf("Service error %d: %s%n",
                e.getResponse().getStatusCode(), e.getMessage());
        }
    }

    static void printField(String label, DocumentField field) {
        if (field != null) {
            System.out.printf("%s: %s (confidence: %.2f)%n",
                label, field.getContent(), field.getConfidence());
        }
    }
}
```

---

## Field Type Accessors Reference

| DocumentFieldType | Accessor Method |
|---|---|
| `STRING` | `getValueString()` |
| `DATE` | `getValueDate()` |
| `TIME` | `getValueTime()` |
| `PHONE_NUMBER` | `getValuePhoneNumber()` |
| `NUMBER` | `getValueNumber()` |
| `INTEGER` | `getValueInteger()` |
| `BOOLEAN` | `getValueBoolean()` |
| `LIST` | `getValueList()` → `List<DocumentField>` |
| `OBJECT` | `getValueObject()` → `Map<String, DocumentField>` |
| `CURRENCY` | `getValueCurrency()` → `CurrencyValue` |
| `ADDRESS` | `getValueAddress()` → `AddressValue` |
| `COUNTRY_REGION` | `getValueCountryRegion()` |
| `SELECTION_MARK` | `getValueSelectionMark()` |
| `SIGNATURE` | `getValueSignature()` |
| (any) | `getContent()` → raw string content |
