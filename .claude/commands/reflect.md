Review today's conversation and suggest improvements to CLAUDE.md, memories, and skills.

## Steps

### 1. Analyze the conversation

Scan the full conversation for:

- **Repeated corrections** — things the user corrected more than once, or corrections that aren't yet captured in CLAUDE.md or feedback memories
- **New workflows** — multi-step processes the user walked through that could become a skill or command
- **Knowledge gaps** — moments where you gave wrong or incomplete answers that better CLAUDE.md instructions could prevent
- **Missing context** — information you had to ask for or look up that a memory could have provided upfront
- **Stale guidance** — anything in CLAUDE.md or memories that contradicted what the user actually wanted

### 2. Review current configuration

Read these files for comparison:

- `/Users/jordangraham/Desktop/Projects/DeckTrader/CLAUDE.md`
- `/Users/jordangraham/.claude/projects/-Users-jordangraham-Desktop-Projects-DeckTrader/memory/MEMORY.md` (and any referenced memory files that seem relevant)
- List commands in `/Users/jordangraham/Desktop/Projects/DeckTrader/.claude/commands/`

### 3. Generate suggestions

Output suggestions grouped into these categories. Skip any category with no suggestions.

```markdown
## Reflect: Conversation Review

### CLAUDE.md Changes
<!-- Rules, patterns, or instructions that should be added, updated, or removed -->
- **Add/Update/Remove**: <what> — <why, based on what happened in the conversation>

### New Memories
<!-- Information learned during the conversation worth persisting -->
- **Type** (`user`/`feedback`/`project`/`reference`): <summary> — <why it's worth remembering>

### Memory Updates
<!-- Existing memories that are stale or need correction -->
- **Update/Remove** `<filename>`: <what changed> — <why>

### New Skills or Commands
<!-- Workflows that were repeated or complex enough to codify -->
- **Skill/Command** `<name>`: <what it would do> — <evidence from conversation>

### Skill/Command Updates
<!-- Existing skills that need improvement based on how they performed -->
- **Update** `<name>`: <what to change> — <why>
```

### 4. Prioritize

After listing suggestions, add a **Top 3** section ranking the highest-impact changes. Consider:
- How likely is the issue to recur?
- How much time would the fix save?
- How bad is the failure mode if it's not fixed?

### 5. Apply changes (MANDATORY)

After generating and displaying suggestions, apply them in two categories:

**Apply immediately** (quick edits that take effect now):
- CLAUDE.md additions/updates/removals — edit the file directly
- New memories — create memory files and update MEMORY.md index
- Memory updates — edit or remove stale memory files, update MEMORY.md

**Add to backlog** (work that needs a future session to implement):
- New skills or commands to build
- Larger CLAUDE.md restructuring
- Anything requiring new code, tests, or multi-file changes

Append backlog items to `/Users/jordangraham/Desktop/Projects/DeckTrader/BACKLOG.md` (create if missing). Format:

```markdown
### YYYY-MM-DD — <short title>
- [ ] <actionable item>
- [ ] <actionable item>
```

Newest entries at the top. Don't duplicate items already in the backlog.

After applying, list what was saved so the user can verify.

## Rules

- Only suggest changes backed by specific evidence from the conversation — no speculative improvements
- Don't suggest things that are already covered in CLAUDE.md or memories
- Keep suggestions actionable — say exactly what to add/change/remove, not vague directions
- Always apply changes — never leave suggestions as just text output
