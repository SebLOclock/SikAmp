use std::fs;
use std::io::{BufRead, BufReader, Write};
use std::path::Path;

/// Track information for writing M3U8 playlists.
#[derive(Debug, Clone, serde::Deserialize)]
pub struct TrackInfo {
    pub path: String,
    pub title: String,
    pub artist: String,
    pub duration: f64,
}

/// Entry parsed from an M3U/M3U8 playlist file.
#[derive(Debug, Clone, serde::Serialize)]
pub struct PlaylistEntry {
    pub path: String,
    pub title: Option<String>,
    pub artist: Option<String>,
    pub duration: Option<u64>,
    pub exists: bool,
}

/// Write tracks to an M3U8 file.
///
/// Format:
/// ```text
/// #EXTM3U
/// #EXTINF:234,Artist - Title
/// /absolute/path/to/file.mp3
/// ```
pub fn write_m3u8(path: &str, tracks: &[TrackInfo]) -> Result<(), String> {
    let mut file = fs::File::create(path).map_err(|e| format!("Cannot create file: {}", e))?;

    writeln!(file, "#EXTM3U").map_err(|e| format!("Write error: {}", e))?;

    for track in tracks {
        let duration = track.duration.round().max(0.0) as u64;
        let display = if track.artist.is_empty() || track.artist == "Inconnu" {
            track.title.clone()
        } else {
            format!("{} - {}", track.artist, track.title)
        };
        writeln!(file, "#EXTINF:{},{}", duration, display)
            .map_err(|e| format!("Write error: {}", e))?;
        writeln!(file, "{}", track.path).map_err(|e| format!("Write error: {}", e))?;
    }

    Ok(())
}

