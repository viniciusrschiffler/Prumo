use serde::Deserialize;
use serde_json::Value as JsonValue;
use sqlx::Executor;
use tauri::State;
use tauri_plugin_sql::{DbInstances, DbPool};

#[derive(Deserialize)]
pub struct BatchStatement {
    query: String,
    values: Vec<JsonValue>,
}

/// Roda todas as instruções em uma única conexão, dentro de uma transação.
/// O `execute` do plugin devolve a conexão ao pool a cada chamada, então BEGIN e COMMIT
/// emitidos do TypeScript caem em conexões diferentes e não têm efeito.
#[tauri::command]
pub async fn execute_batch(
    db_instances: State<'_, DbInstances>,
    db: String,
    statements: Vec<BatchStatement>,
) -> Result<u64, String> {
    let instances = db_instances.0.read().await;
    let pool = instances
        .get(&db)
        .ok_or_else(|| format!("banco {db} não está carregado"))?;

    let sqlite_pool = match pool {
        DbPool::Sqlite(sqlite_pool) => sqlite_pool,
    };

    let mut transaction = sqlite_pool.begin().await.map_err(|cause| cause.to_string())?;
    let mut affected_rows = 0_u64;

    for statement in statements {
        let mut query = sqlx::query(&statement.query);

        for value in statement.values {
            if value.is_null() {
                query = query.bind(None::<JsonValue>);
            } else if value.is_string() {
                query = query.bind(value.as_str().unwrap_or_default().to_owned());
            } else if let Some(number) = value.as_number() {
                query = query.bind(number.as_f64().unwrap_or_default());
            } else {
                query = query.bind(value);
            }
        }

        let outcome = transaction
            .execute(query)
            .await
            .map_err(|cause| cause.to_string())?;

        affected_rows += outcome.rows_affected();
    }

    transaction.commit().await.map_err(|cause| cause.to_string())?;

    Ok(affected_rows)
}
