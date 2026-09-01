# Repository Guidelines

## Project Structure & Module Organization

This repository is currently an empty project scaffold. Keep the root focused on project-wide configuration and documentation. As implementation is added, use a predictable layout:

- `src/` for application or library code.
- `tests/` for automated tests that mirror the structure of `src/`.
- `assets/` for static files such as images, fixtures, or sample data.
- `docs/` for architecture notes and longer-form documentation.

Prefer small, cohesive modules. Do not commit generated output, dependency directories, secrets, or editor-specific files; add them to `.gitignore` first.

## Build, Test, and Development Commands

No build system or package manager is configured yet. When introducing one, expose the common workflow through a small, documented command set and update this section and the README in the same change. Prefer conventional commands such as:

- `npm run dev` to start a local development server.
- `npm test` to run the complete test suite.
- `npm run build` to create a production artifact.
- `npm run lint` to run static checks and formatting validation.

Until tooling is added, use `git status` and `git diff --check` before committing to catch unintended files and whitespace errors.

## Coding Style & Naming Conventions

Follow the formatter and linter configured for the chosen language; commit their configuration alongside the first source files. Use spaces rather than tabs unless the language standard requires otherwise. Choose descriptive names: `PascalCase` for types and components, `camelCase` for functions and variables, and `kebab-case` for documentation or asset filenames. Avoid unrelated formatting changes in feature commits.

## Testing Guidelines

Add tests with every behavior change or bug fix. Mirror source paths where practical and use names such as `tests/parser.test.ts` or the ecosystem-equivalent convention. Tests should be deterministic, isolated from external services by default, and include both expected behavior and important failure cases. Document any required integration-test setup.

## Commit & Pull Request Guidelines

There is no existing Git history from which to infer a convention. Use short, imperative commit subjects, optionally following Conventional Commits (for example, `feat: add prompt evaluator` or `fix: handle empty input`). Keep commits focused.

Pull requests should explain the problem, summarize the solution, list verification performed, and link relevant issues. Include screenshots or sample output for user-visible changes, and call out configuration changes, migrations, or follow-up work.
