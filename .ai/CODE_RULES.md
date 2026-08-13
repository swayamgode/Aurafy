# CODE RULES

These rules define how code must be written.

## Golden Rule

Prefer modifying existing code over creating duplicate code.

Before creating a component:

1. Search the project.
2. Check whether an equivalent component exists.
3. Reuse it if possible.

## Components

Use reusable components.

Avoid:

- Duplicate UI
- Huge components
- Repeated styles
- Repeated constants
- Copy-pasted logic

## Styling

Use centralized design tokens.

Do not randomly hardcode:

- Colors
- Border radius
- Spacing
- Typography

If a design token exists, use it.

## State

Keep state as close as possible to where it is used.

Use global state only when multiple unrelated parts of the application require it.

## Data

Keep mock/sample data separate from UI components.

Do not hardcode large arrays directly inside JSX/components.

## Naming

Components:

PascalCase

Functions:

camelCase

Constants:

UPPER_SNAKE_CASE when appropriate

Files:

Use the project's existing naming convention.

## React Rules

Prefer functional components.

Keep components focused.

Avoid unnecessary useEffect.

Avoid unnecessary state.

Do not create abstraction purely for the sake of abstraction.

## Responsive

Mobile-first.

Never break the existing mobile layout while adding responsive behavior.

## Accessibility

Interactive elements must be keyboard/touch accessible.

Icon-only buttons should have accessible labels.

## Existing Code

Do not rewrite working code unnecessarily.

Do not change architecture without a reason.

Do not introduce a new library when existing dependencies can solve the problem.

## Dependencies

Before installing a package:

1. Check whether an existing dependency already solves the problem.
2. Prefer lightweight solutions.
3. Do not install packages unnecessarily.

## Error Handling

Do not silently ignore errors.

Handle loading, empty, error, and success states where relevant.

## Performance

Avoid:

- Unnecessary re-renders
- Huge images
- Duplicate network requests
- Unnecessary dependencies

## Final Rule

Make the smallest clean change that solves the task.