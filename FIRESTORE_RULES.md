## Firestore Rules Needed For Reviews And Website Orders

If review submit shows `Missing or insufficient permissions`, update Firestore rules to allow the `public_reviews` collection.
If website order submit shows `Missing or insufficient permissions`, allow `create` on `orders`.

Use this as a starting point in Firebase Console > Firestore Database > Rules:

```txt
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Website bookings
    match /public_bookings/{docId} {
      allow create, read: if true;
      allow update, delete: if request.auth != null && request.auth.token.firebase.sign_in_provider != "anonymous";
    }

    // Per-day per-slot booking lock to prevent duplicate slot booking
    match /booking_slots/{docId} {
      allow create: if request.auth != null &&
        !exists(/databases/$(database)/documents/booking_slots/$(docId));
      allow read: if request.auth != null;
      allow update: if false;
      allow delete: if request.auth != null && request.auth.token.firebase.sign_in_provider != "anonymous";
    }

    // Website contact form
    match /contact_inquiries/{docId} {
      allow create: if true;
      allow read, update, delete: if request.auth != null && request.auth.token.firebase.sign_in_provider != "anonymous";
    }

    // Customer reviews
    match /public_reviews/{docId} {
      allow create, read: if true;
      allow update, delete: if request.auth != null && request.auth.token.firebase.sign_in_provider != "anonymous";
    }

    // Admin collections
    match /customers/{docId} {
      allow read, write: if request.auth != null && request.auth.token.firebase.sign_in_provider != "anonymous";
    }
    match /orders/{docId} {
      allow create: if true;
      allow read, update, delete: if request.auth != null && request.auth.token.firebase.sign_in_provider != "anonymous";
    }
    match /ai_suggestions/{docId} {
      allow create: if true;
      allow read, update, delete: if request.auth != null && request.auth.token.firebase.sign_in_provider != "anonymous";
    }
  }
}
```

Notes:
- This keeps public `create/read` only for website-facing collections.
- `update/delete` is restricted to non-anonymous signed-in users (your admin login flow).
- Publish rules in Firebase Console after saving.
