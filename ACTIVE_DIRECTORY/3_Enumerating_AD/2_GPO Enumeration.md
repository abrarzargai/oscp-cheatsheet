
## <span style="color:#8BE9FD">Get list of GPO in current domain.</span>

```powershell
Get-NetGPO
Get-NetGPO -ComputerName $VICTIM_IP
Get-GPO -All (GroupPolicy module)
Get-GPResultantSetOfPolicy -ReportType Html -Path C:\Users\Administrator\report.html (Provides RSoP)
gpresult /R /V (GroupPolicy Results of current machine)
```

## <span style="color:#8BE9FD">Get GPO(s) which use Restricted Groups or groups.xml for interesting users</span>
```powershell
Get-NetGPOGroup 
```

## <span style="color:#8BE9FD">Get users which are in a local group of a machine using GPO</span>
```powershell
Find-GPOComputerAdmin -ComputerName $VICTIM_IP
```

## <span style="color:#8BE9FD">Get machines where the given user is member of a specific group</span>
```powershell
Find-GPOLocation -Username student1 -Verbose
```

## <span style="color:#8BE9FD">Get OUs in a domain</span>
```powershell
Get-NetOU -FullData
```

## <span style="color:#8BE9FD">Get GPO applied on an OU. Read GPOname from gplink attribute from Get-NetOU</span>
```powershell
Get-NetGPO -GPOname "{AB306569-220D-43FF-BO3B-83E8F4EF8081}"
Get-GPO -Guid AB306569-220D-43FF-B03B-83E8F4EF8081 (GroupPolicy module) 
```

## <span style="color:#8BE9FD">Enumerate permissions for GPOs where users with RIDs of > -1000 have some kind of modification/control rights</span>
```powershell
Get-DomainObjectAcl -LDAPFilter '(objectCategory=groupPolicyContainer)' | ? { ($_.SecurityIdentifier -match '^S-1-5-.*-[1-9]\d{3,}$') -and ($_.ActiveDirectoryRights -match 'WriteProperty|GenericAll|GenericWrite|WriteDacl|WriteOwner')}
Get-NetGPO -GPOName '{3E04167E-C2B6-4A9A-8FB7-C811158DC97C}' 
```
