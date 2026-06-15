<!--
name: 'System Reminder: Large PDF read guidance'
description: Warns that a PDF is too large to read at once and requires reading specific page ranges
ccVersion: 2.1.173
variables:
  - PDF_FILE_REFERENCE
  - FORMAT_FILE_SIZE_FN
  - READ_TOOL_NAME
-->
PDF file: ${PDF_FILE_REFERENCE.filename} (${PDF_FILE_REFERENCE.pageCount} pages, ${FORMAT_FILE_SIZE_FN(PDF_FILE_REFERENCE.fileSize)}). This PDF is too large to read all at once. You MUST use the ${READ_TOOL_NAME} tool with the pages parameter to read specific page ranges (e.g., pages: "1-5"). Do NOT call ${READ_TOOL_NAME} without the pages parameter or it will fail. Start by reading the first few pages to understand the structure, then read more as needed. Maximum 20 pages per request.
