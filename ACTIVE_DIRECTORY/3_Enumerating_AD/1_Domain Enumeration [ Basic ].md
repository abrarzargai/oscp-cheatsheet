
> [!info] Variables used below
> - `$DC_IP` – Domain Controller's IP
> - `$DOMAIN` – target domain name

## <span style="color:#8BE9FD">Get current domain</span>
```powershell
Get-NetDomain
```

## <span style="color:#8BE9FD">Get object of another domain</span>
```poweshell
Get-NetDomain -Domain $DOMAIN
```

## <span style="color:#8BE9FD">Get domain SID for the current domain</span>
```powerhshell
Get-DomainSID
```

## <span style="color:#8BE9FD">Get domain policy for the current domain</span>
```powershell
Get-DomainPolicy
(Get-DomainPolicy)."system access"
```

## <span style="color:#8BE9FD">Get domain policy for another domain</span>
```powershell
(Get-DomainPolicy -domain $DOMAIN)."system access"
(Get-DomainPolicy -domain $DOMAIN)."kerberos policy"
(Get-DomainPolicy -domain $DOMAIN)."Privilege Rights"
# OR
(Get-DomainPolicy)."KerberosPolicy" #Kerberos tickets info(MaxServiceAge)
(Get-DomainPolicy)."SystemAccess" #Password policy
(Get-DomainPolicy).PrivilegeRights #Check your privileges
```

> [!warning] Kerberos Policy Offsets
> Keep note of the kerberos policy as it will be required while making Golden Tickets with mimikats with the same offsets else it will get blocked by the defenders


## <span style="color:#8BE9FD">Get domain controllers for the current domain</span>
```powershell
Get-NetDomainController
```

## <span style="color:#8BE9FD">Get domain controllers for another domain</span>
```powershell
Get-NetDomainController -Domain $DOMAIN
```

## <span style="color:#8BE9FD">Get a list of users in the current domain</span>
```powershell
Get-NetUser
Get-NetUser -Username student1
```

## <span style="color:#8BE9FD">Get list of all properties for users in the current domain</span>
```powershell
Get-UserProperty
Get-UserProperty -Properties pwdlastset,logoncount,badpwdcount
Get-UserProperty -Properties logoncount
Get-UserProperty -Properties badpwdcount
```

> [!tip] Decoy Account Indicators
> If the logon count and the bad password count of a user is tending to 0 it might be a decoy account. If the password last set of a user was also long back it might be a **decoy account**


## <span style="color:#8BE9FD">Search for a particular string in a user's attributes</span>
```powershell
Find-UserField -SearchField Description -SearchTerm "built"
```

## <span style="color:#8BE9FD">Get a list of computers in the current domain</span>
```powershell
Get-NetComputer
Get-NetComputer -OperatingSystem "*Server 2016*"
Get-NetComputer -Ping
Get-NetComputer -FullData
```

> [!info] Fake Computer Objects
> Any computer administrator can create a computer object in the domain which is not an actual computer/Virtual-Machine but its object type is a computer


## <span style="color:#8BE9FD">Get all the groups in the current domain</span>
```powershell
Get-NetGroup
Get-NetGroup -Domain $DOMAIN
Get-NetGroup -FullData
Get-NetComputer -Domain
```

## <span style="color:#8BE9FD">Get all groups containing the word "admin" in group name</span>
```powershell
Get-NetGroup *admin*
Get-NetGroup -GroupName *admin*
Get-NetGroup *admin* -FullData
Get-NetGroup -GroupName *admin* -Doamin $DOMAIN
```
> [!info] Forest Root Groups
> Groups like **"Enterprise Admins","Enterprise Key Admins",etc** will not be displayed in the above commands unless the domain is not specified because it is only available on the domain controllers of the **forest root**


## <span style="color:#8BE9FD">Get all the members of the Domain Admins group</span>
```powershell
Get-NetGroupMember -GroupName "Domain Admins" -Recurse
#test the below command
#Get-NetGroupMember -GroupName "Domain Admins" -Properties * | select DistinguishedName,GroupCategory,GroupScope,Name,Members
```

> [!tip] RID Verification
> Make sure to check the RID which is the last few charachters of the SID of the member-user as the name of the member-user might be different/changed but the RID is unique. For example : It might be an Administrator account having a differnt/changed member-name but if you check the RID and it is "500" then it is an Administrator account


## <span style="color:#8BE9FD">Get the group membership for a user</span>
```powershell
Get-NetGroup -UserName "student1"
```

## <span style="color:#8BE9FD">List all the local groups on a machine (needs administrator privs on non-dc machines)</span>
```powershell
Get-NetLocalGroup -ComputerName $DC_IP -ListGroups
```

## <span style="color:#8BE9FD">Get members of all the local groups on a machine (needs administrator privs on non-dc machines)</span>
```powershell
Get-NetLocalGroup -ComputerName $DC_IP -Recurse
```

## <span style="color:#8BE9FD">Get actively logged users on a computer (needs local admin rights on the target)</span>
```powershell
Get-NetLoggedon -ComputerName $DC_IP 
```

## <span style="color:#8BE9FD">Get locally logged users on a computer (needs remote registry on the target - started by-default on server OS)</span>
```powershell
Get-LoggedonLocal -ComputerName $DC_IP 
```
 
## <span style="color:#8BE9FD">Get the last logged user on a computer (needs administrative rights and remote registry on the target)</span>
```powershell
Get-LastLoggedon -ComputerName $DC_IP
```

## <span style="color:#8BE9FD">Find shares on hosts in current domain.</span>
```powershell
Invoke-ShareFinder -Verbose
```

## <span style="color:#8BE9FD">Find sensitive files on computers in the domain</span>
```powershell
Invoke-FileFinder -Verbose
```

## <span style="color:#8BE9FD">Get all fileservers of the domain</span>
```powershell
Get-NetFileServer
```
