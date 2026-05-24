---
name: azure-ai-vision-imageanalysis-java
description: Build image analysis applications with Azure AI Vision SDK for Java. Use when implementing image captioning, OCR text extraction, object detection, tagging, or smart cropping.
license: MIT
metadata:
  author: Microsoft
  version: "1.0.0"
  package: com.azure:azure-ai-vision-imageanalysis
---

# Azure AI Vision Image Analysis SDK for Java

Build image analysis applications using the Azure AI Vision Image Analysis SDK for Java.

## Installation

```xml
<dependency>
    <groupId>com.azure</groupId>
    <artifactId>azure-ai-vision-imageanalysis</artifactId>
    <version>1.1.0-beta.1</version>
</dependency>
```

## Client Creation

### With API Key

```java
import com.azure.ai.vision.imageanalysis.ImageAnalysisClient;
import com.azure.ai.vision.imageanalysis.ImageAnalysisClientBuilder;
import com.azure.core.credential.KeyCredential;

String endpoint = System.getenv("VISION_ENDPOINT");
String key = System.getenv("VISION_KEY");

ImageAnalysisClient client = new ImageAnalysisClientBuilder()
    .endpoint(endpoint)
    .credential(new KeyCredential(key))
    .buildClient();
```

### Async Client

```java
import com.azure.ai.vision.imageanalysis.ImageAnalysisAsyncClient;

ImageAnalysisAsyncClient asyncClient = new ImageAnalysisClientBuilder()
    .endpoint(endpoint)
    .credential(new KeyCredential(key))
    .buildAsyncClient();
```

### With DefaultAzureCredential

```java
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

ImageAnalysisClient client = new ImageAnalysisClientBuilder()
    .endpoint(endpoint)
    .credential(credential)
    .buildClient();
```

## Visual Features

| Feature | Description |
|---------|-------------|
| `CAPTION` | Generate human-readable image description |
| `DENSE_CAPTIONS` | Captions for up to 10 regions |
| `READ` | OCR - Extract text from images |
| `TAGS` | Content tags for objects, scenes, actions |
| `OBJECTS` | Detect objects with bounding boxes |
| `SMART_CROPS` | Smart thumbnail regions |
| `PEOPLE` | Detect people with locations |

## Core Patterns

### Generate Caption

```java
import com.azure.ai.vision.imageanalysis.models.*;
import com.azure.core.util.BinaryData;
import java.io.File;
import java.util.Arrays;

// From file
BinaryData imageData = BinaryData.fromFile(new File("image.jpg").toPath());

ImageAnalysisResult result = client.analyze(
    imageData,
    Arrays.asList(VisualFeatures.CAPTION),
    new ImageAnalysisOptions().setGenderNeutralCaption(true));

System.out.printf("Caption: \"%s\" (confidence: %.4f)%n",
    result.getCaption().getText(),
    result.getCaption().getConfidence());
```

### Generate Caption from URL

```java
ImageAnalysisResult result = client.analyzeFromUrl(
    "https://example.com/image.jpg",
    Arrays.asList(VisualFeatures.CAPTION),
    new ImageAnalysisOptions().setGenderNeutralCaption(true));

System.out.printf("Caption: \"%s\"%n", result.getCaption().getText());
```

### Extract Text (OCR)

```java
ImageAnalysisResult result = client.analyze(
    BinaryData.fromFile(new File("document.jpg").toPath()),
    Arrays.asList(VisualFeatures.READ),
    null);

for (DetectedTextBlock block : result.getRead().getBlocks()) {
    for (DetectedTextLine line : block.getLines()) {
        System.out.printf("Line: '%s'%n", line.getText());
        System.out.printf("  Bounding polygon: %s%n", line.getBoundingPolygon());
        
        for (DetectedTextWord word : line.getWords()) {
            System.out.printf("  Word: '%s' (confidence: %.4f)%n",
                word.getText(),
                word.getConfidence());
        }
    }
}
```

### Detect Objects

```java
ImageAnalysisResult result = client.analyzeFromUrl(
    imageUrl,
    Arrays.asList(VisualFeatures.OBJECTS),
    null);

for (DetectedObject obj : result.getObjects()) {
    System.out.printf("Object: %s (confidence: %.4f)%n",
        obj.getTags().get(0).getName(),
        obj.getTags().get(0).getConfidence());
    
    ImageBoundingBox box = obj.getBoundingBox();
    System.out.printf("  Location: x=%d, y=%d, w=%d, h=%d%n",
        box.getX(), box.getY(), box.getWidth(), box.getHeight());
}
```

