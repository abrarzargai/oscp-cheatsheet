Preparing the target IP

```bash
# append the export to your ~/.bashrc so every new interactive shell gets it
echo 'export t="$VICTIM_IP"' >> ~/.bashrc

# apply it now to current shell
source ~/.bashrc

# verify
echo $VICTIM_IP

```

### <span style="color:#50FA7B">IP in the terminal of parrot OS</span>
```bash
echo 'export PS1="\n\[\e[0;31m\]┌─[\[\e[0m\]\u@\[\e[0;36m\]\$(ip addr show tun0 | grep '\''inet '\'' | awk '\''{print \$2}'\'' | cut -d/ -f1)\[\e[0;31m\]]─[\[\e[0m\]\w\[\e[0;31m\]]\n└──╼ \[\e[0m\]\$ "' >> ~/.bashrc
```

## <span style="color:#8BE9FD">Setting Attacker IP</span>

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


## <span style="color:#8BE9FD">Setting Victim IP</span>


```bash
# saving victim IP
echo "$VICTIM_IP" > ~/.rhost

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