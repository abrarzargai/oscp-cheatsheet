
finding the file in powershell
```powershell
Get-ChildItem -Path 'C:\Users\Administrator' -Filter 'root.txt' -Recurse -Force -ErrorAction SilentlyContinue
```