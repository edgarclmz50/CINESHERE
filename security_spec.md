# Firebase Security Specification - CineSphere AI

## Data Invariants
1. A `WatchlistItem` must have a valid `title` and `url`.
2. A user can only access their own `watchlist`, `services`, and `history` subcollections.
3. Path variables (userId, itemId, etc.) must match `^[a-zA-Z0-9_\-]+$`.

## The "Dirty Dozen" Payloads (Denial Expected)
1. Write to another user's watchlist: `setDoc(doc(db, 'users', 'otherUser', 'watchlist', 'item1'), { ... })`
2. Create item without `title`: `{ url: '...', source: '...' }`
3. Update `addedAt` field on existing item: `{ addedAt: '2020-01-01' }`
4. Inject 2MB string into `title`: `{ title: 'A'.repeat(2 * 1024 * 1024) }`
5. Overwrite `itemId` with path traversal or junk characters: `itemId = "../bad/path"`
6. Set `ownerId` in document but authenticate as different user (spoofing).
7. List all users' watchlists: `getDocs(collectionGroup('watchlist'))`
8. Create `StreamingService` without `category`.
9. Update `id` of an existing `WatchlistItem`.
10. Send an array of 500 genres (resource exhaustion).
11. Spoof a Google Admin email without `email_verified: true`.
12. Modify a terminal status (if we had one, e.g., 'finished').

## Red Team Checklist
- [ ] Identity Spoofing blocked?
- [ ] Orphaned writes blocked?
- [ ] ID Poisoning blocked?
- [ ] PII isolated? (User email is only via Auth)
- [ ] Immortality enforced on `addedAt`?
