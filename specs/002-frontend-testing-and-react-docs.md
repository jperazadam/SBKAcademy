# Spec: Testing Frontend y Documentación React 19

## Problema

El frontend no tiene un test runner configurado, así que no existe una forma estándar de ejecutar tests unitarios o de componentes. Además, la documentación del proyecto dice React 18, pero `frontend/package.json` declara React 19.2.5. Esa diferencia confunde porque la documentación y la configuración real del proyecto no dicen lo mismo.

## Alcance

Configurar una base mínima de testing para el frontend y corregir la documentación del stack React:

- **Frontend:** configurar Vitest con React Testing Library y jsdom.
- **Scripts:** agregar comandos npm para ejecutar tests desde `frontend/`.
- **Documentación:** actualizar las referencias de React 18 a React 19.

Tests E2E con Playwright, Cypress o navegador real quedan fuera de alcance para este cambio.

## Historias de usuario

1. **Como desarrollador**, quiero ejecutar tests del frontend con un comando claro para validar cambios sin revisar todo manualmente.
2. **Como desarrollador**, quiero poder testear componentes React en un entorno parecido al navegador sin levantar backend ni base de datos.
3. **Como lector del proyecto**, quiero que la documentación refleje la versión real de React para evitar decisiones basadas en información desactualizada.

## Criterios de aceptación

| # | Criterio |
|---|----------|
| 1 | `frontend/package.json` expone un script para ejecutar tests unitarios/componentes |
| 2 | El comando de tests corre desde `frontend/` y falla con exit code distinto de cero si un test falla |
| 3 | El entorno de tests soporta renderizado de componentes React con APIs DOM mediante jsdom |
| 4 | Los tests frontend no requieren backend, base de datos ni variables `DATABASE_URL` |
| 5 | Los tests escritos en TypeScript/TSX compilan y ejecutan con la configuración del frontend |
| 6 | La documentación del proyecto describe React 19 y no React 18 como stack activo |
| 7 | Este cambio no agrega Playwright, Cypress ni comandos E2E |

## Requisitos

### Requirement: Test Command Availability

The frontend package MUST expose a command that runs frontend unit and component tests from `frontend/`.

#### Scenario: Run frontend tests

- GIVEN a developer is in the `frontend/` directory
- WHEN they run the documented npm test command
- THEN unit/component tests SHALL execute through the frontend test runner
- AND the command SHALL exit non-zero when tests fail

#### Scenario: Backend independence

- GIVEN the backend server and database are unavailable
- WHEN the frontend test command is run
- THEN the test command MUST NOT require backend or database connectivity

### Requirement: React DOM-like Test Environment

The frontend test environment MUST support React component tests that need browser-like DOM APIs.

#### Scenario: Render a React component

- GIVEN a React component test exists
- WHEN the test renders the component
- THEN DOM queries and assertions SHALL be available to inspect rendered output

#### Scenario: Missing browser-only infrastructure

- GIVEN a component test uses standard DOM APIs supported by the configured environment
- WHEN the test runs outside a real browser
- THEN the test SHOULD behave consistently without requiring Playwright or browser automation

### Requirement: Vite and TypeScript Compatibility

The testing setup MUST be compatible with the existing Vite and TypeScript frontend workflow.

#### Scenario: TypeScript test files

- GIVEN a frontend test is written in TypeScript or TSX
- WHEN the test command runs
- THEN the test file SHALL compile and execute without a separate backend build step

#### Scenario: Vite React project integration

- GIVEN the frontend uses Vite with React
- WHEN tests import frontend modules
- THEN module resolution SHALL follow the Vite-compatible configuration used by the frontend project

### Requirement: React Version Documentation

Project documentation MUST describe the frontend as using React 19 consistently with `frontend/package.json`.

#### Scenario: Documentation version check

- GIVEN `frontend/package.json` declares React 19.x
- WHEN project documentation describes the frontend stack
- THEN it MUST refer to React 19 and MUST NOT describe the active stack as React 18

### Requirement: E2E Scope Boundary

This change MUST NOT introduce E2E, Playwright, or real-browser test requirements.

#### Scenario: E2E remains deferred

- GIVEN this change is implemented
- WHEN reviewing added test tooling and documentation
- THEN E2E tests SHALL be explicitly out of scope
- AND no E2E test command SHALL be required by this specification

## Fuera de alcance

- Tests E2E con Playwright, Cypress o Selenium.
- Tests del backend.
- Cobertura mínima obligatoria.
- Refactors de componentes no necesarios para configurar el entorno.
