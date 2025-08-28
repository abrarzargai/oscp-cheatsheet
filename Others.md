
### IP in the terminal of parrot OS
```bash
echo 'export PS1="\n\[\e[0;31m\]┌─[\[\e[0m\]\u@\[\e[0;36m\]\$(ip addr show tun0 | grep '\''inet '\'' | awk '\''{print \$2}'\'' | cut -d/ -f1)\[\e[0;31m\]]─[\[\e[0m\]\w\[\e[0;31m\]]\n└──╼ \[\e[0m\]\$ "' >> ~/.bashrc
```

## Setting Attacker IP

- Open `~/.bashrc` in an editor
```bash
nano ~/.bashrc
```

- Paste the above lines at the bottom.
```bash
# ~/.bashrc additions

# Alias → quick typing, shows VPN IP (tun0)
alias LHOST="ip addr show tun0 | grep 'inet ' | awk '{print \$2}' | cut -d/ -f1"

# Variable → usable in commands
export LHOST=$(ip addr show tun0 | grep 'inet ' | awk '{print $2}' | cut -d/ -f1)

```

- reload the configs `
```bash
source ~/.bashrc
```


## Setting Victim IP


```bash
# saving ctim IP
echo "10.10.10.1" > ~/.rhost

# ~/.bashrc
# Access it using $rhost
export rhost=$(cat ~/.rhost)
# # Access it using $(rhost)
rhost() {
  cat ~/.rhost
}

# reload the configs 
source ~/.bashrc
```