### 🔄 What is Logrotate?

Every Linux system creates a lot of **log files** (system messages, service activity, errors, etc.). If not managed, these logs can:
- Fill up your hard drive
- Be hard to search through

So, Linux uses a tool called **`logrotate`** to:
- Rotate (rename and archive) old log files
- Delete or compress older logs
- Create new ones automatically

It is usually controlled by:
- A **main config file**: `/etc/logrotate.conf`
- **Per-service configs**: `/etc/logrotate.d/`

Logrotate runs automatically using **cron jobs** (scheduled tasks), and it usually runs as **root**.

---

### 💥 How Can It Be Exploited?

You can **exploit logrotate** to gain **root access** if these conditions are met:
1. ✅ You can **write to a log file** that logrotate will rotate.
2. ✅ Logrotate runs as **root**.
3. ✅ The system uses a **vulnerable version** (like 3.8.6, 3.11.0, etc.).
4. ✅ The logrotate config uses the `create` option (i.e., it creates a new file after rotating).

If all of the above are true, you can **inject malicious code** using an exploit called **`logrotten`**.