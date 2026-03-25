use std::fs;
use std::path::{Path, PathBuf};
use zip::ZipArchive;

/// Maximum total extracted size: 50 MB
const MAX_EXTRACT_SIZE: u64 = 50 * 1024 * 1024;

#[derive(Debug, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub enum SkinError {
    FileNotFound(String),
    InvalidArchive(String),
    ZipSlip(String),
    TooLarge(String),
    IoError(String),
}

impl std::fmt::Display for SkinError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            SkinError::FileNotFound(msg) => write!(f, "File not found: {}", msg),
            SkinError::InvalidArchive(msg) => write!(f, "Invalid archive: {}", msg),
            SkinError::ZipSlip(msg) => write!(f, "Zip slip detected: {}", msg),
            SkinError::TooLarge(msg) => write!(f, "Archive too large: {}", msg),
            SkinError::IoError(msg) => write!(f, "IO error: {}", msg),
        }
    }
}

#[derive(Debug, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SkinParseResult {
    pub skin_name: String,
    pub extract_dir: String,
    pub files: Vec<String>,
}

/// Validate that a path does not escape the target directory (zip-slip protection).
/// Rejects any entry with `..`, root, or prefix components BEFORE touching the filesystem.
fn is_safe_path(extract_dir: &Path, entry_name: &str) -> Result<PathBuf, SkinError> {
    use std::path::Component;

    for component in Path::new(entry_name).components() {
        match component {
            Component::ParentDir | Component::RootDir | Component::Prefix(_) => {
                return Err(SkinError::ZipSlip(entry_name.to_string()));
            }
            _ => {}
        }
    }

    Ok(extract_dir.join(entry_name))
}

/// Extract a .wsz skin archive to a temporary directory.
/// Returns the list of extracted file paths relative to the output directory.
#[tauri::command]
pub fn parse_skin(wsz_path: String) -> Result<SkinParseResult, SkinError> {
    let wsz = Path::new(&wsz_path);

    if !wsz.exists() {
        return Err(SkinError::FileNotFound(wsz_path));
    }

    let file = fs::File::open(wsz).map_err(|e| SkinError::IoError(e.to_string()))?;
    let mut archive =
        ZipArchive::new(file).map_err(|e| SkinError::InvalidArchive(e.to_string()))?;

    // Check total uncompressed size before extracting
    let mut total_size: u64 = 0;
    for i in 0..archive.len() {
        let entry = archive
            .by_index(i)
            .map_err(|e| SkinError::InvalidArchive(e.to_string()))?;
        total_size += entry.size();
    }

    if total_size > MAX_EXTRACT_SIZE {
        return Err(SkinError::TooLarge(format!(
            "Uncompressed size {} bytes exceeds limit of {} bytes",
            total_size, MAX_EXTRACT_SIZE
        )));
    }

    let skin_name = wsz
        .file_stem()
        .unwrap_or_default()
        .to_string_lossy()
        .to_string();
    let extract_dir = std::env::temp_dir().join("sikamp-skins").join(&skin_name);

    // Clean previous extraction if any
    if extract_dir.exists() {
        fs::remove_dir_all(&extract_dir).map_err(|e| SkinError::IoError(e.to_string()))?;
    }
    fs::create_dir_all(&extract_dir).map_err(|e| SkinError::IoError(e.to_string()))?;

    let mut extracted_files: Vec<String> = Vec::new();
    let mut extracted_size: u64 = 0;

    for i in 0..archive.len() {
        let mut entry = archive
            .by_index(i)
            .map_err(|e| SkinError::InvalidArchive(e.to_string()))?;

        let entry_name = entry.name().to_string();

        // Skip directories and hidden/system files
        if entry.is_dir() || entry_name.starts_with("__MACOSX") || entry_name.starts_with('.') {
            continue;
        }

        // Zip-slip protection (no filesystem side effects before validation)
        let output_path = is_safe_path(&extract_dir, &entry_name)?;

        // Ensure parent directory exists (safe — path is validated above)
        if let Some(parent) = output_path.parent() {
            fs::create_dir_all(parent).map_err(|e| SkinError::IoError(e.to_string()))?;
        }

        let mut outfile =
            fs::File::create(&output_path).map_err(|e| SkinError::IoError(e.to_string()))?;

        let written =
            std::io::copy(&mut entry, &mut outfile).map_err(|e| SkinError::IoError(e.to_string()))?;

        // Runtime size guard in case pre-check was bypassed (data descriptors)
        extracted_size += written;
        if extracted_size > MAX_EXTRACT_SIZE {
            // Clean up partial extraction
            let _ = fs::remove_dir_all(&extract_dir);
            return Err(SkinError::TooLarge(format!(
                "Extracted size {} bytes exceeds limit of {} bytes",
                extracted_size, MAX_EXTRACT_SIZE
            )));
        }

        extracted_files.push(entry_name);
    }

    Ok(SkinParseResult {
        skin_name,
        extract_dir: extract_dir.to_string_lossy().to_string(),
        files: extracted_files,
    })
}

