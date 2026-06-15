<!--
name: 'Tool Description: Edit minimal old_string guidance'
description: Additional Edit guidance to keep old_string minimal and unique or use replace_all
ccVersion: 2.1.173
-->

- Keep `old_string` minimal — usually 1-3 lines, only enough to be unique in the file. Including excess context wastes tokens and is an error.
- The edit will FAIL if `old_string` is not unique in the file. In that case, add the minimum extra context needed for uniqueness, or use `replace_all` to change every instance.
