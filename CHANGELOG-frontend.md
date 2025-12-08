# Frontend Changelog
## 2025-12-05
- Updated phone-ui, added agent bridging for queued calls

## 2025-11-25
- Added Skills tab to user dialog; separated general, SIP, and skills sections into tabbed layout with icons.
- Improved overall user dialog layout and spacing for cleaner form presentation.
- Integrated SIP data section for users; moved related fields out of general info tab.

## 2025-11-21
- Implemented Heartbeat service initialization through AuthService for clean login/refresh logic.
- Verified stable singleton instantiation to prevent multiple heartbeat instances.
- Refined token/session refresh logic with `/me` verification flow.

## 2025-11-20
- Updated `AuthGuard` and `AdminGuard` logic to avoid infinite route loops.
- Adjusted user session verification to properly populate UserService data after `/me` check.
- Improved error handling and routing stability during token revalidation.

## 2025-11-19
- Added frontend validation for duplicate usernames when creating/editing users.
- Aligned form icons (e.g., `check_circle`) beside input fields for visual clarity.
- Refined form layout and validation feedback consistency across dialogs.

## 2025-11-18
- Updated user management components for real-time updates via socket events.
- Optimized Angular forms to better handle async username and SIP validations.
- General UI/UX cleanup for admin pages and dialogs.
