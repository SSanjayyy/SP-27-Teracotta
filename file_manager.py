"""
CS 3502 - Project 3: File System Implementation
OwlTech File Manager
Author: Sanjay Ravikumar

A GUI file manager built with Python and Tkinter demonstrating OS-level
file system operations including CRUD, directory navigation, metadata
display, and proper file handle management.
"""

import os
import shutil
import stat
import time
import tkinter as tk
from tkinter import ttk, messagebox, simpledialog, scrolledtext, filedialog
from pathlib import Path
from datetime import datetime


# ─────────────────────────────────────────────
#  FILE OPERATIONS LAYER  (separate from GUI)
# ─────────────────────────────────────────────

class FileOperations:
    """
    Wraps all OS-level file/directory operations.
    Keeps GUI code completely separate from system-call logic.
    Every method returns (success: bool, message: str).
    """

    @staticmethod
    def create_file(path: str, content: str = "") -> tuple[bool, str]:
        """
        Create a new file.  Uses OS open() → write() → close() sequence.
        Raises EEXIST if the file already exists.
        """
        if os.path.exists(path):
            return False, f"File already exists: {os.path.basename(path)}"
        try:
            # open() triggers OS to allocate a file descriptor and inode
            with open(path, "w", encoding="utf-8") as fh:   # fh = file handle / descriptor
                fh.write(content)
            # fh auto-closed here → OS releases file descriptor
            return True, f"File created: {os.path.basename(path)}"
        except PermissionError:
            return False, f"Permission denied: cannot create file in {os.path.dirname(path)}"
        except OSError as e:
            return False, f"OS error creating file: {e.strerror}"

    @staticmethod
    def read_file(path: str) -> tuple[bool, str]:
        """
        Read file contents.  OS opens file descriptor, checks read permission,
        transfers data through kernel buffers, then closes descriptor.
        """
        if not os.path.exists(path):
            return False, "File not found"
        if os.path.isdir(path):
            return False, "Cannot read a directory as a file"
        try:
            # OS: open() → allocate fd → check read permission via inode
            with open(path, "r", encoding="utf-8", errors="replace") as fh:
                content = fh.read()
            # OS: close() → decrement reference count → flush buffers if needed
            return True, content
        except PermissionError:
            return False, "Permission denied: you don't have read access to this file"
        except OSError as e:
            return False, f"OS error reading file: {e.strerror}"

    @staticmethod
    def update_file(path: str, new_content: str) -> tuple[bool, str]:
        """
        Overwrite file contents.  Checks writability before opening.
        OS calls: open() with O_WRONLY|O_TRUNC → write() → close()
        """
        if not os.path.exists(path):
            return False, "File not found"
        if not os.access(path, os.W_OK):
            return False, "File is read-only: cannot write"
        try:
            with open(path, "w", encoding="utf-8") as fh:
                fh.write(new_content)
            return True, f"File saved: {os.path.basename(path)}"
        except PermissionError:
            return False, "Permission denied: cannot write to this file"
        except OSError as e:
            return False, f"OS error updating file: {e.strerror}"

    @staticmethod
    def delete_file(path: str) -> tuple[bool, str]:
        """
        Delete a file.  OS unlink() decrements inode reference count;
        data blocks freed when count reaches zero.
        """
        if not os.path.exists(path):
            return False, "File not found"
        try:
            os.remove(path)   # → unlink() syscall
            return True, f"Deleted: {os.path.basename(path)}"
        except PermissionError:
            return False, "Permission denied: cannot delete this file"
        except OSError as e:
            return False, f"OS error deleting file: {e.strerror}"

    @staticmethod
    def rename_item(old_path: str, new_name: str) -> tuple[bool, str]:
        """
        Rename/move a file or directory.
        Uses OS rename() syscall which is atomic on UNIX-like systems
        (and mostly atomic on Windows NTFS via MoveFileEx).
        """
        parent = os.path.dirname(old_path)
        new_path = os.path.join(parent, new_name)
        if os.path.exists(new_path):
            return False, f"A file named '{new_name}' already exists"
        try:
            os.rename(old_path, new_path)   # → rename() syscall (atomic)
            return True, f"Renamed to: {new_name}"
        except PermissionError:
            return False, "Permission denied: cannot rename this item"
        except OSError as e:
            return False, f"OS error renaming: {e.strerror}"

    @staticmethod
    def create_directory(path: str) -> tuple[bool, str]:
        """
        Create a directory.  OS mkdir() allocates an inode and
        creates '.' and '..' entries automatically.
        """
        if os.path.exists(path):
            return False, f"Directory already exists: {os.path.basename(path)}"
        try:
            os.mkdir(path)   # → mkdir() syscall
            return True, f"Directory created: {os.path.basename(path)}"
        except PermissionError:
            return False, "Permission denied: cannot create directory here"
        except OSError as e:
            return False, f"OS error creating directory: {e.strerror}"

    @staticmethod
    def delete_directory(path: str, recursive: bool = False) -> tuple[bool, str]:
        """
        Delete a directory.
        Empty: rmdir() syscall.  Non-empty: shutil.rmtree (recursive unlinks).
        """
        if not os.path.exists(path):
            return False, "Directory not found"
        try:
            if recursive:
                shutil.rmtree(path)
            else:
                os.rmdir(path)   # → rmdir() syscall; fails if not empty
            return True, f"Deleted directory: {os.path.basename(path)}"
        except OSError as err:
            if err.errno == 39 or "[WinError 145]" in str(err):   # ENOTEMPTY
                return False, "Directory is not empty. Delete contents first, or use recursive delete."
            if err.errno == 13:   # EACCES
                return False, "Permission denied: cannot delete this directory"
            return False, f"OS error: {err.strerror}"

    @staticmethod
    def copy_file(src: str, dst_dir: str) -> tuple[bool, str]:
        """Copy a file into dst_dir, preserving metadata."""
        name = os.path.basename(src)
        dst = os.path.join(dst_dir, name)
        if os.path.exists(dst):
            return False, f"'{name}' already exists in destination"
        try:
            shutil.copy2(src, dst)   # copy2 preserves timestamps
            return True, f"Copied '{name}' to {dst_dir}"
        except PermissionError:
            return False, "Permission denied during copy"
        except OSError as e:
            return False, f"Copy failed: {e.strerror}"

    @staticmethod
    def get_metadata(path: str) -> dict | None:
        """
        Retrieve file metadata via stat() syscall.
        Returns inode-level information: size, permissions, timestamps.
        Note: filename is NOT in the inode; it comes from the directory entry.
        """
        try:
            # os.stat() → stat() syscall → reads inode structure
            st = os.stat(path)
            mode = st.st_mode
            perms = stat.filemode(mode)   # e.g. "-rwxr-xr-x"
            return {
                "name":      os.path.basename(path),
                "path":      path,
                "size":      st.st_size,
                "size_hr":   FileOperations._human_size(st.st_size),
                "perms":     perms,
                "inode":     st.st_ino,
                "created":   datetime.fromtimestamp(st.st_ctime).strftime("%Y-%m-%d %H:%M:%S"),
                "modified":  datetime.fromtimestamp(st.st_mtime).strftime("%Y-%m-%d %H:%M:%S"),
                "accessed":  datetime.fromtimestamp(st.st_atime).strftime("%Y-%m-%d %H:%M:%S"),
                "is_dir":    os.path.isdir(path),
                "readable":  os.access(path, os.R_OK),
                "writable":  os.access(path, os.W_OK),
            }
        except (PermissionError, FileNotFoundError, OSError):
            return None

    @staticmethod
    def list_directory(path: str) -> tuple[bool, list]:
        """
        List directory contents.
        OS: opendir() → readdir() loop → closedir()
        Each name maps to an inode via the directory's internal table.
        """
        try:
            entries = []
            # os.scandir() uses opendir/readdir syscalls under the hood
            with os.scandir(path) as it:
                for entry in it:
                    try:
                        st = entry.stat()
                        entries.append({
                            "name":     entry.name,
                            "path":     entry.path,
                            "is_dir":   entry.is_dir(),
                            "size":     st.st_size,
                            "size_hr":  FileOperations._human_size(st.st_size),
                            "modified": datetime.fromtimestamp(st.st_mtime).strftime("%Y-%m-%d %H:%M:%S"),
                        })
                    except (PermissionError, OSError):
                        entries.append({
                            "name": entry.name,
                            "path": entry.path,
                            "is_dir": False,
                            "size": 0,
                            "size_hr": "?",
                            "modified": "?",
                        })
            # Sort: directories first, then files, both alphabetically
            entries.sort(key=lambda e: (not e["is_dir"], e["name"].lower()))
            return True, entries
        except PermissionError:
            return False, []
        except FileNotFoundError:
            return False, []
        except OSError:
            return False, []

    @staticmethod
    def _human_size(n: int) -> str:
        for unit in ("B", "KB", "MB", "GB", "TB"):
            if n < 1024:
                return f"{n:.1f} {unit}" if unit != "B" else f"{n} B"
            n /= 1024
        return f"{n:.1f} PB"


