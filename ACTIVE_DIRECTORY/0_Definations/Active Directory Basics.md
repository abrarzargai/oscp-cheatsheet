# <span style="color:#FF5555">Active Directory (AD)</span>

### <span style="color:#50FA7B">What is Active Directory (AD)?</span>

Active Directory is a service from Microsoft used in Windows environments to **store and manage information about users, groups, computers, and other resources** on a network.

- It's like a big phonebook for everything in a company.
- It helps **centralize user login**, **apply rules**, and **control access** to files, folders, apps, and devices.

---

## <span style="color:#8BE9FD">Types of Operating Systems (OS)</span>

### <span style="color:#50FA7B">1. Client OS (used by end-users)</span>

These are for **personal computers** (used at desks, at home, in schools, etc.)

Examples:

- Windows XP
- Windows 7
- Windows 8
- Windows 10

### <span style="color:#50FA7B">2. Network Operating System (NOS) (used by servers)</span>

These are **server versions** of Windows used to manage networks.

Examples:

- Windows Server 2000
- Windows Server 2003
- Windows Server 2008
- Windows Server 2012 / 2012 R2
- Windows Server 2016
- Windows Server 2019

> [!info] Note
> Servers run 24/7 and help manage things like logins, files, printers, websites, and more.

---

## <span style="color:#8BE9FD">ADDS – Active Directory Domain Services</span>

### <span style="color:#50FA7B">What is it?</span>

- A **role** you install on a Windows Server to make it act like a "brain" for a network.
- It stores info about **users, passwords, computers**, and controls who can access what.

### <span style="color:#50FA7B">After Installing ADDS</span>

- The server becomes a **Domain Controller (DC)**.
- DC = the boss of the domain.
- It checks logins, applies policies, and keeps directory info updated.

---

## <span style="color:#8BE9FD">Hostname</span>

- The **name** of a computer on a network.
- Example: `CLIENT01`, `SERVER-DC1`, etc.

---

## <span style="color:#8BE9FD">1. Domain – "A Single House"</span>

### <span style="color:#50FA7B">What it means</span>

A **domain** is like **one house** where everyone follows the same rules.

### <span style="color:#50FA7B">Real-life example</span>

Think of your home. Everyone in your house shares:

- The same Wi-Fi
- The same front door key
- The same rules (like bedtime at 9 PM)

In Active Directory:

- A domain is a group of users, computers, and printers managed together.
- Example: `school.com` is one domain.

---

## <span style="color:#8BE9FD">2. Tree – "A Street with Houses from the Same Family"</span>

### <span style="color:#50FA7B">What it means</span>

A **tree** is like a **street full of houses** that all belong to the **same family**.

### <span style="color:#50FA7B">Real-life example</span>

Your house is `school.com`. Your cousins live at `math.school.com` and `science.school.com`. You all have the same last name (**school.com**) and you're all part of the same big family tree.

In Active Directory:

- A tree is a group of **connected domains** that share the same base name.
- The first one is the **root**, and others are **branches (children)**.

---

## <span style="color:#8BE9FD">3. Forest – "A Group of Different Families"</span>

### <span style="color:#50FA7B">What it means</span>

A **forest** is like a **neighborhood with different families** who agree to help each other.

### <span style="color:#50FA7B">Real-life example</span>

You live on a street called `school.com`. Across the street lives the `hospital.com` family. You don't have the same name, but you're all friends and can visit each other's houses because you trust each other.

In Active Directory:

- A forest contains **different trees/domains** (even with different names).
- All domains in a forest can **share things and talk** to each other.

---

## <span style="color:#8BE9FD">4. Trusts – "Friendship Between Houses"</span>

### <span style="color:#50FA7B">What it means</span>

A **trust** is like saying, "**I trust your family, so you can come into my house.**"

### <span style="color:#50FA7B">🧸 Real-life example</span>

If your parents say, "Your cousin can come in and use the fridge," that's a **trust**.

In Active Directory:

- A trust allows **users in one domain** to use resources (like printers, files) in **another domain**.

---

## <span style="color:#8BE9FD">5. Directional Trusts (One-Way or Two-Way) – "Who Can Visit Whom?"</span>

### <span style="color:#50FA7B">What it means</span>

Trusts can go **one way** or **both ways**.

### <span style="color:#50FA7B">🧸 Real-life example</span>

- **One-way trust**: You can visit your cousin's house, but they **can't come to yours**.
- **Two-way trust**: You can visit **each other's** houses.

In Active Directory:

- One-way: Only one side has access.
- Two-way: Both sides can access each other's stuff.

---

## <span style="color:#8BE9FD">6. Transitive vs Non-Transitive Trusts – "Can Friends of Friends Come Over?"</span>

### <span style="color:#50FA7B">What it means</span>

A **transitive trust** means "**my friend's friend can come in**."

A **non-transitive trust** means "**only my direct friend can come in.**"

### <span style="color:#50FA7B">Real-life example</span>

