variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "ca-central-1"
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "clerkk"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "prod"
}
