#AD_kerberose_tgt

>**Use getTGT when you have a password but NTLM is blocked - it gives you a Kerberos ticket that works like a session cookie for multiple tools.**


```shell
# Get Kerberos TGT (writes .ccache)
impacket-getTGT voleur.htb/'ryan.naylor':'HollowOct31Nyt'

# Point env to the ticket cache
export KRB5CCNAME=/home/kali/Voleur/ryan.naylor.ccache

# Use Kerberos ticket for LDAP and the -k Kerberos option (use Kerberos ticke
nxc ldap voleur.htb -u ryan.naylor -p HollowOct31Nyt -k

# Use Kerberos ticket for SMB and the -k Kerberos option (use Kerberos ticke
nxc smb voleur.htb -u ryan.naylor -p HollowOct31Nyt -k
```
