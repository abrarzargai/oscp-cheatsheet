# Local Storage

Sometimes apps save **useful or sensitive data locally** so they can work or validate data while offline.

#### Shared Preferences

Check:

```
/data/data/<package>/shared_prefs/
```

It may contain:

- Tokens
- User IDs
- Settings
- Cached data
- Offline validation data

This is not always a bug, but **poorly coded apps** may store sensitive data here.

# SQLite Database

Apps that support offline features may store data in SQLite:

```
/data/data/<package>/databases/
```

Check for:

- User data
- Messages
- API responses
- Transactions
- PII
- Offline auth data

**Key point:** Always check local storage. Sometimes it contains **juicy data that is not visible in normal network traffic**.