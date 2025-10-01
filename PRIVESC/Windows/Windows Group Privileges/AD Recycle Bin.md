
This command will show information about all deleted objects; however, there is one object in particular that I want information about – TempAdmin.
```bash
Get-ADObject -filter 'isdeleted -eq $true -and name -ne "Deleted Objects"' -includeDeletedObjects -property *
```


```bash
Get-ADObject -Filter 'samaccountname -eq "TempAdmin"' -IncludeDeletedObjects -properties *

```