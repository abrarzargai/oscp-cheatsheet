
### <span style="color:#50FA7B">What is "Sudo"?</span>

- **`sudo`** lets a normal user run **specific commands** as **root** (super powerful admin). 
- This is **not full root access**, just permission to do certain tasks like running one command with more power.

# <span style="color:#FF5555">Misconfigured SUDO Privileges</span>

Sometimes, users are allowed to run certain commands with `sudo` **without a password**, which can be abused to gain **root access**.

### <span style="color:#50FA7B">🔍 Step 1: Check Your Sudo Permissions</span>

Use this command to see what you're allowed to run as `sudo`:

```bash
sudo -l
```

**Explanation**:

- Lists commands you can run with `sudo`
- Shows whether a password is required or not

> 🎯 You're looking for any binary listed that can be abused to escalate privileges.
> 

### <span style="color:#50FA7B">Output:</span>
<img width="897" height="182" alt="image" src="https://github.com/user-attachments/assets/f6040471-21cf-471b-9115-69ef159fafa6" />

 
This means the user (e.g., `student`) can run the `man` command **as root without a password**.

### <span style="color:#50FA7B">🧰 Step 2: Look Up the Binary on GTFOBins</span>

Check https://gtfobins.github.io for the binary.

Search: **"man"**

According to GTFOBins, `man` can be used to get a shell like this:

 <img width="886" height="225" alt="image" src="https://github.com/user-attachments/assets/6d9949d7-dd79-4a22-99a1-9a7bcb73d9f1" />

Checking it further

<img width="871" height="183" alt="image" src="https://github.com/user-attachments/assets/ce33f650-e6d9-4bc6-a166-055df6264d25" />

Now we are going to follow the same instruction 

```bash
sudo man man
```

After that we will run the command 

```bash
!/bin/sh
```

After this you drop into a **root shell**

Similarly, you can check whether any other binaries are allowed to run with **sudo** without a password.
