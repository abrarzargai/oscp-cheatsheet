
#  Bypassing Basic Authentication

Some web pages are **protected with login popups**, called **Basic Authentication**.
If you try to visit them, a box pops up asking for a **username and password**.
But sometimes, due to **bad server configuration or insecure coding**, it’s possible to **bypass** this protection.This trick is called **HTTP Verb Tampering**.

![[Pasted image 20250731120624.png]]

#### What is HTTP Verb Tampering?
Web servers support different **HTTP methods** (also called **verbs**) like:
- `GET` → get a page
- `POST` → send data
- `HEAD` → like GET but only gets headers (not the actual page content)
- `OPTIONS` → ask the server what methods it allows
**Some web apps only block GET/POST** but forget to protect HEAD, OPTIONS, etc.
This means you can **send a different method**, like `HEAD`, to **bypass the login check**.
#### How Did We Find the Vulnerability?
1. **We tested a web app** that lets us add files, but the **Reset button** is protected.
2. When we click Reset, it sends a **GET request to `/admin/reset.php`**.
3. But that page is protected by **Basic Auth**, and we don’t have the password.
4. We tried sending a **POST** request instead, but it's also blocked. Still got **401 Unauthorized**.
5. Next, we used:
```bash
curl -i -X OPTIONS http://IP:PORT/
```
This shows what methods are allowed:
```bash
Allow: POST, OPTIONS, HEAD, GET
```
So the server accepts **HEAD** requests.

# # Bypassing Security Filters

HTTP Verb Tampering is a web security vulnerability where an attacker **bypasses access controls or security filters** by changing the HTTP request method (e.g., from `GET` to `HEAD`, `POST` to `GET`, etc.).

Sometimes, developers only filter dangerous input in `POST` requests — not in `GET` or other methods.

So if you:
- Send malicious input in a `POST` → Blocked ✅
- Send **the same** input in a `GET` → Allowed ❌

This is called an **insecure coding mistake**, and we can exploit it.).**
