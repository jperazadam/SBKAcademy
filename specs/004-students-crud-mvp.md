# Spec: Students CRUD MVP

## Purpose

Enable an authenticated teacher to manage their own active students through REST-backed frontend screens. This MVP covers create, list, update, and deactivate only.

## Scope

In scope: `firstName`, `lastName`, `phone`, optional `email`; teacher-scoped backend API; active-students list by default; soft-delete/deactivation; API and UI validation; backend and frontend tests.

Out of scope: classes, attendance, payments, class assignment, student portal, multi-professor workflows, hard-delete, strict international phone formatting, inactive filtering/reactivation unless added later.

## Requirements

### Requirement: Teacher-Scoped Students API

The backend MUST expose protected REST endpoints for students. Every read and mutation MUST use the authenticated teacher identity as the student scope.

#### Scenario: Reject unauthenticated access

- GIVEN a request to any students endpoint has no valid token
- WHEN the request is processed
- THEN the API MUST respond HTTP 401 with `{ "error": "Unauthorized" }`

#### Scenario: List only own active students

- GIVEN a teacher is authenticated
- WHEN they request the normal students list
- THEN the API MUST return only students owned by that teacher
- AND inactive students MUST be excluded by default

#### Scenario: Prevent cross-teacher access

- GIVEN teacher A is authenticated
- AND a student belongs to teacher B
- WHEN teacher A reads, updates, or deactivates that student by id
- THEN the API MUST NOT expose or mutate teacher B's student

### Requirement: Student Data and Validation

Student records MUST require non-empty `firstName`, `lastName`, and `phone`. `email` MAY be omitted, but if present it MUST be valid enough for MVP email validation.

#### Scenario: Create valid student

- GIVEN an authenticated teacher submits valid student data
- WHEN the API creates the student
- THEN the student MUST be stored under that teacher
- AND the response MUST include the created student data

#### Scenario: Reject missing required fields

- GIVEN `firstName`, `lastName`, or `phone` is empty or missing
- WHEN create or update is submitted
- THEN the API MUST reject the request with HTTP 400 and `{ "error": string }`

#### Scenario: Reject invalid optional email

- GIVEN `email` is present but not valid
- WHEN create or update is submitted
- THEN the API MUST reject the request with HTTP 400 and `{ "error": string }`

### Requirement: Update Student

The backend MUST allow an authenticated teacher to update their own student's MVP fields without changing ownership.

#### Scenario: Update own student

- GIVEN a teacher owns an active student
- WHEN they submit valid updated fields
- THEN the API MUST persist the changes
- AND ownership MUST remain unchanged

### Requirement: Soft Delete / Deactivation

Delete behavior MUST deactivate students instead of hard-deleting records.

#### Scenario: Deactivate own student

- GIVEN a teacher owns an active student
- WHEN they delete/deactivate that student
- THEN the student MUST become inactive
- AND the student MUST NOT appear in the default list

### Requirement: Frontend Student UX

The frontend MUST provide private UI flows for listing, creating, editing, and deactivating students using the REST API only.

#### Scenario: Active list renders

- GIVEN a teacher is logged in
- WHEN they open the students page
- THEN the UI MUST show active students returned by the API
- AND it MUST NOT access the database directly

#### Scenario: Form validates before submit

- GIVEN required fields are empty or email is invalid
- WHEN the teacher submits the form
- THEN the UI SHOULD show validation feedback
- AND SHOULD avoid sending invalid data when possible

#### Scenario: Deactivation feels non-destructive

- GIVEN a teacher chooses to remove a student from the list
- WHEN the action is presented or confirmed
- THEN UI copy SHOULD communicate deactivation/archiving, not permanent deletion

### Requirement: Testing Expectations

The implementation MUST include focused backend and frontend tests for the specified behavior without adding E2E requirements.

#### Scenario: Backend behavior is covered

- GIVEN the students API is implemented
- WHEN backend tests run
- THEN they MUST cover auth required, teacher scoping, validation, create, list, update, and deactivate behavior

#### Scenario: Frontend behavior is covered

- GIVEN the student UI is implemented
- WHEN frontend tests run
- THEN they SHOULD cover list rendering, form validation, submit behavior, and deactivation action

## Future Work

- Inactive-student filtering and reactivation.
- Search, pagination, and advanced list management.
- Class assignment, attendance, payments, and student portal.
