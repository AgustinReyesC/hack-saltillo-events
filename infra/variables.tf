variable "aws_region" {
  description = "Región de AWS donde desplegar."
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Prefijo usado para nombrar los recursos."
  type        = string
  default     = "hack-saltillo-events"
}

variable "image_tag" {
  description = "Tag de la imagen en ECR que usará la Lambda."
  type        = string
  default     = "latest"
}

variable "gemini_secret_name" {
  description = "Nombre del secreto en AWS Secrets Manager con la API key de Gemini."
  type        = string
  default     = "hack-saltillo-events-gemini-api-key"
}

variable "schedule_expression" {
  description = "Expresión de EventBridge Scheduler para la auditoría periódica."
  type        = string
  default     = "rate(10 minutes)"
}

variable "events_key" {
  description = "Key del objeto JSONL de eventos dentro del bucket S3."
  type        = string
  default     = "events.jsonl"
}

variable "log_retention_days" {
  description = "Días de retención de los logs en CloudWatch."
  type        = number
  default     = 14
}

variable "lambda_memory_mb" {
  description = "Memoria (MB) asignada a la Lambda."
  type        = number
  default     = 512
}

variable "api_url" {
  description = "URL base de la API de inventario (ALB de hack-saltillo-api). La API invoca esta Lambda por IAM para /chat y notificaciones."
  type        = string
  default     = "http://hack-saltillo-api-850670948.us-east-1.elb.amazonaws.com"
}

variable "lambda_architecture" {
  description = "Arquitectura de la imagen; debe coincidir con el --platform del docker build (x86_64 = linux/amd64)."
  type        = string
  default     = "x86_64"
}

variable "lambda_timeout_seconds" {
  description = "Timeout (segundos) de la Lambda."
  type        = number
  default     = 60
}