### Get Tags

```java
ImageAnalysisResult result = client.analyzeFromUrl(
    imageUrl,
    Arrays.asList(VisualFeatures.TAGS),
    null);

for (DetectedTag tag : result.getTags()) {
    System.out.printf("Tag: %s (confidence: %.4f)%n",
        tag.getName(),
        tag.getConfidence());
}
```

### Detect People

```java
ImageAnalysisResult result = client.analyzeFromUrl(
    imageUrl,
    Arrays.asList(VisualFeatures.PEOPLE),
    null);

for (DetectedPerson person : result.getPeople()) {
    ImageBoundingBox box = person.getBoundingBox();
    System.out.printf("Person at x=%d, y=%d (confidence: %.4f)%n",
        box.getX(), box.getY(), person.getConfidence());
}
```

### Smart Cropping

```java
ImageAnalysisResult result = client.analyzeFromUrl(
    imageUrl,
    Arrays.asList(VisualFeatures.SMART_CROPS),
    new ImageAnalysisOptions().setSmartCropsAspectRatios(Arrays.asList(1.0, 1.5)));

for (CropRegion crop : result.getSmartCrops()) {
    System.out.printf("Crop region: aspect=%.2f, x=%d, y=%d, w=%d, h=%d%n",
        crop.getAspectRatio(),
        crop.getBoundingBox().getX(),
        crop.getBoundingBox().getY(),
        crop.getBoundingBox().getWidth(),
        crop.getBoundingBox().getHeight());
}
```

### Dense Captions

```java
ImageAnalysisResult result = client.analyzeFromUrl(
    imageUrl,
    Arrays.asList(VisualFeatures.DENSE_CAPTIONS),
    new ImageAnalysisOptions().setGenderNeutralCaption(true));

for (DenseCaption caption : result.getDenseCaptions()) {
    System.out.printf("Caption: \"%s\" (confidence: %.4f)%n",
        caption.getText(),
        caption.getConfidence());
    System.out.printf("  Region: x=%d, y=%d, w=%d, h=%d%n",
        caption.getBoundingBox().getX(),
        caption.getBoundingBox().getY(),
        caption.getBoundingBox().getWidth(),
        caption.getBoundingBox().getHeight());
}
```

### Multiple Features

```java
ImageAnalysisResult result = client.analyzeFromUrl(
    imageUrl,
    Arrays.asList(
        VisualFeatures.CAPTION,
        VisualFeatures.TAGS,
        VisualFeatures.OBJECTS,
        VisualFeatures.READ),
    new ImageAnalysisOptions()
        .setGenderNeutralCaption(true)
        .setLanguage("en"));

// Access all results
System.out.println("Caption: " + result.getCaption().getText());
System.out.println("Tags: " + result.getTags().size());
System.out.println("Objects: " + result.getObjects().size());
System.out.println("Text blocks: " + result.getRead().getBlocks().size());
```

### Async Analysis

```java
asyncClient.analyzeFromUrl(
    imageUrl,
    Arrays.asList(VisualFeatures.CAPTION),
    null)
    .subscribe(
        result -> System.out.println("Caption: " + result.getCaption().getText()),
        error -> System.err.println("Error: " + error.getMessage()),
        () -> System.out.println("Complete")
    );
```

## Error Handling

```java
import com.azure.core.exception.HttpResponseException;

try {
    client.analyzeFromUrl(imageUrl, Arrays.asList(VisualFeatures.CAPTION), null);
} catch (HttpResponseException e) {
    System.out.println("Status: " + e.getResponse().getStatusCode());
    System.out.println("Error: " + e.getMessage());
}
```

## Environment Variables

```bash
VISION_ENDPOINT=https://<resource>.cognitiveservices.azure.com/ # Required for all auth methods
VISION_KEY=<your-api-key> # Only required for AzureKeyCredential auth
AZURE_TOKEN_CREDENTIALS=prod  # Required only if DefaultAzureCredential is used in production
```

## Image Requirements

- Formats: JPEG, PNG, GIF, BMP, WEBP, ICO, TIFF, MPO
- Size: < 20 MB
- Dimensions: 50x50 to 16000x16000 pixels

## Regional Availability

Caption and Dense Captions require GPU-supported regions. Check [supported regions](https://learn.microsoft.com/azure/ai-services/computer-vision/concept-describe-images-40) before deployment.

## Trigger Phrases

- "image analysis Java"
- "Azure Vision SDK"
- "image captioning"
- "OCR image text extraction"
- "object detection image"
- "smart crop thumbnail"
- "detect people image"
