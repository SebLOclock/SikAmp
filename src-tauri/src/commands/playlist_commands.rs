use serde::{Deserialize, Serialize};
use tauri::command;

use crate::file_manager::playlist_io;

#[derive(Debug, Deserialize)]
pub struct SaveTrackInfo {
    pub path: String,
    pub title: String,
    pub artist: String,
    pub duration: f64,
}

#[derive(Debug, Serialize)]
pub struct LoadedPlaylistEntry {
    pub path: String,
    pub title: Option<String>,
    pub artist: Option<String>,
    pub duration: Option<u64>,
    pub exists: bool,
}

#[command]
pub fn save_playlist(path: String, tracks: Vec<SaveTrackInfo>) -> Result<(), String> {
    let track_infos: Vec<playlist_io::TrackInfo> = tracks
        .into_iter()
        .map(|t| playlist_io::TrackInfo {
            path: t.path,
            title: t.title,
            artist: t.artist,
            duration: t.duration,
        })
        .collect();

    playlist_io::write_m3u8(&path, &track_infos)
}

#[command]
pub fn load_playlist(path: String) -> Result<Vec<LoadedPlaylistEntry>, String> {
    let entries = playlist_io::read_m3u(&path)?;

    Ok(entries
        .into_iter()
        .map(|e| LoadedPlaylistEntry {
            path: e.path,
            title: e.title,
            artist: e.artist,
            duration: e.duration,
            exists: e.exists,
        })
        .collect())
}
