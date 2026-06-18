variable "project" {
  description = "Project name used when naming deployment resources."
  type        = string
  default     = "denki"
}

variable "environment" {
  description = "Deployment environment."
  type        = string
  default     = "development"

  validation {
    condition = contains(
      ["development", "staging", "production"],
      var.environment,
    )
    error_message = "Environment must be development, staging, or production."
  }
}
