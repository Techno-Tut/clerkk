output "rds_endpoint" {
  description = "RDS instance endpoint"
  value       = aws_db_instance.clerkk.endpoint
}

output "db_name" {
  description = "Database name"
  value       = aws_db_instance.clerkk.db_name
}

output "ecr_repository_url" {
  description = "ECR repository URL"
  value       = aws_ecr_repository.backend.repository_url
}

output "api_gateway_url" {
  description = "API Gateway URL"
  value       = aws_apigatewayv2_api.main.api_endpoint
}

output "lambda_function_name" {
  description = "Lambda function name"
  value       = aws_lambda_function.api.function_name
}
