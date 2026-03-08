# Generate random password
resource "random_password" "db_password" {
  length  = 32
  special = true
}

# Store DB password in Parameter Store
resource "aws_ssm_parameter" "db_password" {
  name        = "/clerkk/db/password"
  description = "Clerkk RDS master password"
  type        = "SecureString"
  value       = random_password.db_password.result

  tags = merge(local.common_tags, {
    Name = "clerkk-db-password"
  })
}

# Store complete PostgreSQL connection string
resource "aws_ssm_parameter" "db_connection_string" {
  name        = "/clerkk/db/connection_string"
  description = "Clerkk PostgreSQL connection string"
  type        = "SecureString"
  value       = "postgresql://${aws_db_instance.clerkk.username}:${random_password.db_password.result}@${aws_db_instance.clerkk.endpoint}/clerkk"

  tags = merge(local.common_tags, {
    Name = "clerkk-db-connection-string"
  })
}
