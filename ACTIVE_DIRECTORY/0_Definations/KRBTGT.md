#AD_DEFINATION_KRBTGT

# <span style="color:#FF5555">KRBTGT</span>

It is _a special-purpose, privileged account in Active Directory_ that is automatically created when a new domain is established. It is a service account whose hash is used to sign and encrypt Kerberos Ticket Granting Tickets (TGTs) which we are sending to client (user).

- It **is a real account** (like a service account)

> [!danger] If Compromised
> Attackers who obtain the KRBTGT hash can forge **Golden Tickets**, granting persistent domain-wide access.