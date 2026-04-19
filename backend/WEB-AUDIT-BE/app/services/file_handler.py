import os, shutil, zipfile, tarfile

def allowed_archive(filename: str) -> bool:
    """Cek apakah file adalah archive (.zip / .tar / .gz)."""
    lower = filename.lower()
    return any(lower.endswith(ext) for ext in [".zip", ".tar.gz", ".tgz", ".tar"])

def allowed_single(filename: str) -> bool:
    """Cek apakah file adalah script tunggal (.py / .php / .js)."""
    lower = filename.lower()
    return any(lower.endswith(ext) for ext in [".py", ".php", ".js"])

def extract_archive(archive_path: str, dest_dir: str):
    """Ekstrak file .zip / .tar ke direktori tujuan."""
    if zipfile.is_zipfile(archive_path):
        with zipfile.ZipFile(archive_path, "r") as z:
            z.extractall(dest_dir)
    elif tarfile.is_tarfile(archive_path):
        with tarfile.open(archive_path, "r:*") as t:
            t.extractall(dest_dir)
    else:
        raise ValueError("Format archive tidak didukung.")

def handle_uploaded_file(uploaded, temp_root, repo_dir):
    """
    Simpan file upload dan tempatkan isinya di repo_dir.
    Bisa berupa file tunggal atau archive.
    """
    filename = uploaded.filename
    saved_file = os.path.join(temp_root, filename)
    uploaded.save(saved_file)

    from app.services.file_handler import allowed_archive, allowed_single, extract_archive

    if allowed_archive(filename):
        extract_archive(saved_file, repo_dir)
    elif allowed_single(filename):
        shutil.copy(saved_file, os.path.join(repo_dir, filename))
    else:
        raise ValueError("Format file tidak didukung. Gunakan .zip, .tar, .py, .php, atau .js")

    return True
