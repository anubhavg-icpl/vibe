# Universal AI Rules System

This directory contains rules that work across ALL AI coding assistants:
- Amazon Q Developer
- Claude Code
- GitHub Copilot
- Google Gemini
- Aider
- Codex
- Any other AI assistant

## 📁 Directory Structure

```
.ai/rules/
├── core/                  # Fundamental rules (conversation, code quality)
├── workflows/             # Development workflow rules (git, testing, deployment)
├── languages/             # Language-specific rules (typescript, python, rust)
├── security/              # Security standards and best practices
└── README.md             # This file
```

## 🚀 How It Works

When you use the **Universal Rules Engine Mode**, it automatically:

1. **Scans** this directory for all `.md` and `.rule.md` files
2. **Loads** rules into the AI assistant's context
3. **Applies** relevant rules based on your requests
4. **Announces** which rules are being followed (transparency)
5. **Updates** dynamically when you modify rules

## 📋 Current Rules

### Core Rules
- **conversation.rule.md** - Defines how AI communicates and ensures transparency
- **code-quality.rule.md** - SOLID principles, DRY, KISS, YAGNI, documentation

### Workflow Rules
- **git-workflow.rule.md** - Git operations, commit messages, safety checks
- **testing-standards.rule.md** - Test coverage, testing pyramid, AAA pattern

### Security Rules
- **security-standards.rule.md** - OWASP Top 10, input validation, authentication

### Language Rules
- **typescript.rule.md** - TypeScript best practices and type safety

## ✨ Rule Format

Every rule follows this structure:

```markdown
# Rule Name
## Purpose
Clear explanation of why this rule exists

## Instructions
- Specific directive with unique identifier (ID: UNIQUE_ID)
- Another instruction (ID: ANOTHER_ID)
- More instructions (ID: YET_ANOTHER_ID)

## Priority
Critical/High/Medium/Low

## Error Handling
- What to do when things go wrong
- Fallback strategies
```

## 🎯 Using Rules

### Quick Start

1. **Activate the Universal Rules Engine Mode** from Vibe modes
2. Start your AI assistant - rules auto-load
3. Watch for rule announcements: `📋 Rules applied: filename (ID1, ID2)`

### Creating Custom Rules

1. **Choose the right category** (core, workflows, languages, security)
2. **Create a new .rule.md file** following the standard format
3. **Add clear instructions** with unique IDs
4. **Set appropriate priority** (Critical/High/Medium/Low)
5. **Define error handling** for edge cases

### Example: Creating a React Rule

```bash
cat > .ai/rules/languages/react.rule.md << 'EOF'
# React Standards
## Purpose
Maintain consistent React component patterns and best practices

## Instructions
- Use functional components with hooks (ID: FUNCTIONAL_COMPONENTS)
- Implement proper prop validation with PropTypes or TypeScript (ID: PROP_VALIDATION)
- Use meaningful component names that describe purpose (ID: COMPONENT_NAMING)
- Keep components small and focused - single responsibility (ID: SMALL_COMPONENTS)
- Use React.memo for expensive components (ID: USE_MEMO)
- Implement proper error boundaries (ID: ERROR_BOUNDARIES)

## Priority
Medium

## Error Handling
- If class components found, suggest refactoring to functional
- If missing prop validation, add PropTypes or TypeScript interfaces
EOF
```

## 🔧 Rule Priorities

Rules are applied based on priority when conflicts occur:

1. **Critical** - Must be followed without exception (security, conversation)
2. **High** - Should be followed unless conflicting with Critical (git, testing)
3. **Medium** - Important guidelines (code quality, language standards)
4. **Low** - Preferences that can be overridden (formatting, style)

## 📊 Rule Transparency

All rules announce themselves when applied:

```
📋 Rules applied: conversation.rule.md (ANNOUNCE_RULES),
                  git-workflow.rule.md (GIT_COMMIT_QUALITY, GIT_COMMIT_STYLE),
                  security-standards.rule.md (INPUT_VALIDATION)
```

This helps you:
- **Understand** why AI made certain decisions
- **Learn** which rules apply to different scenarios
- **Debug** unexpected behavior
- **Validate** rule effectiveness

## 🌐 Cross-Platform Compatibility

These rules work in multiple locations:

```
Primary locations (checked in order):
1. .amazonq/rules/    (Amazon Q Developer)
2. .claude/rules/     (Claude Code)
3. .copilot/rules/    (GitHub Copilot)
4. .gemini/rules/     (Google Gemini)
5. .ai/rules/         (Universal - you are here!)
6. .aider/rules/      (Aider)
7. .rules/            (Generic fallback)
```

**Recommendation**: Keep universal rules in `.ai/rules/` and create symlinks for platform-specific directories:

