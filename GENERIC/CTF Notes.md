preparing the target ip

```bash
# append the export to your ~/.bashrc so every new interactive shell gets it
echo 'export t="10.10.11.58"' >> ~/.bashrc

# apply it now to current shell
source ~/.bashrc

# verify
echo $t

```

