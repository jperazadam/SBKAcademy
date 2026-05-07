# Spec: Classes Schedule MVP

## Purpose

Authenticated teachers can manage active dance classes with recurring weekly schedule entries. A Monday/Wednesday class is one class with two schedule entries, not duplicated classes.

## Scope

| In scope | Out of scope |
|---|---|
| Teacher-scoped classes, schedules, validation, generated display name, soft-delete, active list, tests | Enrollment, attendance, payments, reactivation, inactive filters, capacity, hard-delete |

## Requirements

### Requirement: Teacher-Scoped Classes API

The backend MUST expose protected REST endpoints for classes. All reads and mutations MUST be scoped to the authenticated teacher.

#### Scenario: Reject unauthenticated access

- GIVEN a request to any classes endpoint has no valid token
- WHEN it is processed
- THEN the API MUST return HTTP 401 with `{ "error": "Unauthorized" }`

#### Scenario: List own active classes

- GIVEN a teacher is authenticated
- WHEN they request the normal classes list
- THEN the API MUST return only their active classes
- AND each class MUST include its schedule entries

#### Scenario: Prevent cross-teacher access

- GIVEN teacher A is authenticated and a class belongs to teacher B
- WHEN teacher A reads, updates, or deactivates that class by id
- THEN the API MUST NOT expose or mutate teacher B's class

### Requirement: Class Data and Display Name

Classes MUST require `type` and `level`; `name` MAY be omitted. `type` MUST be Salsa, Bachata, or Kizomba. `level` MUST be Inicio, Medio, or Avanzado.

#### Scenario: Create valid class

- GIVEN an authenticated teacher submits valid class data
- WHEN the API creates the class
- THEN it MUST be stored under that teacher
- AND the response MUST include the created class

#### Scenario: Generate display name

- GIVEN a class has type `Salsa`, level `Medio`, and no custom name
- WHEN it is returned or rendered
- THEN its display name MUST be generated as `Salsa medio`

#### Scenario: Reject invalid class fields

- GIVEN `type` or `level` is missing or not allowed
- WHEN create or update is submitted
- THEN the API MUST return HTTP 400 with `{ "error": string }`

### Requirement: Weekly Schedule Entries

A class MUST have one or more weekly schedule entries. Each entry MUST include day of week, `startTime`, and `endTime`. Time SHOULD use `HH:mm` unless existing conventions require otherwise.

#### Scenario: Store repeated class as one class

- GIVEN a teacher submits one class with Monday and Wednesday entries
- WHEN the API creates the class
- THEN the system MUST store one class with two schedule entries
- AND the UI MUST show both entries under that class

#### Scenario: Reject invalid schedule time

- GIVEN a schedule entry has missing times or `endTime` is not after `startTime`
- WHEN create or update is submitted
- THEN the API MUST return HTTP 400 with `{ "error": string }`

### Requirement: Soft Delete / Deactivation

Delete behavior MUST deactivate classes instead of hard-deleting records.

#### Scenario: Deactivate own class

- GIVEN a teacher owns an active class
- WHEN they delete/deactivate it
- THEN it MUST become inactive
- AND it MUST NOT appear in the default classes list

### Requirement: Frontend Classes UX

The frontend MUST provide private list, create, edit, and deactivate flows using only the REST API.

#### Scenario: Active classes list renders

- GIVEN a teacher is logged in
- WHEN they open the classes page
- THEN the UI MUST show active classes with display names and schedule entries

#### Scenario: Form validation

- GIVEN required class or schedule fields are invalid
- WHEN the teacher submits the form
- THEN the UI SHOULD show validation feedback
- AND SHOULD avoid sending invalid data when possible

#### Scenario: Non-destructive delete copy

- GIVEN a teacher removes a class from the active list
- WHEN the action is presented or confirmed
- THEN UI copy SHOULD communicate deactivation, not permanent deletion

### Requirement: Testing Expectations

Implementation MUST include focused backend tests and SHOULD include frontend tests where supported.

#### Scenario: Backend behavior is covered

- GIVEN the classes API is implemented
- WHEN backend tests run
- THEN they MUST cover auth, teacher scoping, validation, create, list, update, schedules, and deactivate

#### Scenario: Frontend behavior is covered

- GIVEN the classes UI is implemented
- WHEN frontend tests run
- THEN they SHOULD cover list rendering, display-name fallback, form validation, submit, and deactivation
