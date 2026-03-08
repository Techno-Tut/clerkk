# Security group for private database access
resource "aws_security_group" "private_db" {
  name        = "${var.project_name}-private-db-sg"
  description = "Allow PostgreSQL access in private subnets"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = [aws_vpc.main.cidr_block]
    description = "PostgreSQL from VPC"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name    = "${var.project_name}-private-db-sg"
    MANAGED = "TERRAFORM"
  }
}

output "private_db_sg_id" {
  value = aws_security_group.private_db.id
}
