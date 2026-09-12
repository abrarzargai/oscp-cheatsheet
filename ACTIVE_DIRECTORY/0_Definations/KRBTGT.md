#AD_DEFINATION_KRBTGT

It is _a special-purpose, privileged account in Active Directory_ that is automatically created when a new domain is established. It is a service account whose hash is used to sign and encrypt Kerberos Ticket Granting Tickets (TGTs) which we are sending to client (user).

- If compromised → attackers can create **Golden Tickets**
- It **is a real account** (like a service account)