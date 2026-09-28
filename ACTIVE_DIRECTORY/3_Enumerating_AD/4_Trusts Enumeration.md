
## <span style="color:#8BE9FD">Get a list of all domain trusts for the current domain</span>

```powershell
Get-NetDomainTrust
Get-NetDomainTrust -Domain $DOMAIN
```

## <span style="color:#8BE9FD">Get details about the current forest</span>
```powershell
Get-NetForest
Get-NetForest -Forest $DOMAIN
```

## <span style="color:#8BE9FD">Get all domains in the current forest</span>
```powershell
Get-NetForestDomain
Get-NetForestDomain -Forest $DOMAIN
```

## <span style="color:#8BE9FD">Get all global catalogs for the current forest</span>
```powershell
Get-NetForestCatalog
Get-NetForestCatalog -Forest $DOMAIN
```
 
## <span style="color:#8BE9FD">Map trusts of a forest</span>
```powershell
Get-NetForestTrust
Get-NetForestTrust -Forest $DOMAIN
```

# <span style="color:#FF5555">PowerView Enumeration</span>

## <span style="color:#8BE9FD">Find all machines on the current domain where the current user has local admin access</span>
```powershell
Find-LocalAdminAccess -Verbose
```

## <span style="color:#8BE9FD">Find computers where a domain admin (or specified user/group) has sessions</span>
```powershell
Invoke-UserHunter
Invoke-UserHunter -GroupName "RDPUsers"
```

## <span style="color:#8BE9FD">To confirm admin access</span>
```powershell
Invoke-UserHunter -CheckAccess
```

## <span style="color:#8BE9FD">Find computers where a domain admin is logged-in</span>
```powershell
Invoke-UserHunter -Stealth
```

## <span style="color:#8BE9FD">Get users with privileges in other domains inside the forest</span>
```
Get-DomainForeingUser 
```
## <span style="color:#8BE9FD">Get groups with privileges in other domains inside the forest</span>
```
Get-DomainForeignGroupMember 
```
