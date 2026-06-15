<!--
name: 'Tool Description: Browser file upload'
description: Describes the browser file upload tool, which uploads shared files directly to a page file input by element ref and enforces the 10 MB combined size limit
ccVersion: 2.1.163
-->
Upload one or multiple files to a file input element on the page. Do not click on file upload buttons or file inputs — clicking opens a native file picker dialog that you cannot see or interact with. Instead, use read_page or find to locate the file input element, then use this tool with its ref to upload files directly. Only files the user has shared with this session (attachments, the session's outputs/uploads folders, or folders the user has connected) can be uploaded; other paths will be rejected. The combined size of all files in a single call must stay under 10 MB.
