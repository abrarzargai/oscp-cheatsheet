# Commands
### Enumeration
```bash
nmap --script mongodb-info -p 27017 <target-ip>
nmap --script mongodb-databases -p 27017 <target-ip>
```
### Brute Force Credentials
```bash
hydra -l username -P passwords.txt <target-ip> mongo
hydra -L usernames.txt -p password <target-ip> mongo

# Metasploit
msfconsole
msf> use auxiliary/scanner/postgres/postgres_login
msf> set rhosts <target-ip>
msf> run
```

### Connect

```bash
# Local
mongo
mongo --port 27017

# Remote
mongo --host <target-ip> --port 27017 -u username -p password
mongo "mongodb://<target-ip>:27017"
mongo "mongodb://username:password@<target-ip>:27017/?authSource=admin"

```


### Basic Commands

```bash
# All databases
> show dbs
# Current database
> db
# Switch database if it exists, or create new if not exist
> use db_name
# Collections
> show collections
# Run javascript file
> load("example.js")

# List users in the current database
> show users
> db.admin.find()

# Create new collection in current database
> db.createCollection("users")
```
