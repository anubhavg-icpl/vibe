# Universal Rules System - Quick Setup Guide

Transform ANY AI coding assistant into a context-aware development partner that automatically follows your team's standards!

## 🎯 What Is This?

The Universal Rules Engine is a cross-platform system that makes AI assistants (Amazon Q, Claude Code, Copilot, Gemini, Aider, etc.) automatically follow your coding standards, workflows, and best practices.

**Key Benefits:**
- ✅ Define standards once, apply everywhere
- ✅ Consistent AI guidance across all platforms
- ✅ Transparent rule application (you see which rules are used)
- ✅ Zero repetitive explanations to AI
- ✅ Faster onboarding for new team members

## 🚀 Quick Start (5 Minutes)

### Step 1: Activate the Mode

Use the **Universal Rules Engine Mode** from the Vibe collection:

```
vibe/modes/specialized/universal-rules-engine-mode.md
```

### Step 2: Rules Are Already Set Up!

This repository includes starter rules in `.ai/rules/`:

```
.ai/rules/
├── core/
│   ├── conversation.rule.md       # Rule transparency
│   └── code-quality.rule.md       # SOLID, DRY, KISS, YAGNI
├── workflows/
│   ├── git-workflow.rule.md       # Git operations
│   └── testing-standards.rule.md  # Test coverage
├── security/
│   └── security-standards.rule.md # OWASP Top 10
└── languages/
    └── typescript.rule.md         # TypeScript best practices
```

### Step 3: Start Using AI with Rules

When you interact with any AI assistant with the Universal Rules Engine active, you'll see:

```
📋 Rules applied: conversation.rule.md (ANNOUNCE_RULES),
                  code-quality.rule.md (SOLID_PRINCIPLES, DRY_PRINCIPLE)
```

**That's it!** Your AI now automatically follows all loaded rules.

## 📚 Understanding Rule Announcements

Every AI response will start with which rules it followed:

### Example 1: Git Commit
```
📋 Rules applied: git-workflow.rule.md (GIT_COMMIT_QUALITY, GIT_COMMIT_STYLE)

I'll create a detailed commit message for these changes...
```

### Example 2: TypeScript Code
```
📋 Rules applied: typescript.rule.md (STRICT_MODE, EXPLICIT_RETURN_TYPES),
                  code-quality.rule.md (SOLID_PRINCIPLES)

Here's the implementation with proper typing...
```

### Example 3: Security Review
```
📋 Rules applied: security-standards.rule.md (INPUT_VALIDATION, SQL_INJECTION_PREVENTION)

⚠️ SECURITY ISSUE: This code concatenates user input into SQL query...
```

## 🔧 Customizing Rules

### Adding Your First Custom Rule

Let's create a React component rule:

```bash
# Create the file
cat > .ai/rules/languages/react.rule.md << 'EOF'
# React Component Standards
## Purpose
Maintain consistent React patterns across all components

## Instructions
- Use functional components with hooks (ID: FUNCTIONAL_COMPONENTS)
- Implement PropTypes or TypeScript interfaces (ID: PROP_VALIDATION)
- Keep components under 200 lines (ID: COMPONENT_SIZE)
- Use meaningful names: UserProfile, not Profile (ID: COMPONENT_NAMING)
- Extract reusable logic to custom hooks (ID: CUSTOM_HOOKS)

## Priority
Medium

## Error Handling
- If class component found, suggest refactoring to functional
- If missing prop validation, add TypeScript interfaces
EOF
```

**That's it!** The rule is now active. Next time you work on React code:

```
📋 Rules applied: react.rule.md (FUNCTIONAL_COMPONENTS, PROP_VALIDATION)

I'll create a functional component with TypeScript props...
```

## 🎨 Rule Template

Use this template for all new rules:

```markdown
# Rule Name
## Purpose
Clear, concise explanation of why this rule exists

## Instructions
- Specific directive with unique ID (ID: UNIQUE_ID_1)
- Another instruction (ID: UNIQUE_ID_2)
- More instructions (ID: UNIQUE_ID_3)

## Priority
Critical/High/Medium/Low

## Error Handling
- What to do if things go wrong
- Fallback strategies
```

## 🌐 Multi-Platform Support

### Option 1: Universal Directory (Recommended)
Keep all rules in `.ai/rules/` - works with all platforms automatically.

### Option 2: Platform-Specific Directories
Create platform-specific directories as needed:

```bash
# Amazon Q Developer
mkdir -p .amazonq/rules
ln -s ../.ai/rules/* .amazonq/rules/

# Claude Code
mkdir -p .claude/rules
ln -s ../.ai/rules/* .claude/rules/

# GitHub Copilot
mkdir -p .copilot/rules
ln -s ../.ai/rules/* .copilot/rules/

# Google Gemini
mkdir -p .gemini/rules
ln -s ../.ai/rules/* .gemini/rules/

# Aider
mkdir -p .aider/rules
ln -s ../.ai/rules/* .aider/rules/
```

### Option 3: Mixed Approach
Universal rules in `.ai/rules/`, platform-specific overrides in platform directories.

Priority order (first match wins):
1. `.amazonq/rules/` (Amazon Q)
2. `.claude/rules/` (Claude Code)
3. `.copilot/rules/` (Copilot)
4. `.gemini/rules/` (Gemini)
5. `.ai/rules/` (Universal) ← You are here
6. `.aider/rules/` (Aider)
7. `.rules/` (Fallback)

## 📋 Common Rule Examples

