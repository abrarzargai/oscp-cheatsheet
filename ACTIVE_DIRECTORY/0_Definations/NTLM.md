#AD_DEFINATION_NTLM

**NTLM (NT LAN Manager)** is a **challenge-response authentication protocol** used in Windows and Active Directory environments.

Unlike Kerberos, NTLM does **not use tickets**. Instead, the server sends a **challenge**, and the client uses the user's password-derived secret to calculate a **response**.


**The basics:** Windows doesn't store your actual password. It stores a **hash** of it (called the NT hash). Both the client and the server (or the Domain Controller in a domain environment) have access to this hash.

**The login process happens in 3 steps:**

1. **Negotiate:** The client tells the server, "I want to log in using NTLM."
2. **Challenge:** The server sends back a random number, called the _challenge_ or _nonce_.
3. **Authenticate:** The client uses its password hash to encrypt that random number and sends the result (the _response_) back, along with the username.

The server (or Domain Controller) then performs the same calculation using the hash it has stored. If both results match, login succeeds. If not, it's rejected.

**Simple analogy:** You and a friend share a secret formula. Your friend gives you a random number, you apply the formula to it and tell them the answer. Your friend checks whether it's correct. The formula itself was never spoken aloud, but you proved you know it.