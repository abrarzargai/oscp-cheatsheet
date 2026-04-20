
____

#  Initial Reconnaissance (No Credentials / No Access)
when you have no credentials or no access to any machine 

 - [ ] Look for anonymous **SMB,LDAP,RPC** access and public/shared folders #AD_anonymous_access 
- [ ] Enumerate users: `kerbrute`, `netexec --rid-brute` #AD_user_enumeration 
- [ ] **AS-REP Roast  (No pre-auth required)**: Users without pre-auth → crack hashes #AD_AS-REP_Roasting 
- [ ]  If there is any website search and gather the usernames and passwords 
- [ ] **Responder**: Capture NTLM hashes on network  #AD_LLMNR-NBT-NS_Poisoning 


---
# Get In (Initial Access) (With Credentials)
when you got the credentials for any account 

- [ ] Try every protocol with found creds: **SMB, WinRM, RDP, MSSQL, SSH, LDAP, FTP** #AD_protocol_based_access 
- [ ] If NTLM disabled → use kerberose TGT `getTGT.py` → Kerberos auth #AD_LLMNR-NBT-NS_Poisoning 
- [ ] **Kerberoast**: Request service tickets → crack them  #AD_Kerberoast 

---
# Lateral movement

- [ ] Run **BloodHound** →
	- [ ] **AS-REP Roast  (No pre-auth required)**: Users without pre-auth → crack hashes
	- [ ] Check query **find shortest path to Domain Admin**
	- [ ] Check for **DCSync rights**
	- [ ] **Check for ACL abuse paths** (GenericAll, WriteDACL, WriteOwner)
	- [ ] Check for certificate-based attacks with Certipy (AD CS / certificate template issues).
 

---
# Persistence 

- [ ] **Golden Ticket**: #AD_Golden_Ticket 
- [ ] **Silver Ticket**:  #AD_Silver_Ticket 
- [ ] **Dimond Ticket**: #AD_Diamond_Ticket 
- [ ]  **Skeleton Key**: #AD_Skeleton_Key 
- [ ] **DSRM**: #AD_DSRM 


___
# Generic

 - [ ]  If you get a shell as a user: run privilege-escalation checks, dump local/domain hashes, and collect them into a file for offline cracking and lateral movement.
 - [ ] If stuck: rescan, verify your tool versions/flags, and ensure you’re running tools correctly (and that network/firewall rules aren’t blocking you).
 - [ ] When brute-forcing, remember to test different protocols and include NTLM where required — be careful with lockouts.
- [ ] In AD environments, look for additional network adapters/subnets for pivoting; set up a jumpbox and relay tools through it when needed.

___
