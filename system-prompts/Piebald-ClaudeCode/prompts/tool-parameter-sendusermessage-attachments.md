<!--
name: 'Tool Parameter: SendUserMessage attachments'
description: Describes optional SendUserMessage attachments as local file paths or pre-resolved file objects
ccVersion: 2.1.173
-->
Optional attachments for the user to see alongside your message. Each entry is either a file path (absolute or relative to cwd) for a file you can read locally, or a pre-resolved {file_uuid, file_name, size, is_image} object you obtained from a device tool such as attach_file.
