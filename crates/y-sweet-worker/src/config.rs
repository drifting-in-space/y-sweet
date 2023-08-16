use serde::{Deserialize, Serialize};
use std::time::Duration;
use worker::Env;

const BUCKET: &str = "Y_SWEET_DATA";
const AUTH_KEY: &str = "AUTH_KEY";
const CHECKPOINT_FREQ_SECONDS: &str = "CHECKPOINT_FREQ_SECONDS";
const S3_ACCESS_KEY_ID: &str = "AWS_ACCESS_KEY_ID";
const S3_SECRET_ACCESS_KEY: &str = "AWS_SECRET_ACCESS_KEY";
const S3_REGION: &str = "AWS_REGION";
const S3_BUCKET_PREFIX: &str = "S3_BUCKET_PREFIX";
const S3_BUCKET_NAME: &str = "S3_BUCKET_NAME";

#[derive(Serialize, Deserialize)]
pub struct S3Config {
    pub key: String,
    pub secret: String,
    pub bucket: String,
    pub region: String,
    pub bucket_prefix: Option<String>,
}

#[derive(Serialize, Deserialize)]
pub struct Configuration {
    pub auth_key: Option<String>,
    pub bucket: String,
    pub s3: Option<S3Config>,
    pub bucket_prefix: Option<String>,
    pub url_prefix: Option<String>,
    pub timeout_interval: Duration,
}

impl From<&Env> for Configuration {
    fn from(env: &Env) -> Self {
        let auth_key = env.var(AUTH_KEY).map(|s| s.to_string()).ok();
        let timeout_interval = Duration::from_secs(
            env.var(CHECKPOINT_FREQ_SECONDS)
                .map(|s| {
                    s.to_string()
                        .parse()
                        .expect("Could not parse CHECKPOINT_FREQ_SECONDS as u64")
                })
                .unwrap_or(45),
        );

        let s3_config = if let (
            Ok(aws_access_key_id),
            Ok(aws_secret_access_key),
            Ok(aws_region),
            Ok(bucket_prefix),
            Ok(bucket_name),
        ) = (
            env.var(S3_ACCESS_KEY_ID),
            env.var(S3_SECRET_ACCESS_KEY),
            env.var(S3_REGION),
            env.var(S3_BUCKET_PREFIX),
            env.var(S3_BUCKET_NAME),
        ) {
            Some(S3Config {
                key: aws_access_key_id.to_string(),
                region: aws_region.to_string(),
                secret: aws_secret_access_key.to_string(),
                bucket: bucket_name.to_string(),
                bucket_prefix: Some(bucket_prefix.to_string()),
            })
        } else {
            None
        };
        Self {
            auth_key,
            bucket: BUCKET.to_string(),
            s3: s3_config,
            bucket_prefix: None,
            url_prefix: None,
            timeout_interval,
        }
    }
}
