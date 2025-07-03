use axum::{
    extract::{Query, State},
    http::{Method, StatusCode},
    response::{Html, IntoResponse, Response},
    routing::get,
    Json, Router,
};
use serde::{Deserialize, Serialize};
use std::{collections::HashMap, sync::Arc, time::Duration};
use tower_http::{
    cors::{Any, CorsLayer},
    services::ServeDir,
};
use tracing::{error, info};

#[derive(Debug, Deserialize)]
struct PlayerQuery {
    name: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
struct PlayerData {
    mmr: Option<f64>,
    #[serde(flatten)]
    other: HashMap<String, serde_json::Value>,
}

#[derive(Debug, Serialize)]
struct ErrorResponse {
    error: String,
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

    async fn get_cached_or_fetch(&self, player_name: &str) -> Result<PlayerData, String> {
        let cache_key = player_name.to_lowercase();
        let cache_duration = Duration::from_secs(60);

        // Check cache first
        {
            let cache = self.cache.read().await;
            if let Some((data, timestamp)) = cache.get(&cache_key) {
                if timestamp.elapsed() < cache_duration {
                    info!("Cache hit for player: {}", player_name);
                    return Ok(data.clone());
                }
            }
        }

        // Fetch from API
        info!("Fetching data for player: {}", player_name);
        let url = format!(
            "https://lounge.mkcentral.com/api/player/details?name={}&game=mkworld",
            urlencoding::encode(player_name)
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

        let player_data: PlayerData = response
            .json()
            .await
            .map_err(|e| format!("JSON parse error: {e}"))?;

        // Update cache
        {
            let mut cache = self.cache.write().await;
            cache.insert(cache_key, (player_data.clone(), std::time::Instant::now()));

            // Clean old cache entries
            cache.retain(|_, (_, timestamp)| timestamp.elapsed() < cache_duration * 2);
        }

        Ok(player_data)
    }
}

fn is_valid_player_name(name: &str) -> bool {
    !name.is_empty()
        && name
            .chars()
            .all(|c| c.is_alphanumeric() || c == ' ' || c == '-' || c == '_')
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

    // Validate player name contains only alphanumeric characters and spaces
    if !is_valid_player_name(&player_name) {
        let error = ErrorResponse {
            error: "Player name can only contain letters, numbers, spaces, and hyphens".to_string(),
        };
        return Err((StatusCode::BAD_REQUEST, Json(error)).into_response());
    }

    match state.get_cached_or_fetch(&player_name).await {
        Ok(data) => Ok(Json(data)),
        Err(error_msg) => {
            error!("Failed to fetch player data: {}", error_msg);
            let error = ErrorResponse { error: error_msg };
            Err((StatusCode::INTERNAL_SERVER_ERROR, Json(error)).into_response())
        }
    }
}

async fn serve_index() -> Html<&'static str> {
    Html(include_str!("../index.html"))
}

async fn health_check() -> &'static str {
    "OK"
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // Initialize tracing
    tracing_subscriber::fmt()
        .with_env_filter(
            std::env::var("RUST_LOG")
                .unwrap_or_else(|_| "mkworld_overlay=info,tower_http=info".to_string()),
        )
        .init();

    let state = AppState::new();

    // Create CORS layer
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods([Method::GET])
        .allow_headers(Any);

    // Build the router
    let app = Router::new()
        .route("/", get(serve_index))
        .route("/health", get(health_check))
        .route("/api/player/details", get(api_player_details))
        .nest_service("/static", ServeDir::new("static"))
        .nest_service("/assets", ServeDir::new("dist/assets"))
        .layer(cors)
        .with_state(state);

    // Determine the port
    let port = std::env::var("PORT")
        .unwrap_or_else(|_| "3000".to_string())
        .parse::<u16>()
        .unwrap_or(3000);

    let addr = format!("0.0.0.0:{port}");
    info!("Starting server on {}", addr);

    // Start the server
    let listener = tokio::net::TcpListener::bind(&addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}
