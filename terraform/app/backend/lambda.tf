# Lambda execution role
resource "aws_iam_role" "lambda" {
  name = "clerkk-lambda-role-${var.aws_region}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })

  tags = merge(local.common_tags, {
    Name = "clerkk-lambda-role-${var.aws_region}"
  })
}

# Attach basic Lambda execution policy
resource "aws_iam_role_policy_attachment" "lambda_basic" {
  role       = aws_iam_role.lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# Policy for Lambda to access VPC (for RDS)
resource "aws_iam_role_policy_attachment" "lambda_vpc" {
  role       = aws_iam_role.lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}

# Policy for Lambda to read SSM parameters
resource "aws_iam_role_policy" "lambda_ssm" {
  name = "clerkk-lambda-ssm-policy-${var.aws_region}"
  role = aws_iam_role.lambda.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "ssm:GetParameter",
        "ssm:GetParameters"
      ]
      Resource = [
        aws_ssm_parameter.db_password.arn,
        aws_ssm_parameter.db_connection_string.arn
      ]
    }]
  })
}

# Lambda function
resource "aws_lambda_function" "api" {
  function_name = "clerkk-api"
  role          = aws_iam_role.lambda.arn
  package_type  = "Image"
  image_uri     = "${aws_ecr_repository.backend.repository_url}:latest"
  architectures = ["arm64"]

  timeout     = 30
  memory_size = 512

  vpc_config {
    subnet_ids         = data.aws_subnets.default.ids
    security_group_ids = [aws_security_group.lambda.id]
  }

  environment {
    variables = {
      ENVIRONMENT = var.environment
    }
  }

  tags = merge(local.common_tags, {
    Name = "clerkk-api-lambda"
  })
}

# Security group for Lambda
resource "aws_security_group" "lambda" {
  name        = "clerkk-lambda-sg"
  description = "Security group for Clerkk Lambda"
  vpc_id      = data.aws_vpc.default.id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "clerkk-lambda-sg"
  })
}

# Allow Lambda to access RDS
resource "aws_security_group_rule" "rds_from_lambda" {
  type                     = "ingress"
  from_port                = 5432
  to_port                  = 5432
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.lambda.id
  security_group_id        = aws_security_group.rds.id
  description              = "PostgreSQL from Lambda"
}
