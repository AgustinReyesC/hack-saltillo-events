resource "aws_cloudwatch_log_group" "lambda" {
  name              = "/aws/lambda/${var.project_name}-agent"
  retention_in_days = var.log_retention_days
}
