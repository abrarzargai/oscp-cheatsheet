# <span style="color:#FF5555">Find & Kill Process by Port (Linux & Windows)</span>

## <span style="color:#8BE9FD">LINUX</span>

### <span style="color:#50FA7B">Find process</span>
```bash
lsof -i :<PORT>                 # Lists open files on the specified port
netstat -tulnp | grep :<PORT>   # Shows listening services with PID
ss -tuln | grep :<PORT>         # Modern alternative to netstat
```

### <span style="color:#50FA7B">Kill the process</span>
```bash
sudo kill -9 <PID>
```
### <span style="color:#50FA7B">One-liner</span>
```bash
sudo kill -9 $(lsof -t -i :<PORT>)
```


## <span style="color:#8BE9FD">WINDOWS</span>

### <span style="color:#50FA7B">Find Process by Port</span>
```bash
netstat -ano | findstr :4444
```
### <span style="color:#50FA7B">Kill the process (replace PID)</span>
```bash
taskkill /PID <PID> /F
```


___

If we run **ss -tulpn** it will tell us what socket connections are running

`ss -tulpn`