```bash
# For Amazon Q
ln -s ../.ai/rules .amazonq/rules

# For Claude Code
ln -s ../.ai/rules .claude/rules

# For Copilot
ln -s ../.ai/rules .copilot/rules
```

## 📚 Best Practices

### Start Small
Begin with 3-5 core rules:
- Conversation (transparency)
- Git workflow
- Code quality
- Security basics
- Testing

### Add as Needed
Create new rules when you find yourself:
- Repeating the same instructions to AI
- Seeing inconsistent code patterns
- Onboarding new team members
- Encountering recurring issues

### Review Regularly
- **Weekly**: Check which rules are most used
- **Monthly**: Update based on team feedback
- **Quarterly**: Archive unused rules
- **Yearly**: Major rule system review

### Keep Rules Focused
Each rule should:
- Address ONE domain or concern
- Have clear, actionable instructions
- Include specific IDs for traceability
- Define error handling
- Specify appropriate priority

## 🔍 Troubleshooting

### Rules Not Loading
✅ Check file has `.md` or `.rule.md` extension
✅ Verify file follows standard format
✅ Confirm directory structure is correct
✅ Restart AI session to reload rules

### Rules Not Being Applied
✅ Check rule priority (may be overridden)
✅ Verify instructions have unique IDs
✅ Ensure conversation.rule.md exists (required)
✅ Check for syntax errors in rule file

### Conflicting Rules
✅ Higher priority wins (Critical > High > Medium > Low)
✅ First loaded wins if same priority
✅ Add conflict resolution in Error Handling section

### Too Many Rules
✅ Consolidate related rules
✅ Archive unused rules to `.ai/rules/archive/`
✅ Create rule hierarchy with includes
✅ Use conditional instructions

## 🎨 Advanced Features

### Rule Composition
Rules can reference other rules:

```markdown
## Instructions
- Apply Code Quality rules (ID: INHERIT_CODE_QUALITY)
- Apply Security Standards (ID: INHERIT_SECURITY)
- Additional frontend-specific rules (ID: FRONTEND_SPECIFIC)
```

### Conditional Rules
Rules can include conditions:

```markdown
## Instructions
- IF file size > 50KB, suggest code splitting (ID: CODE_SPLIT)
- IF list > 100 items, implement virtualization (ID: VIRTUAL_SCROLL)
- IF API response > 2s, add caching (ID: CACHE_SLOW_API)
```

### Rule Metrics
Track effectiveness (optional):

```markdown
## Instructions
- Log rule usage with timestamps (ID: LOG_USAGE)
- Generate weekly usage report (ID: WEEKLY_REPORT)
```

## 📖 Resources

- **Universal Rules Engine Mode**: `vibe/modes/specialized/universal-rules-engine-mode.md`
- **AWS Blog**: [Mastering Amazon Q Developer with Rules](https://aws.amazon.com/blogs/devops/mastering-amazon-q-developer-with-rules/)
- **Vibe Modes Collection**: Full catalog of specialized AI chat modes

## 🤝 Contributing

To add new rules to this system:

1. Choose appropriate category (or create new)
2. Follow standard rule format
3. Add unique IDs to all instructions
4. Set appropriate priority
5. Define comprehensive error handling
6. Test with multiple AI assistants
7. Update this README

## 💡 Examples

### Monitoring Rule
```markdown
# Monitoring Coverage
## Purpose
Ensure all major features have monitoring, metrics, and alerts

## Instructions
- When implementing major features, check MONITORING_PLAN.md (ID: CHECK_MONITORING)
- Update monitoring plan with metrics and dashboards (ID: UPDATE_MONITORING)
- Output confirmation: "📊 Updated monitoring plan" (ID: MONITORING_CONFIRM)

## Priority
High
```

### API Design Rule
```markdown
# API Design
## Purpose
Maintain consistent RESTful API design patterns

## Instructions
- Use plural nouns for collections (ID: PLURAL_COLLECTIONS)
- Proper HTTP methods (GET/POST/PUT/DELETE/PATCH) (ID: HTTP_METHODS)
- Include pagination for lists (ID: PAGINATION)
- Version APIs: /v1/resource (ID: API_VERSIONING)

## Priority
High
```

## 🎯 Success Metrics

Track these to measure effectiveness:

1. **Consistency Score**: % of code following standards (target: >90%)
2. **Onboarding Time**: New developer to productive (target: <3 days)
3. **Rule Coverage**: % of scenarios with rules (target: >80%)
4. **Rule Usage**: % of AI interactions using rules (target: >70%)
5. **Developer Satisfaction**: Team feedback (target: >4/5)

---

**Universal AI Rules System** | Define once, enforce everywhere | Works with all AI assistants
