use tauri::command;

#[command]
pub fn list_audio_files(dir_path: String) -> Result<Vec<String>, String> {
    let entries = std::fs::read_dir(&dir_path).map_err(|e| e.to_string())?;
    let extensions = ["mp3", "flac", "wav", "ogg"];
    let mut files = Vec::new();
    for entry in entries.flatten() {
        let path = entry.path();
        if path.is_file() {
            if let Some(ext) = path.extension().and_then(|e| e.to_str()) {
                if extensions.contains(&ext.to_lowercase().as_str()) {
                    files.push(path.to_string_lossy().into_owned());
                }
            }
        }
    }
    files.sort();
    Ok(files)
}
