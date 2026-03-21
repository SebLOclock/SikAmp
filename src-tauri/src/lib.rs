mod commands;
mod file_manager;
mod skin_parser;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .invoke_handler(tauri::generate_handler![
            commands::file_commands::list_audio_files,
            commands::file_commands::list_audio_files_recursive,
            commands::file_commands::resolve_audio_paths,
            commands::audio_commands::get_audio_metadata
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
