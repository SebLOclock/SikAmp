use tauri::command;
use walkdir::WalkDir;

const AUDIO_EXTENSIONS: [&str; 4] = ["mp3", "flac", "wav", "ogg"];

fn is_audio_file(path: &std::path::Path) -> bool {
    path.is_file()
        && path
            .extension()
            .and_then(|e| e.to_str())
            .map(|ext| AUDIO_EXTENSIONS.contains(&ext.to_lowercase().as_str()))
            .unwrap_or(false)
}

#[command]
pub fn list_audio_files(dir_path: String) -> Result<Vec<String>, String> {
    let entries = std::fs::read_dir(&dir_path).map_err(|e| e.to_string())?;
    let mut files = Vec::new();
    for entry in entries.flatten() {
        let path = entry.path();
        if is_audio_file(&path) {
            files.push(path.to_string_lossy().into_owned());
        }
    }
    files.sort();
    Ok(files)
}

#[command]
pub fn list_audio_files_recursive(dir_path: String) -> Result<Vec<String>, String> {
    let mut files = Vec::new();
    for entry in WalkDir::new(&dir_path)
        .max_depth(20)
        .into_iter()
        .filter_map(|e| e.ok())
    {
        let path = entry.path();
        if is_audio_file(path) {
            files.push(path.to_string_lossy().into_owned());
        }
    }
    files.sort();
    Ok(files)
}

/// Resolve a list of mixed paths (files and directories) into audio file paths.
/// Files with supported extensions are returned directly.
/// Directories are scanned recursively for audio files.
/// Other paths are silently ignored.
#[command]
pub fn resolve_audio_paths(paths: Vec<String>) -> Result<Vec<String>, String> {
    let mut files = Vec::new();
    for p in &paths {
        let path = std::path::Path::new(p);
        if path.is_dir() {
            for entry in WalkDir::new(path)
                .max_depth(20)
                .into_iter()
                .filter_map(|e| e.ok())
            {
                if is_audio_file(entry.path()) {
                    files.push(entry.path().to_string_lossy().into_owned());
                }
            }
        } else if is_audio_file(path) {
            files.push(p.clone());
        }
        // Other paths (extensionless files, unsupported extensions) are silently ignored
    }
    files.sort();
    Ok(files)
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;

    fn create_test_tree(base: &std::path::Path) {
        fs::create_dir_all(base.join("sub")).unwrap();
        fs::write(base.join("song.mp3"), b"").unwrap();
        fs::write(base.join("track.flac"), b"").unwrap();
        fs::write(base.join("readme.txt"), b"").unwrap();
        fs::write(base.join("sub").join("deep.ogg"), b"").unwrap();
        fs::write(base.join("sub").join("notes.pdf"), b"").unwrap();
    }

    #[test]
    fn test_list_audio_files_flat() {
        let dir = tempfile::tempdir().unwrap();
        create_test_tree(dir.path());
        let result = list_audio_files(dir.path().to_string_lossy().into_owned()).unwrap();
        assert_eq!(result.len(), 2);
        assert!(result.iter().any(|f| f.ends_with("song.mp3")));
        assert!(result.iter().any(|f| f.ends_with("track.flac")));
    }

    #[test]
    fn test_list_audio_files_recursive_finds_nested() {
        let dir = tempfile::tempdir().unwrap();
        create_test_tree(dir.path());
        let result = list_audio_files_recursive(dir.path().to_string_lossy().into_owned()).unwrap();
        assert_eq!(result.len(), 3);
        assert!(result.iter().any(|f| f.ends_with("song.mp3")));
        assert!(result.iter().any(|f| f.ends_with("track.flac")));
        assert!(result.iter().any(|f| f.ends_with("deep.ogg")));
    }

    #[test]
    fn test_list_audio_files_recursive_ignores_non_audio() {
        let dir = tempfile::tempdir().unwrap();
        create_test_tree(dir.path());
        let result = list_audio_files_recursive(dir.path().to_string_lossy().into_owned()).unwrap();
        assert!(!result.iter().any(|f| f.ends_with(".txt")));
        assert!(!result.iter().any(|f| f.ends_with(".pdf")));
    }

    #[test]
    fn test_list_audio_files_empty_dir() {
        let dir = tempfile::tempdir().unwrap();
        let result = list_audio_files_recursive(dir.path().to_string_lossy().into_owned()).unwrap();
        assert!(result.is_empty());
    }

    #[test]
    fn test_resolve_audio_paths_mixed() {
        let dir = tempfile::tempdir().unwrap();
        create_test_tree(dir.path());
        let paths = vec![
            dir.path().join("song.mp3").to_string_lossy().into_owned(),
            dir.path().join("sub").to_string_lossy().into_owned(),       // directory
            dir.path().join("readme.txt").to_string_lossy().into_owned(), // ignored
            dir.path().join("LICENSE").to_string_lossy().into_owned(),    // extensionless file — does not exist but won't crash
        ];
        let result = resolve_audio_paths(paths).unwrap();
        assert!(result.iter().any(|f| f.ends_with("song.mp3")));
        assert!(result.iter().any(|f| f.ends_with("deep.ogg")));
        assert!(!result.iter().any(|f| f.ends_with("readme.txt")));
    }

    #[test]
    fn test_resolve_audio_paths_dotted_directory() {
        let dir = tempfile::tempdir().unwrap();
        let dotted = dir.path().join("album.2024");
        fs::create_dir_all(&dotted).unwrap();
        fs::write(dotted.join("track.wav"), b"").unwrap();
        let paths = vec![dotted.to_string_lossy().into_owned()];
        let result = resolve_audio_paths(paths).unwrap();
        assert_eq!(result.len(), 1);
        assert!(result[0].ends_with("track.wav"));
    }
}
