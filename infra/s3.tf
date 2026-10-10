resource "aws_s3_bucket" "events" {
  bucket        = "${var.project_name}-events-${data.aws_caller_identity.current.account_id}"
  force_destroy = true
}

resource "aws_s3_bucket_public_access_block" "events" {
  bucket                  = aws_s3_bucket.events.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "events" {
  bucket = aws_s3_bucket.events.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_object" "events_jsonl" {
  bucket       = aws_s3_bucket.events.id
  key          = var.events_key
  source       = "${path.module}/../data/events.jsonl"
  etag         = filemd5("${path.module}/../data/events.jsonl")
  content_type = "application/x-ndjson"
}

resource "aws_lambda_permission" "allow_s3" {
  statement_id  = "AllowExecutionFromS3"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.agent.function_name
  principal     = "s3.amazonaws.com"
  source_arn    = aws_s3_bucket.events.arn
}

resource "aws_s3_bucket_notification" "events" {
  bucket = aws_s3_bucket.events.id

  lambda_function {
    lambda_function_arn = aws_lambda_function.agent.arn
    events              = ["s3:ObjectCreated:*"]
  }

  depends_on = [aws_lambda_permission.allow_s3]
}
