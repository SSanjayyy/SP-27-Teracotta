# OwlTech File Manager — CS 3502 Project 3

## Requirements
- Python 3.10+ (uses `tuple[bool, str]` type hint syntax)
- No external packages needed — only stdlib (`tkinter`, `os`, `shutil`, `stat`, `pathlib`)

## Run
```bash
python file_manager.py
```

## Features (all required CRUD ops)
| Operation  | How                              |
|------------|----------------------------------|
| CREATE     | "+ File" button or right-click   |
| READ       | Double-click file, or "View/Edit"|
| UPDATE     | Edit in right panel → 💾 Save    |
| DELETE     | 🗑 Delete button (with confirm)  |
| RENAME     | ✏ Rename button                  |
| NAVIGATE   | Double-click folder, Up / Home   |
| MKDIR      | "+ Dir" button                   |
| COPY       | 📋 Copy button → pick destination|
| PROPERTIES | ℹ Props button (inode, perms, timestamps) |

## OS Concepts Demonstrated
- **File Descriptors**: every open/read/write/close explicitly commented
- **Inodes**: stat() metadata shown in Properties dialog
- **Directory traversal**: scandir() wrapping opendir/readdir
- **Atomic rename**: os.rename() → rename() syscall
- **Permission checks**: os.access() before every write op
- **Error mapping**: EACCES, ENOENT, EEXIST, ENOTEMPTY all handled with user-friendly messages
