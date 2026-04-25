# Contributing to AstroStack UI

Thank you for taking the time to contribute. This document describes the conventions, workflow, and quality standards used in this project.

---

## Table of Contents

- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Code Standards](#code-standards)
  - [Language](#language)
  - [TypeScript](#typescript)
  - [Architecture & Separation of Concerns](#architecture--separation-of-concerns)
  - [React Components](#react-components)
  - [State Management](#state-management)
  - [Styling](#styling)
  - [Comments](#comments)
- [Commit Messages](#commit-messages)
- [Pull Requests](#pull-requests)
- [Reporting Issues](#reporting-issues)

---

## Getting Started

```bash
git clone https://github.com/x42en/astro-stack-ui.git
cd astro-stack-ui
npm install
cp .env.example .env   # set VITE_API_BASE_URL to your local backend
npm run dev
```

Make sure a local [AstroStack](https://github.com/x42en/astro-stack) backend is running before testing API-dependent features.

---

## Development Workflow

1. **Fork** the repository and create a feature branch from `main`.
2. Write your changes. Run `npm run typecheck` and `npm run lint` before committing — the CI will reject any branch that fails these checks.
3. Open a **pull request** against `main`. Keep the scope focused: one logical change per PR.
4. At least one approving review is required before merging.

---

## Code Standards

### Language

**All code, comments, commit messages, PR titles, and PR descriptions must be written in English.** This includes variable names, function names, type names, inline comments, and JSDoc.

> No French, no mixed-language strings. English is the universal language of open-source code.

---

### TypeScript

This project uses TypeScript in **strict mode**. The following rules are non-negotiable.

**No `any`.** If an external type is truly unknown, use `unknown` and narrow it explicitly:

```typescript
// Bad
function parse(data: any): SomeType { ... }

// Good
function parse(data: unknown): SomeType {
  if (!isSomeType(data)) throw new Error('Unexpected shape');
  return data;
}
```

**No implicit `any`.** Every function parameter, return type, and exported value must carry an explicit type annotation.

**No type assertions unless unavoidable.** Prefer type guards over `as T`. When `as` is the only option, leave a comment explaining why.

**Prefer `interface` for object shapes, `type` for unions and aliases.**

**Use strict null checks.** Never assume a value is non-null without checking it first.

**Prefer `const` over `let`.** Avoid `var` entirely.

---

### Architecture & Separation of Concerns

The project follows a strict layered architecture. Keep each layer responsible for exactly one thing.

| Layer | Directory | Responsibility |
|---|---|---|
| **Types** | `src/types/` | Shared TypeScript interfaces and type aliases. No logic, no imports from other layers. |
| **Services** | `src/services/` | Raw API calls. Returns data or throws typed errors. No UI logic, no Zustand. |
| **Stores** | `src/store/` | Client state management via Zustand. Consumes services where appropriate. No JSX. |
| **Hooks** | `src/hooks/` | Reusable React logic (side effects, subscriptions). No direct API calls — use services. |
| **Lib** | `src/lib/` | Pure utility functions (formatting, validation, constants). No React, no side effects. |
| **Components** | `src/components/` | Presentational and composed UI. Reads from stores or accepts props. No direct API calls. |
| **Pages** | `src/pages/` | Route-level components. Compose components and wire up mutations/queries. |

**Do not break these boundaries.** A service must not import from a component. A component must not call `axios` directly. A store must not render JSX.

**Do not share code between edge functions.** Each Supabase Edge Function is self-contained.

---

### React Components

- **One component per file.** Small private sub-components used only within a file may be co-located, but keep the file under ~300 lines; split earlier if it becomes hard to navigate.
- **No default exports for components.** Use named exports.
- **Props must be typed explicitly** with an `interface` declared above the component function.
- **No inline object or array literals in JSX props** that would trigger unnecessary re-renders. Extract them to `useMemo` / `useCallback` where needed.
- **Avoid `useEffect` for data fetching.** Use TanStack Query (`useQuery`, `useMutation`) instead.
- **Keep render functions free of logic.** Move complex expressions into named variables before the return statement.

---

### State Management

- Global, cross-component state lives in a Zustand store in `src/store/`.
- Server state (API responses) is owned by TanStack Query. Do not duplicate server state in a Zustand store.
- Local component state (`useState`) is fine for UI-only concerns (modal open state, form fields before submission).
- Persisted stores (via `zustand/middleware` `persist`) must explicitly `partialize` the fields they persist to avoid storing ephemeral data.

---

### Styling

- All styles use **Tailwind CSS utility classes**. No custom CSS files, no `style` prop for anything that can be expressed with Tailwind.
- The project palette is defined in `tailwind.config.js`. **Do not use purple, indigo, or violet hues** — use the `primary`, `accent`, `success`, `warning`, `error`, and `text-*` tokens already defined.
- Use the 8-point spacing scale (`p-2`, `gap-4`, etc.). Do not use arbitrary values (`p-[13px]`) unless you have a concrete, documented reason.
- Follow the design system conventions already established in existing components before introducing a new visual pattern.

---

### Comments

Write comments **only when the *why* is non-obvious**: a hidden constraint, a subtle invariant, a framework quirk, or a workaround for a known bug.

Do **not** write comments that:
- Describe what the code does (well-named identifiers already do that).
- Reference the task, issue number, or PR that introduced the code (that belongs in the commit message or PR description, where it will be found by git log).
- State the obvious (`// increment i`).

Keep inline comments to a single line. Avoid multi-line comment blocks except for complex algorithmic explanations.

---

## Commit Messages

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification.

```
<type>(<scope>): <short imperative summary>

[optional body — explain WHY, not WHAT]

[optional footer — breaking changes, closes #issue]
```

**Allowed types:**

| Type | When to use |
|---|---|
| `feat` | A new feature visible to the user |
| `fix` | A bug fix |
| `refactor` | Code restructuring with no behaviour change |
| `style` | Formatting, whitespace, Tailwind class reordering |
| `test` | Adding or updating tests |
| `docs` | Documentation only |
| `build` | Build system, Dockerfile, CI workflow changes |
| `chore` | Dependency updates, tooling, repo housekeeping |

**Rules:**
- Use the imperative mood in the summary: `add`, `fix`, `remove` — not `added`, `fixes`, `removed`.
- Keep the summary under 72 characters.
- Reference issues in the footer: `Closes #42`.
- Breaking changes must include `BREAKING CHANGE:` in the footer.

---

## Pull Requests

- **Title** follows the same Conventional Commits format as a commit message.
- **Description** must explain *what* changed and *why*. Include screenshots for any UI change.
- Keep PRs small and focused. A diff above ~400 lines warrants a discussion before opening.
- Ensure `npm run typecheck` and `npm run lint` pass locally before pushing.
- The Docker build is validated on every PR via the GitHub Actions workflow (build-only, no push).
- Squash-merge into `main`. The PR title becomes the squash commit message.

---

## Reporting Issues

Use [GitHub Issues](https://github.com/x42en/astro-stack-ui/issues). Include:
- **Environment:** browser, OS, Docker version, AstroStack backend version.
- **Steps to reproduce.**
- **Expected vs. actual behaviour.**
- **Relevant logs** from the browser console or Docker container.
