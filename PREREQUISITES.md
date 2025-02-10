### Synthetics
- S3 bucket
-- cm-cloudwatch-synthetics-artifacts--{{env}} // test | prod | dev | NONPROD
-- cm-cloudwatch-synthetics-sources--{{env}} // test | prod | dev | NONPROD
- AWS IAM role with following permissions (cm-monitoring-synthetics)
-- AmazonS3FullAccess
-- CloudWatchFullAccess
-- CloudWatchLogsFullAccess 