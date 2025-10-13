preparing the target ip

```bash
# append the export to your ~/.bashrc so every new interactive shell gets it
echo 'export t="192.168.80.10"' >> ~/.bashrc

# apply it now to current shell
source ~/.bashrc

# verify
echo $t

```
