output "db_endpoint" {
  description = "The connection endpoint"
  value       = aws_db_instance.default.endpoint
}

output "db_port" {
  description = "The database port"
  value       = aws_db_instance.default.port
}

output "db_username" {
  description = "The database username"
  value       = aws_db_instance.default.username
}

output "db_password" {
  description = "The database password"
  sensitive   = true
  value       = random_password.password.result
}
