
## <span style="color:#8BE9FD">Get the ACLs associated with the specified object (groups)</span>

> [!info] Variables used below
> - `$DC_IP` – Domain Controller's IP

```powershell
Get-ObjectAcl -SamAccountName student1 -ResolveGUIDs
```

## <span style="color:#8BE9FD">Get the ACLs associated with the specified prefix to be used for search</span>
```powershell
Get-ObjectAcl -ADSprefix 'CN=Administrator,CN=Users' -Verbose
```

## <span style="color:#8BE9FD">We can also enumerate ACLs using ActiveDirectory module but without resolving GUIDs</span>
```powershell
(Get-Acl "AD:\CN=Administrator, CN=Users, DC=dollarcorp, DC=moneycorp,DC=local").Access
```

## <span style="color:#8BE9FD">Get the ACLs associated with the specified LDAP path to be used for search</span>
```powershell
Get-ObjectAcl -ADSpath "LDAP://CN=Domain Admins,CN=Users,DC=dollarcorp,DC=moneycorp,DC=local" -ResolveGUIDs -Verbose
```

## <span style="color:#8BE9FD">Search for interesting ACEs</span>
```powershell
Invoke-ACLScanner -ResolveGUIDs
```

## <span style="color:#8BE9FD">Get the ACLs associated with the specified path</span>
```powershell
Get-PathAcl -Path "\\$DC_IP\sysvol" 
````
