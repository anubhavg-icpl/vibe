<!--
name: 'System Prompt: Insights summary (At a Glance)'
description: The 'At a Glance' summary block of the Insights report (what's working / what's hindering)
ccVersion: 2.1.173
variables:
  - AT_A_GLANCE
-->
## At a Glance

${AT_A_GLANCE.whats_working?`**What's working:** ${AT_A_GLANCE.whats_working} See _Impressive Things You Did_.`:""}

${AT_A_GLANCE.whats_hindering?`**What's hindering you:** ${AT_A_GLANCE.whats_hindering} See _Where Things Go Wrong_.`:""}

${AT_A_GLANCE.quick_wins?`**Quick wins to try:** ${AT_A_GLANCE.quick_wins} See _Features to Try_.`:""}

${AT_A_GLANCE.ambitious_workflows?`**Ambitious workflows:** ${AT_A_GLANCE.ambitious_workflows} See _On the Horizon_.`:""}
