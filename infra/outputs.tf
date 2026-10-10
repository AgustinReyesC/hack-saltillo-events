output "aws_region" {
  description = "Región de despliegue."
  value       = data.aws_region.current.name
}

output "ecr_repository_url" {
  description = "URL del repositorio ECR (para docker build/push)."
  value       = aws_ecr_repository.lambda.repository_url
}

output "ecr_repository_name" {
  description = "Nombre del repositorio ECR."
  value       = aws_ecr_repository.lambda.name
}

output "lambda_function_name" {
  description = "Nombre de la función Lambda."
  value       = aws_lambda_function.agent.function_name
}

output "lambda_function_arn" {
  description = "ARN de la función Lambda."
  value       = aws_lambda_function.agent.arn
}

output "events_bucket" {
  description = "Bucket S3 que contiene events.jsonl."
  value       = aws_s3_bucket.events.bucket
}

output "events_key" {
  description = "Key del objeto de eventos."
  value       = var.events_key
}

output "schedule_expression" {
  description = "Expresión del schedule de auditoría."
  value       = aws_scheduler_schedule.audit.schedule_expression
}

output "gemini_secret_name" {
  description = "Nombre del secreto de Secrets Manager usado."
  value       = data.aws_secretsmanager_secret.gemini.name
}
