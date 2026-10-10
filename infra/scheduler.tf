resource "aws_scheduler_schedule" "audit" {
  name       = "${var.project_name}-audit"
  group_name = "default"

  flexible_time_window {
    mode = "OFF"
  }

  schedule_expression = var.schedule_expression

  target {
    arn      = aws_lambda_function.agent.arn
    role_arn = aws_iam_role.scheduler.arn

    input = jsonencode({
      source = "eventbridge.scheduler"
      action = "audit"
    })
  }
}
