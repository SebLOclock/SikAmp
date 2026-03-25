use lofty::file::{AudioFile, TaggedFileExt};
use lofty::probe::Probe;
use lofty::tag::Accessor;
use serde::Serialize;
use tauri::command;

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AudioMetadata {
    pub title: Option<String>,
    pub artist: Option<String>,
    pub album: Option<String>,
    pub duration: f64,
    pub bitrate: Option<u32>,
    pub sample_rate: Option<u32>,
    pub channels: Option<u8>,
}

#[command]
pub async fn get_audio_metadata(path: String) -> Result<AudioMetadata, String> {
    tokio::task::spawn_blocking(move || read_metadata(&path))
        .await
        .map_err(|e| format!("Task join error: {}", e))?
}

fn read_metadata(path: &str) -> Result<AudioMetadata, String> {
    let tagged_file = Probe::open(path)
        .map_err(|e| format!("Cannot open file: {}", e))?
        .read()
        .map_err(|e| format!("Cannot read metadata: {}", e))?;

    let properties = tagged_file.properties();
    let duration = properties.duration().as_secs_f64();
    let bitrate = properties.overall_bitrate();
    let sample_rate = properties.sample_rate();
    let channels = properties.channels();

    let tag = tagged_file
        .primary_tag()
        .or_else(|| tagged_file.first_tag());

    let (title, artist, album) = if let Some(tag) = tag {
        (
            tag.title().map(|s| s.to_string()),
            tag.artist().map(|s| s.to_string()),
            tag.album().map(|s| s.to_string()),
        )
    } else {
        (None, None, None)
    };

    Ok(AudioMetadata {
        title,
        artist,
        album,
        duration,
        bitrate,
        sample_rate,
        channels,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn returns_error_for_nonexistent_file() {
        let result = read_metadata("/nonexistent/file.mp3");
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("Cannot open file"));
    }

    #[test]
    fn metadata_struct_serializes_with_camel_case() {
        let meta = AudioMetadata {
            title: Some("Test".to_string()),
            artist: None,
            album: None,
            duration: 120.5,
            bitrate: Some(320),
            sample_rate: Some(44100),
            channels: Some(2),
        };
        let json = serde_json::to_string(&meta).unwrap();
        assert!(json.contains("\"sampleRate\":44100"));
        assert!(json.contains("\"bitrate\":320"));
        assert!(json.contains("\"duration\":120.5"));
    }
}
