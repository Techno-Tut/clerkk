# Get default VPC
data "aws_vpc" "default" {
  default = true
}

# Get default subnets
data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
}

# RDS instance - free tier eligible
resource "aws_db_instance" "clerkk" {
  identifier     = "clerkk-db"
  engine         = "postgres"
  engine_version = "18.3"
  instance_class = "db.t3.micro"

  allocated_storage = 20
  storage_type      = "gp3"
  storage_encrypted = true

  db_name  = "clerkk"
  username = "clerkk_admin"
  password = random_password.db_password.result

  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name

  publicly_accessible = true
  multi_az            = false

  backup_retention_period = 0
  skip_final_snapshot     = true

  tags = merge(local.common_tags, {
    Name = "clerkk-postgres"
  })
}

# Security group for RDS
resource "aws_security_group" "rds" {
  name        = "clerkk-rds-sg"
  description = "Allow PostgreSQL access"
  vpc_id      = data.aws_vpc.default.id

  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "PostgreSQL from anywhere (secured by password)"
  }

  tags = merge(local.common_tags, {
    Name = "clerkk-rds-sg"
  })
}

# Subnet group using default subnets
resource "aws_db_subnet_group" "main" {
  name       = "clerkk-db-subnet-group"
  subnet_ids = data.aws_subnets.default.ids

  tags = merge(local.common_tags, {
    Name = "clerkk-db-subnet-group"
  })
}
