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
    subnet_ids         = data.aws_subnets.private.ids
    security_group_ids = [data.aws_security_group.private_db.id]
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

# Lambda for running migrations
resource "aws_lambda_function" "migrations" {
  function_name = "clerkk-migrations"
  role          = aws_iam_role.lambda.arn
  package_type  = "Image"
  image_uri     = "${aws_ecr_repository.db_migrations.repository_url}:latest"
  timeout       = 300
  memory_size   = 512
  architectures = ["arm64"]

  vpc_config {
    subnet_ids         = data.aws_subnets.private.ids
    security_group_ids = [data.aws_security_group.private_db.id]
  }

  environment {
    variables = {
      ENVIRONMENT = var.environment
    }
  }

  tags = merge(local.common_tags, {
    Name = "clerkk-migrations"
  })
}
