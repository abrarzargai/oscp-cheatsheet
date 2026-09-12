#AD_kerberose_tgt

> [!tip] When to Use getTGT
> **Use getTGT when you have a password but NTLM is blocked - it gives you a Kerberos ticket that works like a session cookie for multiple tools.**

> [!info] Variables used below
> - `$DC_IP` – Domain Controller's IP
> - `$DOMAIN` – target domain name

```shell
# Get Kerberos TGT (writes .ccache)
impacket-getTGT $DOMAIN/'ryan.naylor':'HollowOct31Nyt'

# Point env to the ticket cache
export KRB5CCNAME=/home/kali/Voleur/ryan.naylor.ccache

# Use Kerberos ticket for LDAP and the -k Kerberos option (use Kerberos ticke
nxc ldap $DC_IP -u ryan.naylor -p HollowOct31Nyt -k

# Use Kerberos ticket for SMB and the -k Kerberos option (use Kerberos ticke
nxc smb $DC_IP -u ryan.naylor -p HollowOct31Nyt -k
```
