# Engineering Standards

*Say "check engineering" to apply these standards to any code review or decision.*

---

## Core Principles

1. **Production Mindset** — Code like it's going live today
2. **Security First** — Never trust input, assume breach
3. **No Hacking** — No shortcuts, no "fix later" comments
4. **Fail Fast** — Surface problems immediately, never silently
5. **Explicit > Implicit** — Clear, readable, self-documenting

---

## Golden Rules (Non-Negotiable)

### 1. Never Fail Silently
```typescript
// ❌ Bad
catch (error) { return null; }

// ✅ Good
catch (error) {
  logger.error('Operation failed', { error: error.message, context });
  throw new SpecificError(`Failed: ${error.message}`);
}
```

### 2. No Hardcoded Mocks in Prod Paths
```typescript
// ❌ Bad — hidden mock
if (isDev) return 'paid';

// ✅ Good — explicit flag
if (allowMocking && isDev) {
  logger.info('Using mock data');
  return 'paid';
}
```

### 3. Tests Must Catch Real Problems
```typescript
// ❌ Bad — passes even when broken
expect(result).toBeTruthy();

// ✅ Good — verifies actual behavior
expect(result).toEqual({ id: 'user-123', status: 'active' });
```

### 4. Smoke Tests ≠ Health Checks
```bash
# ❌ Bad — only proves server started
curl /health

# ✅ Good — proves the feature works
curl -X POST /api/lookup -d '{"phone":"5551234567"}' | grep "contact_id"
```

### 5. Run Full Pipeline Before Done
```bash
# Always run before declaring ready:
npm run lint && npm run type-check && npm run test && npm run build
```

### 6. Trace the Full Data Path
For every new field/feature, verify:
- [ ] Schema has the field (DB/Salesforce/etc)
- [ ] Config maps the field (actual config, not just examples)
- [ ] Code fetches and passes it through
- [ ] Logs show it flowing (verify logging works)
- [ ] Data arrives at destination
- [ ] Can query/display it back

---

## Code Review Checklist

Before approving any code:

- [ ] **Security** — Input validated? Secrets in env vars?
- [ ] **Error Handling** — Fails fast with context? No silent catches?
- [ ] **Tests** — Cover the happy path AND failure cases?
- [ ] **Logging** — Appropriate levels? (info prod, trace debug)
- [ ] **Production Ready** — Handles load? Edge cases covered?

---

## Prohibited Practices

- ❌ Hardcoded credentials or secrets
- ❌ Silent error swallowing (`catch {}`)
- ❌ TODO comments without tickets
- ❌ `console.log` in production code
- ❌ Deploying without smoke test
- ❌ Mock data in production code paths

---

## Quick Reference

| Situation | Do This |
|-----------|---------|
| Data missing | Show explicit error, never hide |
| Test failing | Fix root cause, never skip |
| Quick fix needed | Create ticket, do it right |
| Not sure if ready | Run full pipeline first |
| Adding new field | Trace full data path |

---

*Apply these standards to every PR, every decision, every line of code.*
