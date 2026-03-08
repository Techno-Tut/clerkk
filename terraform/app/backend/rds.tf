# Get VPC from remote state
data "terraform_remote_state" "account" {
  backend = "s3"
  config = {
    bucket = "clerkk-terraform-state-ap-south-1"
    key    = "account/terraform.tfstate"
    region = "ca-central-1"
  }
}

# Get VPC by name
data "aws_vpc" "main" {
  filter {
    name   = "tag:Name"
    values = ["clerkk-vpc"]
  }
}

# Get private subnets
data "aws_subnets" "private" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.main.id]
  }
  filter {
    name   = "tag:Type"
    values = ["private"]
  }
}

# Get private DB security group
data "aws_security_group" "private_db" {
  filter {
    name   = "tag:Name"
    values = ["clerkk-private-db-sg"]
  }
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.main.id]
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

  vpc_security_group_ids = [data.aws_security_group.private_db.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name

  publicly_accessible = false
  multi_az            = false

  backup_retention_period = 0
  skip_final_snapshot     = true

  tags = merge(local.common_tags, {
    Name = "clerkk-postgres"
  })
}

# Subnet group using private subnets
resource "aws_db_subnet_group" "main" {
  name       = "clerkk-db-subnet-group"
  subnet_ids = data.aws_subnets.private.ids

  tags = merge(local.common_tags, {
    Name = "clerkk-db-subnet-group"
  })
}
