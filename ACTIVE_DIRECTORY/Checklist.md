

- [ ] Check all TCP ports (fast + full scans as needed).
- [ ] Check LDAP, RPC and SMB for anonymous access and public/shared folders.
- [ ] Enumerate usernames — use tools like `netexec --rid-brute`, `rpcclient enumdomusers`, and `kerbrute`.
- [ ] Test AS-REP roasting for users without pre-auth; if successful, save the hashes and try cracking them.
- [ ] Try authentication with every available protocol using discovered credentials: WinRM, RDP, MySQL, SMB, RPC, LDAP, etc. (include NTLM authentication where applicable).
- [ ] Enumerate shares for every account you can access — whenever you gain a new user, re-check their shares.
- [ ] If you get a shell as a user: run privilege-escalation checks, dump local/domain hashes, and collect them into a file for offline cracking and lateral movement.
- [ ] Run BloodHound and review high-risk paths and attacks (DCSync, unconstrained delegation, ACL abuse, etc.).
- [ ] Check for certificate-based attacks with Certipy (AD CS / certificate template issues).
- [ ] In AD environments, look for additional network adapters/subnets for pivoting; set up a jumpbox and relay tools through it when needed.
- [ ] When brute-forcing, remember to test different protocols and include NTLM where required — be careful with lockouts.
- [ ] Check UDP ports (e.g., `nmap -sU`) for additional services.
- [ ] If stuck: rescan, verify your tool versions/flags, and ensure you’re running tools correctly (and that network/firewall rules aren’t blocking you).