# ─────────────────────────────────────────────
#  GUI LAYER
# ─────────────────────────────────────────────

DARK_BG     = "#1e1e2e"
PANEL_BG    = "#181825"
ACCENT      = "#89b4fa"   # blue
ACCENT2     = "#a6e3a1"   # green
WARN        = "#f38ba8"   # red
TEXT_MAIN   = "#cdd6f4"
TEXT_DIM    = "#6c7086"
BORDER      = "#313244"
BUTTON_BG   = "#313244"
BUTTON_HOV  = "#45475a"
ENTRY_BG    = "#313244"


class OwlFileManager(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("OwlTech File Manager  —  CS 3502 P3")
        self.geometry("1150x720")
        self.minsize(900, 600)
        self.configure(bg=DARK_BG)

        self.ops = FileOperations()
        self.current_path = tk.StringVar(value=str(Path.home()))
        self.selected_path: str | None = None
        self.edit_dirty = False   # unsaved changes flag

        self._build_styles()
        self._build_ui()
        self._refresh()

    # ── STYLES ──────────────────────────────────────────────────────────

    def _build_styles(self):
        style = ttk.Style(self)
        style.theme_use("clam")

        style.configure("Treeview",
            background=PANEL_BG, foreground=TEXT_MAIN,
            fieldbackground=PANEL_BG, rowheight=24,
            borderwidth=0, font=("Consolas", 10))
        style.configure("Treeview.Heading",
            background=DARK_BG, foreground=ACCENT,
            relief="flat", font=("Consolas", 10, "bold"))
        style.map("Treeview",
            background=[("selected", ACCENT)],
            foreground=[("selected", "#1e1e2e")])

        style.configure("TScrollbar",
            background=BUTTON_BG, troughcolor=DARK_BG,
            arrowcolor=TEXT_DIM, borderwidth=0)

        style.configure("Status.TLabel",
            background=PANEL_BG, foreground=TEXT_DIM,
            font=("Consolas", 9), padding=(8, 3))
        style.configure("Path.TLabel",
            background=DARK_BG, foreground=ACCENT,
            font=("Consolas", 10, "bold"), padding=(4, 0))

    # ── LAYOUT ──────────────────────────────────────────────────────────

    def _build_ui(self):
        # ── Top bar: path + nav ──────────────────────────────
        topbar = tk.Frame(self, bg=DARK_BG, pady=6, padx=10)
        topbar.pack(fill="x", side="top")

        tk.Button(topbar, text="⬆ Up", command=self._go_up,
                  bg=BUTTON_BG, fg=TEXT_MAIN, relief="flat",
                  font=("Consolas", 10), padx=8, cursor="hand2",
                  activebackground=BUTTON_HOV, activeforeground=TEXT_MAIN
                  ).pack(side="left", padx=(0, 6))

        tk.Button(topbar, text="🏠 Home", command=self._go_home,
                  bg=BUTTON_BG, fg=TEXT_MAIN, relief="flat",
                  font=("Consolas", 10), padx=8, cursor="hand2",
                  activebackground=BUTTON_HOV, activeforeground=TEXT_MAIN
                  ).pack(side="left", padx=(0, 10))

        ttk.Label(topbar, text="PATH:", style="Path.TLabel").pack(side="left")

        self.path_entry = tk.Entry(topbar, textvariable=self.current_path,
                                   bg=ENTRY_BG, fg=ACCENT, insertbackground=ACCENT,
                                   relief="flat", font=("Consolas", 10), bd=0)
        self.path_entry.pack(side="left", fill="x", expand=True, padx=(4, 8), ipady=4)
        self.path_entry.bind("<Return>", lambda _: self._navigate_to(self.current_path.get()))

        tk.Button(topbar, text="Go", command=lambda: self._navigate_to(self.current_path.get()),
                  bg=ACCENT, fg=DARK_BG, relief="flat",
                  font=("Consolas", 10, "bold"), padx=10, cursor="hand2",
                  activebackground="#7aa2d4"
                  ).pack(side="left")

        # ── Separator ────────────────────────────────────────
        tk.Frame(self, bg=BORDER, height=1).pack(fill="x")

        # ── Main area ────────────────────────────────────────
        main = tk.Frame(self, bg=DARK_BG)
        main.pack(fill="both", expand=True, padx=0, pady=0)

        # Left: file list
        left = tk.Frame(main, bg=PANEL_BG, width=420)
        left.pack(side="left", fill="both", expand=False)
        left.pack_propagate(False)

        self._build_toolbar(left)
        self._build_tree(left)

        # Divider
        tk.Frame(main, bg=BORDER, width=1).pack(side="left", fill="y")

        # Right: editor + metadata
        right = tk.Frame(main, bg=DARK_BG)
        right.pack(side="left", fill="both", expand=True)

        self._build_editor(right)

        # ── Status bar ───────────────────────────────────────
        tk.Frame(self, bg=BORDER, height=1).pack(fill="x")
        self.status_var = tk.StringVar(value="Ready")
        ttk.Label(self, textvariable=self.status_var, style="Status.TLabel"
                  ).pack(fill="x", side="bottom")

    def _build_toolbar(self, parent):
        bar = tk.Frame(parent, bg=PANEL_BG, pady=6, padx=8)
        bar.pack(fill="x")

        btns = [
            ("+ File",   ACCENT2,  self._cmd_new_file),
            ("+ Dir",    ACCENT,   self._cmd_new_dir),
            ("✏ Rename", "#fab387", self._cmd_rename),
            ("🗑 Delete", WARN,     self._cmd_delete),
            ("📋 Copy",  "#cba6f7", self._cmd_copy),
            ("ℹ Props",  TEXT_DIM,  self._cmd_properties),
        ]
        for label, color, cmd in btns:
            tk.Button(bar, text=label, command=cmd,
                      bg=BUTTON_BG, fg=color, relief="flat",
                      font=("Consolas", 9), padx=6, pady=2,
                      cursor="hand2", activebackground=BUTTON_HOV,
                      activeforeground=color
                      ).pack(side="left", padx=2)

    def _build_tree(self, parent):
        frame = tk.Frame(parent, bg=PANEL_BG)
        frame.pack(fill="both", expand=True, padx=6, pady=(0, 6))

        cols = ("name", "size", "modified")
        self.tree = ttk.Treeview(frame, columns=cols, show="headings",
                                  selectmode="browse")
        self.tree.heading("name",     text="Name")
        self.tree.heading("size",     text="Size")
        self.tree.heading("modified", text="Modified")
        self.tree.column("name",     width=200, minwidth=120)
        self.tree.column("size",     width=70,  minwidth=50,  anchor="e")
        self.tree.column("modified", width=140, minwidth=100)

        vsb = ttk.Scrollbar(frame, orient="vertical",   command=self.tree.yview)
        hsb = ttk.Scrollbar(frame, orient="horizontal", command=self.tree.xview)
        self.tree.configure(yscrollcommand=vsb.set, xscrollcommand=hsb.set)

        self.tree.grid(row=0, column=0, sticky="nsew")
        vsb.grid(row=0, column=1, sticky="ns")
        hsb.grid(row=1, column=0, sticky="ew")
        frame.rowconfigure(0, weight=1)
        frame.columnconfigure(0, weight=1)

        self.tree.bind("<Double-1>",       self._on_double_click)
        self.tree.bind("<<TreeviewSelect>>", self._on_select)
        self.tree.bind("<Button-3>",       self._show_context_menu)

        # Context menu
        self.ctx = tk.Menu(self, tearoff=0,
                           bg=PANEL_BG, fg=TEXT_MAIN,
                           activebackground=ACCENT, activeforeground=DARK_BG,
                           font=("Consolas", 10), bd=0)
        self.ctx.add_command(label="Open / Navigate",  command=self._on_open)
        self.ctx.add_command(label="View / Edit",      command=self._cmd_open_editor)
        self.ctx.add_separator()
        self.ctx.add_command(label="Rename",           command=self._cmd_rename)
        self.ctx.add_command(label="Copy here…",       command=self._cmd_copy)
        self.ctx.add_command(label="Delete",           command=self._cmd_delete)
        self.ctx.add_separator()
        self.ctx.add_command(label="Properties",       command=self._cmd_properties)

    def _build_editor(self, parent):
        # Editor header
        hdr = tk.Frame(parent, bg=DARK_BG, pady=6, padx=10)
        hdr.pack(fill="x")

        self.editor_label = tk.Label(hdr, text="No file open",
                                     bg=DARK_BG, fg=TEXT_DIM,
                                     font=("Consolas", 10))
        self.editor_label.pack(side="left")

        self.save_btn = tk.Button(hdr, text="💾 Save", command=self._cmd_save,
                                  bg=ACCENT2, fg=DARK_BG, relief="flat",
                                  font=("Consolas", 10, "bold"), padx=10,
                                  cursor="hand2", state="disabled",
                                  activebackground="#8fd99a")
        self.save_btn.pack(side="right")

        tk.Frame(parent, bg=BORDER, height=1).pack(fill="x")

        # Text area
        self.editor = scrolledtext.ScrolledText(
            parent, wrap="word",
            bg=PANEL_BG, fg=TEXT_MAIN, insertbackground=ACCENT,
            selectbackground=ACCENT, selectforeground=DARK_BG,
            font=("Consolas", 11), relief="flat",
            padx=12, pady=10, spacing1=2, spacing3=2,
            state="disabled"
        )
        self.editor.pack(fill="both", expand=True, padx=0, pady=0)
        self.editor.bind("<<Modified>>", self._on_editor_change)

        # Metadata panel
        tk.Frame(parent, bg=BORDER, height=1).pack(fill="x")
        self.meta_frame = tk.Frame(parent, bg=DARK_BG, padx=12, pady=8)
        self.meta_frame.pack(fill="x")
        self.meta_label = tk.Label(self.meta_frame, text="",
                                   bg=DARK_BG, fg=TEXT_DIM,
                                   font=("Consolas", 9), justify="left")
        self.meta_label.pack(anchor="w")

    # ── TREE REFRESH ────────────────────────────────────────────────────

    def _refresh(self, keep_selection: str | None = None):
        path = self.current_path.get()
        if not os.path.isdir(path):
            self._set_status(f"Not a directory: {path}", error=True)
            return

        ok, entries = FileOperations.list_directory(path)
        self.tree.delete(*self.tree.get_children())

        if not ok:
            self._set_status("Cannot read directory (permission denied)", error=True)
            return

        for e in entries:
            icon = "📁" if e["is_dir"] else "📄"
            display_name = f"{icon} {e['name']}"
            iid = self.tree.insert("", "end",
                                   values=(display_name, e["size_hr"], e["modified"]),
                                   tags=("dir" if e["is_dir"] else "file",))
            # Store full path in item id mapping
            self.tree.set(iid, "name", display_name)
            self.tree.item(iid, tags=(e["path"],))   # reuse tags slot for path

        self._set_status(f"{len(entries)} items  |  {path}")

    def _get_selected_path(self) -> str | None:
        sel = self.tree.selection()
        if not sel:
            return None
        tags = self.tree.item(sel[0], "tags")
        return tags[0] if tags else None

    # ── NAVIGATION ──────────────────────────────────────────────────────

    def _on_double_click(self, _event=None):
        path = self._get_selected_path()
        if path and os.path.isdir(path):
            self._navigate_to(path)
        elif path:
            self._load_file_in_editor(path)

    def _on_open(self):
        path = self._get_selected_path()
        if path and os.path.isdir(path):
            self._navigate_to(path)
        elif path:
            self._load_file_in_editor(path)

    def _navigate_to(self, path: str):
        path = os.path.normpath(path)
        if not os.path.isdir(path):
            self._set_status(f"Not a valid directory: {path}", error=True)
            return
        self.current_path.set(path)
        self._refresh()

    def _go_up(self):
        parent = os.path.dirname(self.current_path.get())
        if parent != self.current_path.get():
            self._navigate_to(parent)

    def _go_home(self):
        self._navigate_to(str(Path.home()))

    def _on_select(self, _event=None):
        path = self._get_selected_path()
        if path:
            self.selected_path = path
            meta = FileOperations.get_metadata(path)
            if meta:
                self._show_meta_bar(meta)

    # ── EDITOR ──────────────────────────────────────────────────────────

    def _load_file_in_editor(self, path: str):
        if self.edit_dirty:
            if not messagebox.askyesno("Unsaved Changes",
                                        "You have unsaved changes. Discard and open new file?"):
                return

        ok, result = FileOperations.read_file(path)
        if not ok:
            self._set_status(result, error=True)
            return

        self.editor.configure(state="normal")
        self.editor.delete("1.0", "end")
        self.editor.insert("1.0", result)
        self.editor.edit_modified(False)
        self.edit_dirty = False

        writable = os.access(path, os.W_OK)
        self.editor.configure(state="normal" if writable else "disabled")
        self.save_btn.configure(state="normal" if writable else "disabled")
        self.editor_label.configure(
            text=f"{'✏' if writable else '🔒'} {os.path.basename(path)}",
            fg=ACCENT if writable else TEXT_DIM
        )
        self._editing_path = path
        self._set_status(f"Opened: {os.path.basename(path)}" +
                         ("" if writable else "  [read-only]"))

    def _on_editor_change(self, _event=None):
        if self.editor.edit_modified():
            self.edit_dirty = True

    def _cmd_open_editor(self):
        path = self._get_selected_path()
        if path and not os.path.isdir(path):
            self._load_file_in_editor(path)

    def _cmd_save(self):
        if not hasattr(self, "_editing_path"):
            return
        content = self.editor.get("1.0", "end-1c")
        ok, msg = FileOperations.update_file(self._editing_path, content)
        self._set_status(msg, error=not ok)
        if ok:
            self.edit_dirty = False
            self.editor.edit_modified(False)
        self._refresh()

    # ── CRUD COMMANDS ───────────────────────────────────────────────────

    def _cmd_new_file(self):
        name = simpledialog.askstring("New File", "File name:",
                                      parent=self)
        if not name:
            return
        path = os.path.join(self.current_path.get(), name)
        ok, msg = FileOperations.create_file(path)
        self._set_status(msg, error=not ok)
        if ok:
            self._refresh()
            self._load_file_in_editor(path)

    def _cmd_new_dir(self):
        name = simpledialog.askstring("New Directory", "Directory name:",
                                      parent=self)
        if not name:
            return
        path = os.path.join(self.current_path.get(), name)
        ok, msg = FileOperations.create_directory(path)
        self._set_status(msg, error=not ok)
        if ok:
            self._refresh()

    def _cmd_rename(self):
        path = self._get_selected_path()
        if not path:
            self._set_status("Select an item to rename", error=True)
            return
        old_name = os.path.basename(path)
        new_name = simpledialog.askstring("Rename", f"New name for '{old_name}':",
                                           initialvalue=old_name, parent=self)
        if not new_name or new_name == old_name:
            return
        ok, msg = FileOperations.rename_item(path, new_name)
        self._set_status(msg, error=not ok)
        if ok:
            self._refresh()

    def _cmd_delete(self):
        path = self._get_selected_path()
        if not path:
            self._set_status("Select an item to delete", error=True)
            return
        name = os.path.basename(path)
        is_dir = os.path.isdir(path)

        confirmed = messagebox.askyesno(
            "Confirm Delete",
            f"Permanently delete '{name}'?" +
            ("\n\nThis directory may contain files." if is_dir else ""),
            icon="warning", parent=self
        )
        if not confirmed:
            return

        if is_dir:
            # Try non-recursive first; offer recursive if not empty
            ok, msg = FileOperations.delete_directory(path, recursive=False)
            if not ok and "not empty" in msg.lower():
                recurse = messagebox.askyesno(
                    "Directory Not Empty",
                    f"'{name}' is not empty. Delete ALL contents recursively?",
                    icon="warning", parent=self
                )
                if recurse:
                    ok, msg = FileOperations.delete_directory(path, recursive=True)
                else:
                    return
        else:
            ok, msg = FileOperations.delete_file(path)

        self._set_status(msg, error=not ok)
        if ok:
            self._refresh()
            self.meta_label.configure(text="")

    def _cmd_copy(self):
        path = self._get_selected_path()
        if not path or os.path.isdir(path):
            self._set_status("Select a file to copy", error=True)
            return
        dst = filedialog.askdirectory(title="Copy to directory…", parent=self)
        if not dst:
            return
        ok, msg = FileOperations.copy_file(path, dst)
        self._set_status(msg, error=not ok)
        if ok:
            self._refresh()

    def _cmd_properties(self):
        path = self._get_selected_path()
        if not path:
            self._set_status("Select an item to view properties", error=True)
            return
        meta = FileOperations.get_metadata(path)
        if not meta:
            self._set_status("Could not retrieve metadata", error=True)
            return

        win = tk.Toplevel(self)
        win.title(f"Properties — {meta['name']}")
        win.configure(bg=DARK_BG)
        win.resizable(False, False)

        def row(label, value, r):
            tk.Label(win, text=label, bg=DARK_BG, fg=TEXT_DIM,
                     font=("Consolas", 10), anchor="e", width=14
                     ).grid(row=r, column=0, padx=(16, 4), pady=3, sticky="e")
            tk.Label(win, text=value, bg=DARK_BG, fg=TEXT_MAIN,
                     font=("Consolas", 10), anchor="w"
                     ).grid(row=r, column=1, padx=(4, 16), pady=3, sticky="w")

        tk.Label(win, text=f"{'📁' if meta['is_dir'] else '📄'} {meta['name']}",
                 bg=DARK_BG, fg=ACCENT, font=("Consolas", 13, "bold")
                 ).grid(row=0, column=0, columnspan=2, pady=(14, 6), padx=16)

        tk.Frame(win, bg=BORDER, height=1).grid(row=1, column=0, columnspan=2, sticky="ew", padx=16)

        fields = [
            ("Type",      "Directory" if meta["is_dir"] else "File"),
            ("Size",      meta["size_hr"]),
            ("Inode",     str(meta["inode"]) if meta["inode"] else "N/A"),
            ("Perms",     meta["perms"]),
            ("Readable",  "Yes" if meta["readable"] else "No"),
            ("Writable",  "Yes" if meta["writable"] else "No"),
            ("Created",   meta["created"]),
            ("Modified",  meta["modified"]),
            ("Accessed",  meta["accessed"]),
            ("Path",      meta["path"]),
        ]
        for i, (lbl, val) in enumerate(fields):
            row(lbl, val, i + 2)

        tk.Button(win, text="Close", command=win.destroy,
                  bg=BUTTON_BG, fg=TEXT_MAIN, relief="flat",
                  font=("Consolas", 10), padx=16, cursor="hand2"
                  ).grid(row=len(fields) + 3, column=0, columnspan=2, pady=12)

    # ── META BAR ────────────────────────────────────────────────────────

    def _show_meta_bar(self, meta: dict):
        icon = "📁" if meta["is_dir"] else "📄"
        text = (
            f"{icon}  {meta['name']}    "
            f"Size: {meta['size_hr']}    "
            f"Modified: {meta['modified']}    "
            f"Perms: {meta['perms']}    "
            f"{'Writable' if meta['writable'] else 'Read-only'}"
        )
        self.meta_label.configure(text=text)

    # ── CONTEXT MENU ────────────────────────────────────────────────────

    def _show_context_menu(self, event):
        iid = self.tree.identify_row(event.y)
        if iid:
            self.tree.selection_set(iid)
            self._on_select()
        try:
            self.ctx.tk_popup(event.x_root, event.y_root)
        finally:
            self.ctx.grab_release()

    # ── STATUS ──────────────────────────────────────────────────────────

    def _set_status(self, msg: str, error: bool = False):
        self.status_var.set(("⚠  " if error else "✓  ") + msg)
        # After 6 s revert to path count (non-error only)
        if not error:
            self.after(6000, lambda: self.status_var.set(
                f"✓  {self.current_path.get()}"))


# ─────────────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    app = OwlFileManager()
    app.mainloop()