/// Copy a .wsz file to the user's skin library directory.
/// Returns the destination path.
#[tauri::command]
pub fn copy_skin_to_library(
    app_handle: tauri::AppHandle,
    wsz_path: String,
) -> Result<String, SkinError> {
    let source = Path::new(&wsz_path);
    if !source.exists() {
        return Err(SkinError::FileNotFound(wsz_path));
    }

    use tauri::Manager;
    let app_data = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| SkinError::IoError(e.to_string()))?;
    let skins_dir = app_data.join("skins");
    fs::create_dir_all(&skins_dir).map_err(|e| SkinError::IoError(e.to_string()))?;

    let file_name = source
        .file_name()
        .ok_or_else(|| SkinError::IoError("Invalid file name".to_string()))?;
    let dest = skins_dir.join(file_name);

    fs::copy(source, &dest).map_err(|e| SkinError::IoError(e.to_string()))?;

    Ok(dest.to_string_lossy().to_string())
}

/// Load a saved skin by path. If the file doesn't exist, returns None (silent fallback).
#[tauri::command]
pub fn load_saved_skin(wsz_path: String) -> Result<Option<SkinParseResult>, SkinError> {
    let wsz = Path::new(&wsz_path);
    if !wsz.exists() {
        return Ok(None);
    }
    parse_skin(wsz_path).map(Some)
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::io::Write;
    use zip::write::SimpleFileOptions;

    /// Helper: create a valid .wsz (ZIP) with given files and contents
    fn create_test_wsz(dir: &Path, name: &str, files: &[(&str, &[u8])]) -> PathBuf {
        let wsz_path = dir.join(name);
        let file = fs::File::create(&wsz_path).unwrap();
        let mut zip = zip::ZipWriter::new(file);
        let options = SimpleFileOptions::default();

        for (fname, content) in files {
            zip.start_file(*fname, options).unwrap();
            zip.write_all(content).unwrap();
        }

        zip.finish().unwrap();
        wsz_path
    }

    #[test]
    fn test_parse_valid_skin() {
        let tmp = tempfile::tempdir().unwrap();
        let wsz = create_test_wsz(
            tmp.path(),
            "test_skin.wsz",
            &[
                ("main.bmp", b"fake bmp data"),
                ("titlebar.bmp", b"fake titlebar"),
                ("viscolor.txt", b"0,0,0\n255,255,255"),
            ],
        );

        let result = parse_skin(wsz.to_string_lossy().to_string()).unwrap();
        assert_eq!(result.skin_name, "test_skin");
        assert_eq!(result.files.len(), 3);
        assert!(result.files.contains(&"main.bmp".to_string()));
        assert!(result.files.contains(&"titlebar.bmp".to_string()));
        assert!(result.files.contains(&"viscolor.txt".to_string()));

        // Verify files actually exist on disk
        let extract = Path::new(&result.extract_dir);
        assert!(extract.join("main.bmp").exists());
        assert!(extract.join("titlebar.bmp").exists());
    }

    #[test]
    fn test_parse_corrupted_archive() {
        let tmp = tempfile::tempdir().unwrap();
        let corrupt_path = tmp.path().join("corrupt.wsz");
        fs::write(&corrupt_path, b"this is not a zip file").unwrap();

        let result = parse_skin(corrupt_path.to_string_lossy().to_string());
        assert!(result.is_err());
        match result.unwrap_err() {
            SkinError::InvalidArchive(_) => {} // expected
            other => panic!("Expected InvalidArchive, got: {:?}", other),
        }
    }

    #[test]
    fn test_parse_file_not_found() {
        let result = parse_skin("/nonexistent/path/skin.wsz".to_string());
        assert!(result.is_err());
        match result.unwrap_err() {
            SkinError::FileNotFound(_) => {}
            other => panic!("Expected FileNotFound, got: {:?}", other),
        }
    }

    #[test]
    fn test_zip_slip_protection() {
        // Test is_safe_path directly since the zip crate normalizes paths on write
        let tmp = tempfile::tempdir().unwrap();
        let extract_dir = tmp.path().join("extract");
        fs::create_dir_all(&extract_dir).unwrap();

        // Valid path should succeed
        let result = is_safe_path(&extract_dir, "main.bmp");
        assert!(result.is_ok());

        // Path traversal should fail
        let result = is_safe_path(&extract_dir, "../../etc/passwd");
        assert!(result.is_err());
        match result.unwrap_err() {
            SkinError::ZipSlip(_) => {}
            other => panic!("Expected ZipSlip, got: {:?}", other),
        }

        // Nested traversal should also fail
        let result = is_safe_path(&extract_dir, "subdir/../../../etc/shadow");
        assert!(result.is_err());
        match result.unwrap_err() {
            SkinError::ZipSlip(_) => {}
            other => panic!("Expected ZipSlip, got: {:?}", other),
        }
    }

    #[test]
    fn test_size_limit() {
        let tmp = tempfile::tempdir().unwrap();
        // Create a zip with a file that claims to be > 50MB uncompressed
        // We'll create a real large-ish content to trigger the size check
        let wsz_path = tmp.path().join("large.wsz");
        let file = fs::File::create(&wsz_path).unwrap();
        let mut zip = zip::ZipWriter::new(file);
        let options = SimpleFileOptions::default();

        // Write many files to exceed the limit. Each file is 1MB of zeros.
        // 51 files × 1MB = 51MB > 50MB limit
        let one_mb = vec![0u8; 1024 * 1024];
        for i in 0..51 {
            zip.start_file(format!("file_{}.bin", i), options).unwrap();
            zip.write_all(&one_mb).unwrap();
        }
        zip.finish().unwrap();

        let result = parse_skin(wsz_path.to_string_lossy().to_string());
        assert!(result.is_err());
        match result.unwrap_err() {
            SkinError::TooLarge(_) => {}
            other => panic!("Expected TooLarge, got: {:?}", other),
        }
    }

    #[test]
    fn test_skips_macosx_and_hidden_files() {
        let tmp = tempfile::tempdir().unwrap();
        let wsz = create_test_wsz(
            tmp.path(),
            "clean.wsz",
            &[
                ("main.bmp", b"data"),
                ("__MACOSX/main.bmp", b"resource fork"),
                (".hidden", b"hidden file"),
            ],
        );

        let result = parse_skin(wsz.to_string_lossy().to_string()).unwrap();
        assert_eq!(result.files.len(), 1);
        assert_eq!(result.files[0], "main.bmp");
    }

    #[test]
    fn test_load_saved_skin_missing_file() {
        let result = load_saved_skin("/nonexistent/skin.wsz".to_string()).unwrap();
        assert!(result.is_none());
    }

    #[test]
    fn test_load_saved_skin_valid() {
        let tmp = tempfile::tempdir().unwrap();
        let wsz = create_test_wsz(
            tmp.path(),
            "saved.wsz",
            &[("main.bmp", b"data")],
        );

        let result = load_saved_skin(wsz.to_string_lossy().to_string()).unwrap();
        assert!(result.is_some());
        let skin = result.unwrap();
        assert_eq!(skin.skin_name, "saved");
    }
}