/// Read an M3U or M3U8 playlist file.
///
/// Supports both extended M3U (with #EXTINF lines) and simple M3U (paths only).
/// Checks file existence for each entry.
pub fn read_m3u(path: &str) -> Result<Vec<PlaylistEntry>, String> {
    let file = fs::File::open(path).map_err(|e| format!("Cannot open file: {}", e))?;
    let reader = BufReader::new(file);

    // Resolve relative paths against the playlist file's parent directory
    let playlist_dir = Path::new(path).parent().unwrap_or_else(|| Path::new("."));

    let mut entries = Vec::new();
    let mut pending_extinf: Option<(u64, String)> = None;

    for line in reader.lines() {
        let line = line.map_err(|e| format!("Read error: {}", e))?;
        let trimmed = line.trim();

        if trimmed.is_empty() || trimmed == "#EXTM3U" {
            continue;
        }

        if let Some(extinf) = trimmed.strip_prefix("#EXTINF:") {
            // Parse #EXTINF:duration,display name
            if let Some((dur_str, display)) = extinf.split_once(',') {
                let duration = dur_str.trim().parse::<u64>().unwrap_or(0);
                pending_extinf = Some((duration, display.trim().to_string()));
            }
            continue;
        }

        // Skip other comment lines
        if trimmed.starts_with('#') {
            continue;
        }

        // This is a file path line — resolve relative paths against playlist directory
        let raw_path = Path::new(trimmed);
        let resolved = if raw_path.is_absolute() {
            raw_path.to_path_buf()
        } else {
            playlist_dir.join(raw_path)
        };
        let file_path = resolved.to_string_lossy().to_string();
        let exists = resolved.exists();

        let entry = if let Some((duration, display)) = pending_extinf.take() {
            // Parse "Artist - Title" from display name
            let (artist, title) = if let Some((a, t)) = display.split_once(" - ") {
                (Some(a.trim().to_string()), Some(t.trim().to_string()))
            } else {
                (None, Some(display))
            };
            PlaylistEntry {
                path: file_path,
                title,
                artist,
                duration: Some(duration),
                exists,
            }
        } else {
            PlaylistEntry {
                path: file_path,
                title: None,
                artist: None,
                duration: None,
                exists,
            }
        };

        entries.push(entry);
    }

    Ok(entries)
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;

    #[test]
    fn test_write_m3u8_creates_valid_file() {
        let dir = tempfile::tempdir().unwrap();
        let path = dir.path().join("test.m3u8");
        let path_str = path.to_string_lossy().to_string();

        let tracks = vec![
            TrackInfo {
                path: "/music/song1.mp3".to_string(),
                title: "Bring Me To Life".to_string(),
                artist: "Evanescence".to_string(),
                duration: 234.5,
            },
            TrackInfo {
                path: "/music/song2.flac".to_string(),
                title: "One More Time".to_string(),
                artist: "Daft Punk".to_string(),
                duration: 276.0,
            },
        ];

        write_m3u8(&path_str, &tracks).unwrap();

        let content = fs::read_to_string(&path).unwrap();
        let lines: Vec<&str> = content.lines().collect();
        assert_eq!(lines[0], "#EXTM3U");
        assert_eq!(lines[1], "#EXTINF:235,Evanescence - Bring Me To Life");
        assert_eq!(lines[2], "/music/song1.mp3");
        assert_eq!(lines[3], "#EXTINF:276,Daft Punk - One More Time");
        assert_eq!(lines[4], "/music/song2.flac");
    }

    #[test]
    fn test_write_m3u8_unknown_artist() {
        let dir = tempfile::tempdir().unwrap();
        let path = dir.path().join("test.m3u8");
        let path_str = path.to_string_lossy().to_string();

        let tracks = vec![TrackInfo {
            path: "/music/track.mp3".to_string(),
            title: "My Track".to_string(),
            artist: "Inconnu".to_string(),
            duration: 180.0,
        }];

        write_m3u8(&path_str, &tracks).unwrap();

        let content = fs::read_to_string(&path).unwrap();
        assert!(content.contains("#EXTINF:180,My Track"));
        assert!(!content.contains("Inconnu"));
    }

    #[test]
    fn test_write_m3u8_empty_artist() {
        let dir = tempfile::tempdir().unwrap();
        let path = dir.path().join("test.m3u8");
        let path_str = path.to_string_lossy().to_string();

        let tracks = vec![TrackInfo {
            path: "/music/track.mp3".to_string(),
            title: "My Track".to_string(),
            artist: String::new(),
            duration: 120.0,
        }];

        write_m3u8(&path_str, &tracks).unwrap();

        let content = fs::read_to_string(&path).unwrap();
        assert!(content.contains("#EXTINF:120,My Track"));
    }

    #[test]
    fn test_read_m3u8_extended_format() {
        let dir = tempfile::tempdir().unwrap();
        let playlist_path = dir.path().join("test.m3u8");

        // Create a real audio file so exists check passes
        let audio_path = dir.path().join("song.mp3");
        fs::write(&audio_path, b"fake audio").unwrap();

        let content = format!(
            "#EXTM3U\n#EXTINF:234,Evanescence - Bring Me To Life\n{}\n",
            audio_path.to_string_lossy()
        );
        fs::write(&playlist_path, &content).unwrap();

        let entries = read_m3u(&playlist_path.to_string_lossy()).unwrap();
        assert_eq!(entries.len(), 1);
        assert_eq!(entries[0].artist.as_deref(), Some("Evanescence"));
        assert_eq!(entries[0].title.as_deref(), Some("Bring Me To Life"));
        assert_eq!(entries[0].duration, Some(234));
        assert!(entries[0].exists);
    }

    #[test]
    fn test_read_m3u_simple_format() {
        let dir = tempfile::tempdir().unwrap();
        let playlist_path = dir.path().join("test.m3u");

        let audio_path = dir.path().join("track.flac");
        fs::write(&audio_path, b"fake").unwrap();

        let content = format!("{}\n", audio_path.to_string_lossy());
        fs::write(&playlist_path, &content).unwrap();

        let entries = read_m3u(&playlist_path.to_string_lossy()).unwrap();
        assert_eq!(entries.len(), 1);
        assert!(entries[0].title.is_none());
        assert!(entries[0].artist.is_none());
        assert!(entries[0].duration.is_none());
        assert!(entries[0].exists);
    }

    #[test]
    fn test_read_m3u_missing_file() {
        let dir = tempfile::tempdir().unwrap();
        let playlist_path = dir.path().join("test.m3u8");

        let content = "#EXTM3U\n#EXTINF:100,Artist - Title\n/nonexistent/path.mp3\n";
        fs::write(&playlist_path, content).unwrap();

        let entries = read_m3u(&playlist_path.to_string_lossy()).unwrap();
        assert_eq!(entries.len(), 1);
        assert!(!entries[0].exists);
    }

    #[test]
    fn test_read_m3u_multiple_tracks() {
        let dir = tempfile::tempdir().unwrap();
        let playlist_path = dir.path().join("test.m3u8");

        let audio1 = dir.path().join("a.mp3");
        let audio2 = dir.path().join("b.flac");
        fs::write(&audio1, b"").unwrap();
        fs::write(&audio2, b"").unwrap();

        let content = format!(
            "#EXTM3U\n#EXTINF:200,Alpha - Song A\n{}\n#EXTINF:300,Beta - Song B\n{}\n",
            audio1.to_string_lossy(),
            audio2.to_string_lossy()
        );
        fs::write(&playlist_path, &content).unwrap();

        let entries = read_m3u(&playlist_path.to_string_lossy()).unwrap();
        assert_eq!(entries.len(), 2);
        assert_eq!(entries[0].artist.as_deref(), Some("Alpha"));
        assert_eq!(entries[1].artist.as_deref(), Some("Beta"));
    }

    #[test]
    fn test_read_m3u_no_artist_separator() {
        let dir = tempfile::tempdir().unwrap();
        let playlist_path = dir.path().join("test.m3u8");

        let content = "#EXTM3U\n#EXTINF:150,Just A Title\n/some/path.mp3\n";
        fs::write(&playlist_path, content).unwrap();

        let entries = read_m3u(&playlist_path.to_string_lossy()).unwrap();
        assert_eq!(entries.len(), 1);
        assert!(entries[0].artist.is_none());
        assert_eq!(entries[0].title.as_deref(), Some("Just A Title"));
    }

    #[test]
    fn test_roundtrip_write_then_read() {
        let dir = tempfile::tempdir().unwrap();
        let playlist_path = dir.path().join("roundtrip.m3u8");
        let path_str = playlist_path.to_string_lossy().to_string();

        let tracks = vec![
            TrackInfo {
                path: "/music/a.mp3".to_string(),
                title: "Song A".to_string(),
                artist: "Artist A".to_string(),
                duration: 200.0,
            },
            TrackInfo {
                path: "/music/b.flac".to_string(),
                title: "Song B".to_string(),
                artist: String::new(),
                duration: 300.0,
            },
        ];

        write_m3u8(&path_str, &tracks).unwrap();
        let entries = read_m3u(&path_str).unwrap();

        assert_eq!(entries.len(), 2);
        assert_eq!(entries[0].artist.as_deref(), Some("Artist A"));
        assert_eq!(entries[0].title.as_deref(), Some("Song A"));
        assert_eq!(entries[0].duration, Some(200));
        // Second track has no artist, so title is just "Song B"
        assert_eq!(entries[1].title.as_deref(), Some("Song B"));
        assert_eq!(entries[1].duration, Some(300));
    }

    #[test]
    fn test_write_m3u8_error_on_invalid_path() {
        let result = write_m3u8("/nonexistent/dir/file.m3u8", &[]);
        assert!(result.is_err());
    }

    #[test]
    fn test_read_m3u_error_on_missing_file() {
        let result = read_m3u("/nonexistent/playlist.m3u8");
        assert!(result.is_err());
    }

    #[test]
    fn test_read_m3u_relative_paths_resolved() {
        let dir = tempfile::tempdir().unwrap();
        let subdir = dir.path().join("music");
        fs::create_dir(&subdir).unwrap();

        let audio_path = subdir.join("song.mp3");
        fs::write(&audio_path, b"fake audio").unwrap();

        let playlist_path = dir.path().join("playlist.m3u8");
        let content = "#EXTM3U\n#EXTINF:120,Artist - Song\nmusic/song.mp3\n";
        fs::write(&playlist_path, content).unwrap();

        let entries = read_m3u(&playlist_path.to_string_lossy()).unwrap();
        assert_eq!(entries.len(), 1);
        assert!(
            entries[0].exists,
            "Relative path should resolve against playlist directory"
        );
        assert!(entries[0].path.contains("music/song.mp3"));
    }

    #[test]
    fn test_read_m3u_empty_lines_and_comments_ignored() {
        let dir = tempfile::tempdir().unwrap();
        let playlist_path = dir.path().join("test.m3u8");

        let content = "#EXTM3U\n\n# Some comment\n\n#EXTINF:100,Test - Track\n/some/path.mp3\n\n";
        fs::write(&playlist_path, content).unwrap();

        let entries = read_m3u(&playlist_path.to_string_lossy()).unwrap();
        assert_eq!(entries.len(), 1);
    }
}