### Monitoring Coverage
```markdown
# Monitoring
## Purpose
Ensure all features have monitoring, metrics, and alerts

## Instructions
- Check MONITORING_PLAN.md for major features (ID: CHECK_MONITORING)
- Update with metrics, dashboards, alerts (ID: UPDATE_MONITORING)
- Output: "📊 Updated monitoring plan for: [feature]" (ID: CONFIRM_UPDATE)

## Priority
High
```

### API Design Standards
```markdown
# API Design
## Purpose
Consistent RESTful API patterns

## Instructions
- Use plural nouns: /users not /user (ID: PLURAL_COLLECTIONS)
- Proper HTTP methods (GET/POST/PUT/DELETE) (ID: HTTP_METHODS)
- Include pagination for lists (ID: PAGINATION)
- Version APIs: /v1/resource (ID: API_VERSIONING)
- Include rate limiting headers (ID: RATE_LIMITING)

## Priority
High
```

### Documentation Requirements
```markdown
# Documentation
## Purpose
Comprehensive documentation for all public APIs

## Instructions
- JSDoc for all public functions (ID: JSDOC_PUBLIC)
- README for all packages (ID: PACKAGE_README)
- Examples for complex usage (ID: USAGE_EXAMPLES)
- Update docs with code changes (ID: UPDATE_DOCS)

## Priority
Medium
```

## 🎯 Rule Priorities Explained

Choose the right priority for your rule:

**Critical** - Must be followed, no exceptions
- Security standards
- Rule transparency (conversation)
- Never commit secrets

**High** - Should be followed unless conflicts with Critical
- Git workflow safety
- Testing requirements
- Input validation

**Medium** - Important guidelines
- Code quality standards
- Language-specific practices
- Documentation requirements

**Low** - Preferences, can be overridden
- Formatting styles
- Comment preferences
- Variable naming suggestions

## 🔍 Troubleshooting

### Rules Not Showing Up?

**Check:**
1. ✅ File extension is `.md` or `.rule.md`
2. ✅ File follows standard format (Purpose, Instructions, Priority, Error Handling)
3. ✅ All instructions have unique IDs
4. ✅ `conversation.rule.md` exists (required for transparency)
5. ✅ Restart AI session to reload rules

### Too Many Rule Announcements?

Adjust the conversation rule to be less verbose:

```markdown
# Conversation
## Instructions
- Announce only high/critical priority rules (ID: ANNOUNCE_IMPORTANT)
```

### Conflicting Rules?

Rules are applied by priority:
- **Critical** overrides everything
- **High** overrides Medium and Low
- **Medium** overrides Low
- Same priority: First loaded wins

Add conflict resolution in Error Handling section.

## 📊 Measuring Success

Track these metrics to see the impact:

1. **Consistency**: Are PRs following standards? (Target: >90%)
2. **Onboarding**: Time for new dev to first PR (Target: <3 days)
3. **Rule Coverage**: % of scenarios covered (Target: >80%)
4. **Rule Usage**: % of AI interactions using rules (Target: >70%)
5. **Developer Satisfaction**: Team survey (Target: >4/5)

## 🎓 Next Steps

### Week 1: Learn the System
- Use existing rules
- Observe which rules apply to different tasks
- Understand the transparency system

### Week 2: Customize
- Add 2-3 project-specific rules
- Modify existing rules for your workflow
- Get team feedback

### Week 3: Expand
- Add language-specific rules
- Create domain-specific rules (frontend, backend, etc.)
- Share rules across team

### Month 2+: Optimize
- Review rule usage analytics
- Archive unused rules
- Refine based on team feedback
- Build rule library

## 💡 Pro Tips

1. **Start Small**: Begin with 5-6 core rules, expand gradually
2. **Be Specific**: Vague rules lead to inconsistent application
3. **Use IDs**: Makes debugging and understanding much easier
4. **Review Regularly**: Rules should evolve with your practices
5. **Version Control**: Track rule changes in git
6. **Team Involvement**: Get feedback from all team members
7. **Document Why**: Purpose section is crucial for long-term maintenance

## 📖 Resources

- **Full Mode Documentation**: `modes/specialized/universal-rules-engine-mode.md`
- **Rule System README**: `.ai/rules/README.md`
- **AWS Blog Article**: [Mastering Amazon Q Developer with Rules](https://aws.amazon.com/blogs/devops/mastering-amazon-q-developer-with-rules/)
- **Vibe Modes Collection**: Browse all 24 specialized modes

## 🤝 Getting Help

- **Check** `.ai/rules/README.md` for detailed documentation
- **Review** example rules in `.ai/rules/` directories
- **Experiment** with different rule configurations
- **Share** your custom rules with the team

## 🎉 Success Story

**Before Rules:**
```
You: "Create a React component for user profiles"
AI: [Creates component with inconsistent patterns]
You: "Use TypeScript and functional components please"
AI: [Updates]
You: "Add PropTypes validation"
AI: [Updates again]
You: "Follow our naming convention"
AI: [Another update...]
```

**After Rules:**
```
You: "Create a React component for user profiles"
📋 Rules applied: react.rule.md (FUNCTIONAL_COMPONENTS, PROP_VALIDATION),
                  typescript.rule.md (EXPLICIT_RETURN_TYPES)
AI: [Creates perfect component following all standards on first try]
```

**Result:** 5 back-and-forth iterations reduced to 1. Time saved: ~15 minutes per component. Consistency: 100%.

---

**Universal Rules System** | Define once, enforce everywhere | Transform AI assistance

**Ready to get started?** Just activate the Universal Rules Engine Mode and start coding! Your AI assistant is now a standards-following development partner. 🚀
