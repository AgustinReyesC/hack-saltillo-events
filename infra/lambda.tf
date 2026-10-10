data "aws_secretsmanager_secret" "gemini" {
  name = var.gemini_secret_name
}

resource "aws_lambda_function" "agent" {
  function_name = "${var.project_name}-agent"
  role          = aws_iam_role.lambda.arn
  package_type  = "Image"
  image_uri     = "${aws_ecr_repository.lambda.repository_url}:${var.image_tag}"
  timeout       = var.lambda_timeout_seconds
  memory_size   = var.lambda_memory_mb
  architectures = ["x86_64"]

  environment {
    variables = {
      GEMINI_API_KEY_SECRET_ID = data.aws_secretsmanager_secret.gemini.name
      EVENTS_BUCKET            = aws_s3_bucket.events.bucket
      EVENTS_KEY               = var.events_key
      NODE_OPTIONS             = "--enable-source-maps"
    }
  }

  depends_on = [
    aws_iam_role_policy.lambda_inline,
    aws_cloudwatch_log_group.lambda,
  ]
}
