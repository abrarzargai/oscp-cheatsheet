
### XSS & SQL Injection

XSS and SQL injection testing is similar to web application testing.

- Test every input field.
- Check if input is **stored or reflected**.
- Check if input is properly filtered or sanitized.

> **Note:** Keep `logcat` running while testing SQL injection. Sometimes an injection may trigger a database error that is not shown in the app UI but appears in the `logcat` output.