- **Transitive**: You trust your cousin, and your cousin trusts their friend — so you also trust that friend.
- **Non-transitive**: You trust your cousin, but **not their friend** — unless you say so.

---

## <span style="color:#8BE9FD">What is an Organizational Unit (OU)?</span>

An **Organizational Unit** is like a **folder inside Active Directory** that helps **organize users, computers, and other objects**.

### <span style="color:#50FA7B">Why use OUs?</span>

- To **organize** your AD better (by department, location, etc.)
- To **apply policies** (like password rules, software installation) only to specific people or computers
- To **delegate permissions** (give control to others without giving them full admin rights)

### <span style="color:#50FA7B">Example</span>

Think of a company with 3 departments:

- HR
- IT
- Finance

## <span style="color:#8BE9FD">What is a Security Group?</span>

A **Security Group** is a **collection of users** (or computers) used to manage **permissions** to resources.

### <span style="color:#50FA7B">Why use security groups?</span>

- To **grant access** to shared folders, printers, applications, etc.
- To **assign permissions** once to the group instead of each user

### <span style="color:#50FA7B">Example</span>

- You create a group called `Finance_ReadAccess`
- Add users: `finance_user1`, `finance_user2`
- Grant that group **read access** to a finance folder

## <span style="color:#8BE9FD">OU vs Security Group – What's the Difference?</span>

| Feature | Organizational Unit (OU) | Security Group |
| --- | --- | --- |
| Purpose | Organize objects (users, computers) | Grant access/permissions |
| Can nest inside each other? | Yes (OUs inside OUs) | Yes (groups inside groups) |
| Used for GPOs (Group Policy)? | ✅ Yes | ❌ No |
| Can assign folder/printer rights? | ❌ No | ✅ Yes |
| Best for? | Structure & policies | Access control |

| PowerShell Command | What it does |
| --- | --- |
| `Get-ADGroup -Filter *` | Lists all groups |
| `Get-ADUser -Filter *` | Lists all users |
| `Get-ADOrganizationalUnit -Filter *` | Lists all OUs |

---

## <span style="color:#8BE9FD">What is Active Directory Authentication?</span>

**Active Directory (AD) Authentication** is the process of **verifying who a user is** when they log into a computer or access a network resource (like a file or printer).

- When a user logs into a domain-joined computer (part of an AD network), AD checks:
    - Is this user real?
    - Is the password correct?
    - What is the user allowed to access?

---

## <span style="color:#8BE9FD">Authentication Protocols Used by Active Directory</span>

1. **Kerberos** (default & more secure)
2. **NTLM** (older and less secure, used as fallback)

---

## <span style="color:#FFB86C">Kerberos – Modern & Secure</span>

### <span style="color:#50FA7B">What is Kerberos?</span>

Kerberos is a **ticket-based authentication protocol** — instead of sending your password across the network, you exchange **tickets** that prove who you are.

Think of **Kerberos** like this:

### <span style="color:#50FA7B">Alice wants to enter a secure building (the network)</span>

To get in:

1. She goes to the **security desk** (called the KDC = Key Distribution Center).
2. Shows her **ID card (username + password)**.
3. If everything checks out, they give her a **pass** (called a **TGT – Ticket Granting Ticket**).
4. When Alice wants to enter a specific **room**, she gives her **pass** back to the desk.
5. The desk gives her a **room key (service ticket)** for that room.
6. Alice uses the room key to go into that room — without needing to show her password again.

> [!info] Ticket Terms
> - **TGT** = one-time pass
> - **Service Ticket** = door key to a specific service

### <span style="color:#50FA7B">Features of Kerberos</span>

- **No passwords are sent** over the network
- **Tickets** are used to prove who you are
- Works only if **computers' clocks are synced**
- **Safer** than older methods

---

## <span style="color:#FFB86C">NTLM – Old & Weak</span>

### <span style="color:#50FA7B">What is NTLM?</span>

NTLM stands for **NT LAN Manager**. It's an older authentication method that uses **challenge-response** instead of tickets.

> [!info] History
> Used in Windows NT 4.0 and still supported for backward compatibility.

Now think of **NTLM** like this:

### <span style="color:#50FA7B">Bob wants to enter a room (a shared folder)</span>

1. He knocks on the door.
2. The door gives him a **random question** (challenge).
3. Bob **encrypts** the question using a secret (his password hash).
4. He sends the **answer** back.
5. The door calls the **Domain Controller** and asks:
    - "Is Bob's answer correct?"
6. If yes, Bob is let in.

> [!danger] Weakness
> Hackers can steal Bob's encrypted answer and use it to pretend to be him (called a **pass-the-hash** or **relay attack**).

---

## <span style="color:#FF5555">Side-by-Side Example</span>

| Situation | Kerberos | NTLM |
| --- | --- | --- |
| You log in | Get a **ticket** | Do a **challenge/response** |
| Send password? | ❌ No | ⚠️ Sends hashed password |
| Safer? | ✅ Yes | ❌ Old, weak |
| Used today? | ✅ Default in AD | 😬 Only if Kerberos fails |
