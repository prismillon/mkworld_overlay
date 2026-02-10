use axum::{
    extract::{Query, State},
    http::{Method, StatusCode},
    response::{IntoResponse, Response},
    routing::get,
    Json, Router,
};
use serde::{Deserialize, Serialize};
use std::{collections::HashMap, sync::Arc, time::Duration};
use tower_http::{
    cors::{Any, CorsLayer},
    services::{ServeDir, ServeFile},
};
use tracing::{error, info};

#[derive(Debug, Deserialize)]
struct PlayerQuery {
    name: Option<String>,
    #[serde(default)]
    game: String,
}

/// Raw upstream API response from MKCentral
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct UpstreamPlayerData {
    name: String,
    country_code: Option<String>,
    country_name: Option<String>,
    mmr: Option<i64>,
    max_mmr: Option<i64>,
    overall_rank: Option<i64>,
    events_played: i64,
    win_rate: Option<f64>,
    win_loss_last_ten: Option<String>,
    gain_loss_last_ten: Option<i64>,
    largest_gain: Option<i64>,
    average_score: Option<f64>,
    average_last_ten: Option<f64>,
    rank: String,
    #[serde(default)]
    mmr_changes: Vec<MmrChange>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct MmrChange {
    mmr_delta: Option<i64>,
    reason: Option<String>,
    #[serde(default)]
    partner_scores: Vec<i64>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
struct PlayerData {
    name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    country_code: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    country_name: Option<String>,
    mmr: Option<i64>,
    max_mmr: Option<i64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    overall_rank: Option<i64>,
    events_played: i64,
    #[serde(skip_serializing_if = "Option::is_none")]
    win_rate: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    win_loss_last_ten: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    gain_loss_last_ten: Option<i64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    largest_gain: Option<i64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    average_score: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    average_last_ten: Option<f64>,
    rank: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    rank_icon_url: Option<String>,
    /// Average score of partners across all Table events
    #[serde(skip_serializing_if = "Option::is_none")]
    partner_avg: Option<f64>,
    /// MMR delta from the most recent Table event
    #[serde(skip_serializing_if = "Option::is_none")]
    last_diff: Option<i64>,
}

#[derive(Debug, Serialize)]
struct ErrorResponse {
    error: String,
}

fn rank_to_url(rank: &str) -> Option<&'static str> {
    match rank.to_lowercase().as_str() {
        "iron" => Some("/static/image/iron.png"),
        "bronze" => Some("/static/image/bronze.png"),
        "silver" => Some("/static/image/silver.png"),
        "gold" => Some("/static/image/gold.png"),
        "platinum" => Some("/static/image/platinum.png"),
        "sapphire" => Some("/static/image/sapphire.png"),
        "ruby" => Some("/static/image/ruby.png"),
        "diamond" => Some("/static/image/diamond.png"),
        "master" => Some("/static/image/master.png"),
        "grand master" | "grandmaster" => Some("/static/image/grandmaster.png"),
        _ => None,
    }
}

#[derive(Clone)]
struct AppState {
    client: reqwest::Client,
    cache: Arc<tokio::sync::RwLock<HashMap<String, (PlayerData, std::time::Instant)>>>,
}

impl AppState {
    fn new() -> Self {
        let client = reqwest::Client::builder()
            .timeout(Duration::from_secs(10))
            .user_agent("MKWorld-Overlay/1.0")
            .build()
            .expect("Failed to create HTTP client");

        Self {
            client,
            cache: Arc::new(tokio::sync::RwLock::new(HashMap::new())),
        }
    }

    async fn get_cached_or_fetch(
        &self,
        player_name: &str,
        game: &str,
    ) -> Result<PlayerData, String> {
        let game_param = match game {
            "12p" => "mkworld12p",
            _ => "mkworld24p",
        };
        let cache_key = format!("{}:{}", player_name.to_lowercase(), game_param);
        let cache_duration = Duration::from_secs(60);

        {
            let cache = self.cache.read().await;
            if let Some((data, timestamp)) = cache.get(&cache_key) {
                if timestamp.elapsed() < cache_duration {
                    info!("Cache hit for player: {}", player_name);
                    return Ok(data.clone());
                }
            }
        }

        info!(
            "Fetching data for player: {} (game: {})",
            player_name, game_param
        );
        let url = format!(
            "https://lounge.mkcentral.com/api/player/details?name={}&game={}",
            urlencoding::encode(player_name),
            game_param
        );

        let response = self
            .client
            .get(&url)
            .send()
            .await
            .map_err(|e| format!("Network error: {e}"))?;

        if !response.status().is_success() {
            let status = response.status();
            let error_text = response
                .text()
                .await
                .unwrap_or_else(|_| "Unknown error".to_string());
            return Err(format!("API error {status}: {error_text}"));
        }

        let upstream: UpstreamPlayerData = response
            .json()
            .await
            .map_err(|e| format!("JSON parse error: {e}"))?;

        // Compute partner_avg from all partner scores across Table events
        let table_events: Vec<&MmrChange> = upstream
            .mmr_changes
            .iter()
            .filter(|c| c.reason.as_deref() == Some("Table"))
            .collect();

        let partner_avg = {
            let all_scores: Vec<i64> = table_events
                .iter()
                .flat_map(|c| c.partner_scores.iter().copied())
                .collect();
            if all_scores.is_empty() {
                None
            } else {
                let sum: i64 = all_scores.iter().sum();
                Some((sum as f64 / all_scores.len() as f64 * 100.0).round() / 100.0)
            }
        };

        // Compute last_diff from the most recent Table event's mmrDelta
        let last_diff = table_events.first().and_then(|c| c.mmr_delta);

        let mut player_data = PlayerData {
            name: upstream.name,
            country_code: upstream.country_code,
            country_name: upstream.country_name,
            mmr: upstream.mmr,
            max_mmr: upstream.max_mmr,
            overall_rank: upstream.overall_rank,
            events_played: upstream.events_played,
            win_rate: upstream.win_rate,
            win_loss_last_ten: upstream.win_loss_last_ten,
            gain_loss_last_ten: upstream.gain_loss_last_ten,
            largest_gain: upstream.largest_gain,
            average_score: upstream.average_score,
            average_last_ten: upstream.average_last_ten,
            rank: upstream.rank,
            rank_icon_url: None,
            partner_avg,
            last_diff,
        };

        player_data.rank_icon_url = rank_to_url(&player_data.rank).map(|s| s.to_string());

        {
            let mut cache = self.cache.write().await;
            cache.insert(cache_key, (player_data.clone(), std::time::Instant::now()));

            cache.retain(|_, (_, timestamp)| timestamp.elapsed() < cache_duration * 2);
        }

        Ok(player_data)
    }
}

fn is_valid_player_name(name: &str) -> bool {
    !name.is_empty()
        && name
            .chars()
            .all(|c| c.is_alphanumeric() || c == ' ' || c == '.' || c == '_' || c == '-')
}

async fn api_player_details(
    Query(query): Query<PlayerQuery>,
    State(state): State<AppState>,
) -> Result<Json<PlayerData>, Response> {
    let player_name = match query.name {
        Some(name) if !name.trim().is_empty() => name.trim().to_string(),
        _ => {
            let error = ErrorResponse {
                error: "Player name is required".to_string(),
            };
            return Err((StatusCode::BAD_REQUEST, Json(error)).into_response());
        }
    };

    if !is_valid_player_name(&player_name) {
        let error = ErrorResponse {
            error: "Player name can only contain letters, numbers, spaces, and hyphens".to_string(),
        };
        return Err((StatusCode::BAD_REQUEST, Json(error)).into_response());
    }

    match state.get_cached_or_fetch(&player_name, &query.game).await {
        Ok(data) => Ok(Json(data)),
        Err(error_msg) => {
            error!("Failed to fetch player data: {}", error_msg);
            let error = ErrorResponse { error: error_msg };
            Err((StatusCode::INTERNAL_SERVER_ERROR, Json(error)).into_response())
        }
    }
}

async fn health_check() -> &'static str {
    "OK"
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    tracing_subscriber::fmt()
        .with_env_filter(
            std::env::var("RUST_LOG")
                .unwrap_or_else(|_| "mkworld_overlay=info,tower_http=info".to_string()),
        )
        .init();

    let state = AppState::new();

    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods([Method::GET])
        .allow_headers(Any);

    let spa_fallback = ServeFile::new("dist/index.html");

    let app = Router::new()
        .route("/health", get(health_check))
        .route("/api/player/details", get(api_player_details))
        .nest_service("/static", ServeDir::new("static"))
        .nest_service("/assets", ServeDir::new("dist/assets"))
        .fallback_service(ServeDir::new("dist").not_found_service(spa_fallback))
        .layer(cors)
        .with_state(state);

    let port = std::env::var("PORT")
        .unwrap_or_else(|_| "3000".to_string())
        .parse::<u16>()
        .unwrap_or(3000);

    let addr = format!("0.0.0.0:{port}");
    info!("Starting server on {}", addr);

    let listener = tokio::net::TcpListener::bind(&addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}
