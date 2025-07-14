# 🔪 Find & Kill Process by Port (Linux & Windows)

## LINUX

### 🔍 Find process 
```bash
lsof -i :<PORT>                 # Lists open files on the specified port
netstat -tulnp | grep :<PORT>   # Shows listening services with PID
ss -tuln | grep :<PORT>         # Modern alternative to netstat
```

### 💀 Kill the process
```bash
sudo kill -9 <PID>
```
### ⚡ One-liner
```bash
sudo kill -9 $(lsof -t -i :<PORT>)
```


## WINDOWS

### 🔍 Find Process by Port
```bash
netstat -ano | findstr :4444
```
### 💀 Kill the process (replace PID)
```bash
taskkill /PID <PID> /F
```


___

If we run **ss -tulpn** it will tell us what socket connections are running

`ss -tulpn`