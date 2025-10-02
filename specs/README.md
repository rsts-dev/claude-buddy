# Specifications Directory

This directory contains formal specification documents for features and APIs created using the `/buddy:spec` command.

## Structure

Each specification is organized in its own dated folder:

```
specs/
├── YYYYMMDD-three-word-summary/
│   └── spec.md
├── YYYYMMDD-another-feature/
│   └── spec.md
└── README.md
```

## Folder Naming Convention

- **Date Prefix**: `YYYYMMDD` format (e.g., `20251001`)
- **Three-Word Summary**: Kebab-case slug derived from the feature description
- **Example**: `20251001-user-management-api/`

## Creating Specifications

Use the `/buddy:spec` slash command with a feature description:

```
/buddy:spec basic api to support user management functionality
```

This will:
1. Create a new folder with today's date and a three-word summary
2. Generate a comprehensive specification document
3. Identify areas needing clarification
4. Present clarification questions for user input
5. Finalize the specification once all questions are answered

## Specification Lifecycle

1. **Draft**: Initial spec created with `[NEEDS CLARIFICATION]` markers
2. **Clarification**: Questions extracted and presented to user
3. **Ready for Review**: All clarifications resolved, spec finalized
4. **Planning**: Spec used as input for `/buddy:plan` command

## Template Alignment

Specifications follow templates defined in `.claude-buddy/templates/{foundation-type}/spec.md` and align with project foundation principles from `.claude-buddy/foundation.md`.
