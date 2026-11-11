# Security Specification for AgriNex Firestore

## 1. Data Invariants
1. **Public Read / Owner-Restricted Write**: Crop profiles, pest identification, plant disease guides, and farming tips are publicly readable by all farmers, students, and agronomists, but mutations (`create`, `update`, `delete`) require authenticated verification matching the admin whitelist (`/admins/$(request.auth.uid)`) or the designated primary owner.
2. **User Profiles**: Users can only read and write their own profile document (`/users/$(request.auth.uid)`). Users cannot elevate their own role to 'owner' or write into `/admins/`.
3. **Idempotence & Strict Schema**: All document IDs must conform to `^[a-zA-Z0-9_\-]+$` and length <= 128 characters.
4. **Field Immutability**: `id` and `createdAt` must remain immutable once created.

## 2. Dirty Dozen Security Attack Payloads
1. **Ghost Field Injection**: Adding `isAdmin: true` inside a `/crops/{cropId}` write. (Blocked by `hasOnly()` allowed keys check).
2. **Unauthenticated Write**: Guest trying to `create` or `delete` a crop. (Blocked by `isAdmin()`).
3. **Identity Spoofing**: Regular authenticated user attempting to write a crop with `authorId` pointing to owner UID. (Blocked by role validation).
4. **Path Variable ID Poisoning**: Using a 10KB string with special characters for `{cropId}`. (Blocked by `isValidId()`).
5. **PII Scraping**: Attempting a list query on `/users` collection without user filter. (Blocked by `resource.data.userId == request.auth.uid`).
6. **Cross-User Profile Hijacking**: User A writing to `/users/UserB`. (Blocked by path binding `request.auth.uid == userId`).
7. **Privilege Escalation**: User attempting to create their own record in `/admins/`. (Blocked: write to `/admins` is denied).
8. **Negative / Massive Strings**: Description exceeding 2000 characters. (Blocked by `.size() <= 2000`).
9. **Fake Timestamp Poisoning**: Client setting `createdAt: 1999-01-01`. (Blocked by `request.time` enforcement).
10. **Type Confusion**: Passing a boolean or array into `scientificName`. (Blocked by `data.scientificName is string`).
11. **Severity Tampering**: Setting pest severity to `ExtremeDanger`. (Blocked by enum `["Low", "Moderate", "High"]`).
12. **Orphaned Writes**: Creating a subdocument with non-existent parent ID. (Blocked by relational `exists()`).
